---
title: openapi-typescript CLI
description: 最も簡単かつ迅速に型を生成する方法
---

# CLI

CLI は、openapi-typescript を使用する最も一般的な方法です。CLI は JSON および YAML を解析でき、[Redocly CLI](https://redocly.com/docs/cli/commands/lint/) を使用してスキーマを検証することもできます。ローカルおよびリモートのスキーマを解析可能です（基本認証もサポートしています）。

## OpenAPI スキーマを TypeScript に変換する

### 単一スキーマ

スキーマを変換する最も簡単な方法は、入力スキーマ（JSON または YAML）を指定し、`--output`（`-o`）で出力先を指定することです：

```bash
npx openapi-typescript schema.yaml -o schema.ts

# 🚀 schema.yaml -> schema.ts [50ms]
```

```bash
npx openapi-typescript https://petstore3.swagger.io/api/v3/openapi.yaml -o petstore.d.ts

# 🚀 https://petstore3.swagger.io/api/v3/openapi.yaml -> petstore.d.ts [250ms]
```

### 複数のスキーマ

複数のスキーマを変換するには、プロジェクトのルートディレクトリに `redocly.yaml` ファイルを作成し、[APIs を定義します](https://redocly.com/docs/cli/configuration/)。`apis` の下に、それぞれのスキーマに一意の名前と、必要に応じてオプションのバージョンを指定します（名前は一意であれば問題ありません）。`root` の値をスキーマのエントリーポイントに設定します。これが主な入力として機能します。出力については、`x-openapi-ts.output` で設定します：

::: code-group

```yaml [redocly.yaml]
apis:
  core@v2:
    root: ./openapi/openapi.yaml
    x-openapi-ts:
      output: ./openapi/openapi.ts
  external@v1:
    root: ./openapi/external.yaml
    x-openapi-ts:
      output: ./openapi/external.ts
```

:::

::: tip

これにより、スキーマの 1:1 入力:出力が保持されます。複数のスキーマを1つにまとめるには、Redocly の [bundle コマンド](https://redocly.com/docs/resources/multi-file-definitions/#bundle)を使用してください。

:::

プロジェクト内に `apis` を含む `redocly.yaml` ファイルがあれば、CLI で入力/出力パラメータを省略できます：

```bash
npx openapi-typescript
```

::: warning

以前のバージョンでは globbing がサポートされていましたが、v7 では廃止され、代わりに `redocly.yaml` が推奨されるようになりました。これにより、各スキーマの出力先をより詳細に制御でき、各スキーマに固有の設定を適用することができます。

:::

## Redocly config

openapi-typescript を使用するには `redocly.yaml` ファイルは必須ではありません。デフォルトでは、組み込みの `"minimal"` 設定を拡張します。ただし、カスタム検証ルールや[複数のスキーマ](#複数のスキーマ)の型を構築したい場合には使用をお勧めします。CLI はプロジェクトのルートディレクトリで `redocly.yaml` を自動的に見つけようとしますが、`--redocly` フラグを使用してその場所を指定することもできます：

```bash
npx openapi-typescript --redocly ./path/to/redocly.yaml
```

Redoclyの設定オプションについての詳細は [Redoclyのドキュメント](https://redocly.com/docs/cli/configuration/)をご覧ください。

## 認証

非公開スキーマの認証は、[Redocly config](https://redocly.com/docs/cli/configuration/#resolve-non-public-or-non-remote-urls)で処理します。次のようにヘッダーや基本認証を追加できます：

::: code-group

```yaml [redocly.yaml]
resolve:
  http:
    headers:
      - matches: https://api.example.com/v2/**
        name: X-API-KEY
        envVariable: SECRET_KEY
      - matches: https://example.com/*/test.yaml
        name: Authorization
        envVariable: SECRET_AUTH
```

:::

その他のオプションについては、[Redocly ドキュメント](https://redocly.com/docs/cli/configuration/#resolve-non-public-or-non-remote-urls)をご参照ください。

## フラグ

CLI は以下のフラグをサポートしています：

| フラグ                             | エイリアス | デフォルト | 説明                                                                                                     |
| :--------------------------------- | :--------- | :--------: | :------------------------------------------------------------------------------------------------------- |
| `--help`                           |            |            | インラインヘルプメッセージを表示し終了します                                                             |
| `--version`                        |            |            | このライブラリのバージョンを表示し終了します                                                             |
| `--output [location]`              | `-o`       | (stdout) | 出力ファイルを保存する場所を指定します                                                                   |
| `--redocly [location]`             |            |            | `redocly.yaml` ファイルへのパスを指定します (詳細は [複数スキーマ](#複数のスキーマ) を参照)              |
| `--additional-properties`          |            |  `false`   | `additionalProperties: false` がないすべてのスキーマオブジェクトに任意のプロパティを許可します           |
| `--alphabetize`                    |            |  `false`   | 型をアルファベット順にソートします                                                                       |
| `--array-length`                   |            |  `false`   | 配列の `minItems` / `maxItems` を使用してタプルを生成します                                              |
| `--default-non-nullable`           |            |   `true`   | デフォルト値を持つスキーマオブジェクトを、非nullableとして扱います（parametersを除きます）                       |
| `--properties-required-by-default` |            |  `false`   | `required` がないスキーマオブジェクトについて、すべてのプロパティを必須として扱います                |
| `--empty-objects-unknown`          |            |  `false`   | 指定されたプロパティも `additionalProperties` もないスキーマオブジェクトに任意のプロパティを許可します   |
| `--enum`                           |            |  `false`   | 文字列のユニオン型ではなく、[TS enums](https://www.typescriptlang.org/docs/handbook/enums.html) を生成します |
| `--enum-values`                    |            |  `false`   | enumの値を配列としてエクスポートします                                                                   |
| `--dedupe-enums`                   |            |  `false`   | `--enum=true` が設定されている場合、enumの重複を排除します                                               |
| `--check`                          |            |  `false`   | 生成された型が最新であることを確認します                                                                 |
| `--exclude-deprecated`             |            |  `false`   | 型から廃止されたフィールドを除外します                                                                   |
| `--export-type`                    | `-t`       |  `false`   | `interface` の代わりに `type` をエクスポートします                                                       |
| `--immutable`                      |            |  `false`   | 不変の型（readonlyプロパティおよびreadonly配列）を生成します                                             |
| `--path-params-as-types`           |            |  `false`   | `paths` オブジェクトで動的な文字列の参照を許可します                                                     |

### pathParamsAsTypes

デフォルトでは、URL はスキーマに記載された通りに保持されます：

::: code-group

```ts [my-openapi-3-schema.d.ts]
export interface paths {
  "/user/{user_id}": components["schemas"]["User"];
}
```

:::

つまり、型の参照も正確な URL に一致する必要があります。

::: code-group

```ts [src/my-project.ts]
import type { paths } from "./my-openapi-3-schema";

const url = `/user/${id}`;
type UserResponses = paths["/user/{user_id}"]["responses"];
```

:::

しかし、`--path-params-as-types` オプションを有効にすると、次のように動的な参照を利用することができます。

::: code-group

```ts [src/my-project.ts]
import type { paths } from "./my-openapi-3-schema";

const url = `/user/${id}`;
type UserResponses = paths[url]["responses"]; // 自動的に `paths['/user/{user_id}']` に一致します
```

:::

これは人為的な例ですが、この機能を使用して、フェッチクライアントやアプリケーション内の他に有用的な場面で、URLに基づいて型を自動的に推論することができます。

_ありがとう, [@Powell-v2](https://github.com/Powell-v2)!_

### arrayLength

このオプションは、配列タイプが `minItems` または `maxItems` を指定している場合にタプルを生成するのに便利です。

例えば、以下のスキーマが与えられた場合:

::: code-group

```yaml [my-openapi-3-schema.yaml]
components:
  schemas:
    TupleType
      type: array
      items:
        type: string
      minItems: 1
      maxItems: 2
```

:::

`--array-length` を有効にすると、型が次のように変更されます:

::: code-group

```ts [my-openapi-3-schema.d.ts]
export interface components {
  schemas: {
    TupleType: string[]; // [!code --]
    TupleType: [string] | [string, string]; // [!code ++]
  };
}
```

:::

これにより、配列の長さに対するより明示的な型チェックが可能になります。

_注: この機能には合理的な制限があります。例えば `maxItems: 100` の場合は、単純に `string[];` に戻ります。_

_ありがとう, [@kgtkr](https://github.com/kgtkr)!_
