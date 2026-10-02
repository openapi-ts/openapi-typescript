---
title: 高度な使い方
description: 高度な使い方、ヒント、テクニック、ベストプラクティス
---

# 高度な使い方

高度な使い方やさまざまなトピックについて説明します。これは _多くの人のための_ 緩やかな提案であり、もしあなたの設定に合わない場合は、ご自由に無視してください。

## デバッグ

デバッグを有効にするには、環境変数 `DEBUG=openapi-ts:*` を以下のように設定します：

```sh
$ DEBUG=openapi-ts:* npx openapi-typescript schema.yaml -o my-types.ts
```

特定の種類のデバッグメッセージのみを表示するには、`DEBUG=openapi-ts:[scope]` を設定します。利用可能なスコープには、`redoc` 、`lint` 、`bundle` 、`ts` があります。

出力が `stdout` の場合、デバッグメッセージは抑制されることに注意してください。

## Enum の拡張

`x-enum-varnames` は、対応する値に別の列挙型名を定義するために使用されます。これは enum の項目名を定義するために使用されます。

`x-enum-descriptions` は、各値に対して個別の説明を提供するために使用できます。これは、コード内のコメント（Javaの場合はjavadocのようなもの）として使用されます。

`x-enum-descriptions`および`x-enum-varnames`は、それぞれ Enum と同じ数の項目を含むリストであることが期待されます。リスト内の項目の順序は重要です：位置を参考にしてこれらを結びつけます。

例：

::: code-group

```yaml [my-openapi-3-schema.yaml]
ErrorCode:
  type: integer
  format: int32
  enum:
    - 100
    - 200
    - 300
  x-enum-varnames:
    - Unauthorized
    - AccessDenied
    - Unknown
  x-enum-descriptions:
    - "ユーザーは認証されていません"
    - "ユーザーにはこのリソースへのアクセス権がありません"
    - "何かがうまくいきませんでした"
```

:::

これは、次のようになります：

::: code-group

```ts [my-openapi-3-schema.d.ts]
enum ErrorCode {
  // ユーザーは認証されていません
  Unauthorized = 100
  // ユーザーにはこのリソースへのアクセス権がありません
  AccessDenied = 200
  // 何かがうまくいきませんでした
  Unknown = 300
}
```

:::

この方法で生成するには、[コマンドライン](cli#%E3%83%95%E3%83%A9%E3%82%AF%E3%82%99)で `--enum` を指定する必要があります。

または、`x-enumNames`および`x-enumDescriptions`（[NSwag/NJsonSchema](https://github.com/RicoSuter/NJsonSchema/wiki/Enums#enum-names-and-descriptions)）も使用できます。

## スタイルガイド

型生成を改善するためのいくつかの推奨項目を紹介します。

### Redocly ルール

TypeScript生成におけるエラーを減らすために、[Redocly config](https://redocly.com/docs/cli/rules/built-in-rules/) で次の組み込みルールを適用することをお勧めします：

| ルール                                                                                        |        設定        | 理由                             |
| :-------------------------------------------------------------------------------------------- | :----------------: | :------------------------------- |
| [operation-operationId-unique](https://redocly.com/docs/cli/rules/built-in-rules/#operations) |      `error`       | 無効なTS生成の防止               |
| [operation-parameters-unique](https://redocly.com/docs/cli/rules/built-in-rules/#parameters)  |      `error`       | パラメータの欠落防止             |
| [path-not-include-query](https://redocly.com/docs/cli/rules/built-in-rules/#parameters)       |      `error`       | パラメータの欠落防止             |
| [spec](https://redocly.com/docs/cli/rules/built-in-rules/#special-rules)                      | `3.0` または `3.1` | より良いスキーマチェックの有効化 |

### JSでの`snake_case`のサポート

言語ごとに好まれる構文スタイルは異なります。いくつか例を挙げると：

- `snake_case`
- `SCREAMING_SNAKE_CASE`
- `camelCase`
- `PascalCase`
- `kebab-case`

JSのスタイルガイドが推奨するように、APIレスポンスを`camelCase`にリネームしたくなるかもしれません。しかし、リネームは時間の無駄になるだけでなく、次のような保守上の問題を引き起こすため、**リネームを避ける**ことをお勧めします：

- ❌ 生成された型（たとえばopenapi-typescriptが生成した型）は、手動で入力する必要がある
- ❌ リネームは実行時に発生するため、アプリケーションが見えない変更を行う際に遅延を引き起こす
- ❌ 名前変更ツールを構築し、維持（およびテスト）する必要がある
- ❌ APIが `requestBodies`に `snake_case` を必要とする場合、すべての作業を各APIリクエストで元に戻さなければならない

代わりに、「一貫性」をより包括的な概念と見なし、JSスタイルの規約に従うよりもAPIスキーマをそのまま保持することが優れていると認識してください。

### TSConfigで `noUncheckedIndexedAccess` を有効にする

TSConfigで `compilerOptions.noUncheckedIndexedAccess`（[ドキュメント](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)）を有効にして、`additionalProperties` キーを `T | undefined` として型付けするようにします。

[Additional Properties](https://swagger.io/docs/specification/data-models/dictionaries/)（dictionaries）のデフォルトの動作は、 `Record<string, T>` という型を生成しますが、これはnull参照エラーを引き起こしやすくなります。TypeScriptは、キーが存在するかどうかを事前に確認せずに任意のキーにアクセスできるため、スペルミスやキーが実際に存在しない場合を防ぐことはできません。

### スキーマでの明確な指定

openapi-typescriptは**決して `any` 型を生成しません**。どのような型でも、スキーマで明確に定義されていない限り、実際には存在しないものと見なされます。そのため、可能な限り具体的に指定することが重要です。以下に、`additionalProperties` を最大限に活用する方法の例を示します：

<table>
  <thead>
    <tr>
      <td style="width:10%"></td>
      <th scope="col" style="width:40%">スキーマ</th>
      <th scope="col" style="width:40%">生成される型</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row" style="white-space: nowrap;">
        ❌ 悪い
      </th>
      <td>

```yaml
type: object
```

</td>
      <td>

```ts
Record<string, never>;
```

</td>
    </tr>
    <tr>
      <th scope="row" style="white-space: nowrap;">
        ❌ 不十分
      </th>
      <td>

```yaml
type: object
additionalProperties: true
```

</td>
      <td>

```ts
Record<string, unknown>;
```

</td>
    </tr>
    <tr>
      <th scope="row" style="white-space: nowrap;">
        ✅ 良い
      </th>
      <td>

```yaml
type: object
additionalProperties:
  type: string
```

</td>
      <td>

```ts
Record<string, string>;
```

</td>
    </tr>

  </tbody>
</table>

また、**タプル型**についても、スキーマでその型を明示することで、より良い結果が得られます。これは、`[x, y]` 座標のタプルを型付けする最良の方法です：

<table>
  <thead>
    <tr>
      <td style="width:10%">&nbsp;</td>
      <th scope="col" style="width:40%">スキーマ</th>
      <th scope="col" style="width:40%">生成される型</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row" style="white-space: nowrap;">
        ❌ 悪い
      </th>
      <td>

```yaml
type: array
```

</td>
      <td>

```ts
unknown[]
```

</td>
    </tr>
    <tr>
      <th scope="row" style="white-space: nowrap;">
        ❌ 不十分
      </th>
      <td>

```yaml
type: array
items:
  type: number
```

</td>
      <td>

```ts
number[]
```

</td>
    </tr>
    <tr>
      <th scope="row" style="white-space: nowrap;">
        ✅ 良い
      </th>
      <td>

```yaml
type: array
items:
  type: number
maxItems: 2
minItems: 2
```

— または —

```yaml
type: array
items: false
prefixItems:
  - number
  - number
```

</td>
      <td>

```ts
[number, number];
```

</td>
    </tr>

  </tbody>
</table>

### `oneOf`を単独で使用する

OpenAPIのコンポジションツール（`oneOf` / `anyOf` / `allOf`）は、スキーマ内のコード量を減らしながら柔軟性を最大化する強力なツールです。しかし、TypeScriptのユニオン型は[XOR](https://en.wikipedia.org/wiki/Exclusive_or)を提供しないため、`oneOf` に直接マッピングすることはできません。そのため、oneOfは単独で使用し、他のコンポジションメソッドやプロパティと組み合わせないことが推奨されます。例えば:

#### ❌ 悪い

::: code-group

```yaml [my-openapi-3-schema.yaml]
Pet:
  type: object
  properties:
    type:
      type: string
      enum:
        - cat
        - dog
        - rabbit
        - snake
        - turtle
    name:
      type: string
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
    - $ref: "#/components/schemas/Rabbit"
    - $ref: "#/components/schemas/Snake"
    - $ref: "#/components/schemas/Turtle"
```

:::

これは、TypeScript のユニオン型とインターセクション型の両方を組み合わせた次のような型が生成されます。これは有効な TypeScript ですが、複雑であり、推論が意図した通りに機能しない可能性があります。しかし、最も問題となるのは、TypeScript が type プロパティを通じて区別できないことです。

::: code-group

```ts [my-openapi-3-schema.d.ts]
  Pet: ({
    /** @enum {string} */
    type?: "cat" | "dog" | "rabbit" | "snake" | "turtle";
    name?: string;
  }) & (components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Rabbit"] | components["schemas"]["Snake"] | components["schemas"]["Turtle"]);
```

:::

#### ✅ 良い

::: code-group

```yaml [my-openapi-3-schema.yaml]
Pet:
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
    - $ref: "#/components/schemas/Rabbit"
    - $ref: "#/components/schemas/Snake"
    - $ref: "#/components/schemas/Turtle"
PetCommonProperties:
  type: object
  properties:
    name:
      type: string
Cat:
  allOf:
    - "$ref": "#/components/schemas/PetCommonProperties"
  type:
    type: string
    enum:
      - cat
```

:::

生成された型は単純化されるだけでなく、TypeScriptが `type` を使用して区別できるようになります（`Cat` には `type` として単一の列挙値 `"cat"` が指定されています）。

::: code-group

```ts [my-openapi-3-schema.d.ts]
Pet: components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Rabbit"] | components["schemas"]["Snake"] | components["schemas"]["Turtle"];
Cat: { type?: "cat"; } & components["schemas"]["PetCommonProperties"];
```

:::

_注: 任意で、`Pet` に `discriminator.propertyName: "type"` を指定することもできます（[ドキュメント](https://spec.openapis.org/oas/v3.1.0#discriminator-object)）。これにより、自動的に `type` キーが生成されますが、明示性が低くなります。_

スキーマでは任意の方法でコンポジションを使用することが許可されていますが、生成された型を確認し、ユニオン型やインターセクション型をより簡潔に表現できる方法がないか検討することは重要です。 `oneOf` の使用を制限することが唯一の方法ではありませんが、しばしば最大の効果をもたらします。

## JSONSchema $defs の注意点

[JSONSchema $defs](https://json-schema.org/understanding-json-schema/structuring.html#defs) はサブスキーマの定義をどこにでも提供するために使用できます。ただし、これらが常にTypeScriptにスムーズに変換されるとは限りません。例えば、次のような場合は動作します:

::: code-group

```yaml [my-openapi-3-schema.yaml]
components:
  schemas:
    DefType:
      type: object # ✅ `type: "object"` の場合、$defs を定義するのは問題ありません。
      $defs:
        myDefType:
          type: string
    MyType:
      type: object
      properties:
        myType:
          $ref: "#/components/schemas/DefType/$defs/myDefType"
```

:::

これは次のようなTypeScriptに変換されます:

::: code-group

```ts [my-openapi-3-schema.d.ts]
export interface components {
  schemas: {
    DefType: {
      $defs: {
        myDefType: string;
      };
    };
    MyType: {
      myType?: components["schemas"]["DefType"]["$defs"]["myDefType"]; // ✅ 正常に動作します
    };
  };
}
```

:::

しかし、これは動作しません:

::: code-group

```yaml [my-openapi-3-schema.yaml]
components:
  schemas:
    DefType:
      type: string # ❌ これは $defs を保持しません。
      $defs:
        myDefType:
          type: string
    MyType:
      properties:
        myType:
          $ref: "#/components/schemas/DefType/$defs/myDefType"
```

:::

なぜなら、次のように変換されるからです:

::: code-group

```ts [my-openapi-3-schema.d.ts]
export interface components {
  schemas: {
    DefType: string;
    MyType: {
      myType?: components["schemas"]["DefType"]["$defs"]["myDefType"]; // ❌ プロパティ '$defs' は型 'String' に存在しません。
    };
  };
}
```

:::

そのため、`$defs` を定義する場所には注意が必要です。最終的に生成される型から $defs が消えてしまう可能性があります。

::: tip

不安な場合は、`$defs` をルートスキーマレベルで定義するのが安全です。

:::
