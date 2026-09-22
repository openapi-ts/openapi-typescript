---
title: openapi-typescript Node.js API
description: プログラムでの使用と無限の柔軟性。
---

# Node.js API

Node APIは、動的に生成されたスキーマを扱う場合や、より大きなアプリケーションのコンテキスト内で使用する場合に役立ちます。メモリからスキーマをロードするためにJSONフレンドリーなオブジェクトを渡すか、ローカルファイルやリモートURLからスキーマをロードするために文字列を渡します。

## セットアップ

```bash
npm i --save-dev openapi-typescript
```

::: tip 推奨

最適な体験を得るために、 `"type": "module"` を `package.json` に追加して Node ESM を使用してください([ドキュメント](https://nodejs.org/api/esm.html#enabling))

:::

## 使用方法

Node.js APIは、`URL`、`string`、またはJSONオブジェクトを入力として受け付けます：

|  タイプ  | 説明                                     | 例                                                                                                                               |
| :------: | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
|  `URL`   | ローカルまたはリモートファイルを読み取る | `await openapiTS(new URL('./schema.yaml', import.meta.url))`<br/>`await openapiTS(new URL('https://myapi.com/v1/openapi.yaml'))` |
| `string` | 動的なYAMLまたはJSONを読み取る           | `await openapiTS('openapi: "3.1" … ')`                                                                                           |
|  `JSON`  | 動的なJSONを読み取る                     | `await openapiTS({ openapi: '3.1', … })`                                                                                         |

また、 `Readable` ストリームや`Buffer` 型も受け付け、これらは文字列として解決されます（ドキュメント全体がないと検証、バンドル、型生成ができません）。

Node APIは、生成されたTypeScriptソースの文字列を含む `Promise` を返します。そのままファイルに書き込めます。型の生成に `typescript` パッケージは必要ありません。

`astToString()` は引き続き利用できますが、現在はソース文字列を受け取り、末尾に改行を追加するヘルパーです。TypeScript ASTやプリンターのオプションは使用できません。

::: code-group

```ts [src/my-project.ts]
import fs from "node:fs";
import openapiTS from "openapi-typescript";

const contents = await openapiTS(new URL("./my-schema.yaml", import.meta.url));

// （任意）ファイルに書き込み
fs.writeFileSync("./my-schema.ts", contents);
```

:::

### Redoc config

Redoc configはopenapi-typescriptを使用するために必須ではありません。デフォルトでは `"minimal"` ビルトイン設定を拡張しますが、デフォルト設定を変更したい場合は、完全に初期化されたRedoc configをNode APIに提供する必要があります。これを行うには、`@redocly/openapi-core` のヘルパーを使用できます：

::: code-group

```ts [src/my-project.ts]
import { createConfig, loadConfig } from "@redocly/openapi-core";
import openapiTS from "openapi-typescript";

// オプション1： インメモリ設定を作成
const redocly = await createConfig(
  {
    apis: {
      "core@v2": { … },
      "external@v1": { … },
    },
  },
  { extends: ["recommended"] },
);

// オプション2： redocly.yamlファイルから読み込み
const redocly = await loadConfig({ configPath: "redocly.yaml" });

const types = await openapiTS(mySchema, { redocly });
```

:::

## オプション

Node APIは、 `camelCase` 形式で[CLI フラグ](./cli#%E3%83%95%E3%83%A9%E3%82%AF%E3%82%99) すべてをサポートしており、以下の追加オプションも利用可能です：

| 名前            |     タイプ      |   デフォルト    | 説明                                                                                         |
| :-------------- | :-------------: | :-------------: | :------------------------------------------------------------------------------------------- |
| `transform`     |   `Function`    |                 | 特定の状況でデフォルトのスキーマオブジェクトをTypeScriptにするトランスフォーマーを上書きする |
| `postTransform` |   `Function`    |                 | `transform` と同じだが、TypeScript変換後に実行される                                         |
| `silent`        |    `boolean`    |     `false`     | 警告メッセージを非表示にする（致命的なエラーは表示されます）                                 |
| `cwd`           | `string \| URL` | `process.cwd()` | （オプション）必要に応じてリモート$refの解決を支援するために現在の作業ディレクトリを指定     |
| `inject`        |    `string`     |                 | ファイルの先頭に任意のTypeScript型を注入                                                     |

### transform / postTransform

`transform()` と `postTransform()` オプションを使用して、デフォルトのスキーマオブジェクト変換を独自のものに上書きできます。これは、スキーマの特定の部分に対して非標準的な変更を提供する場合に役立ちます。

- `transform()` はTypeScriptへの **変換前** に実行されます（OpenAPIノードを扱います）
- `postTransform()` はTypeScriptへの **変換後** に実行されます（生成された型の文字列を扱います）

#### 例: `Date` 型

例えば、スキーマに次のプロパティが含まれているとします：

```yaml
properties:
  updated_at:
    type: string
    format: date-time
```

デフォルトでは、openapiTSは`updated_at?: string;`を生成します。これは、`"date-time"`がどのフォーマットを意味するのかが明確でないためです（フォーマットは標準化されておらず、任意の形式にできるため）。しかし、独自のカスタムフォーマッタを提供することで、これを改善できます。例えば次のようにします：

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";

const DATE = "Date"; // `Date`
const NULL = "null"; // `null`

const types = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "date-time") {
      return schemaObject.nullable ? `${DATE} | ${NULL}` : DATE;
    }
  },
});
```

:::

その結果、以下のようになります：

::: code-group

```yaml [my-openapi-3-schema.yaml]
updated_at?: string; // [!code --]
updated_at: Date | null; // [!code ++]
```

:::

#### 例: `Blob` 型

もう一つの一般的な変換は、リクエストの `body` が `multipart/form-data` で、いくつかの `Blob` フィールドを持つファイルアップロードの場合です。例えば次のようなスキーマがあります

::: code-group

```yaml [my-openapi-3-schema.yaml]
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
```

:::

同じパターンを使用して型を変換します：

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";

const BLOB = "Blob"; // `Blob`
const NULL = "null"; // `null`

const types = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "binary") {
      return schemaObject.nullable ? `${BLOB} | ${NULL}` : BLOB;
    }
  },
});
```

:::

fileプロパティが正しく型付けされた差分は次のようになります：

::: code-group

```ts [my-openapi-3-schema.d.ts]
file?: string; // [!code --]
file: Blob | null; // [!code ++]
```

:::

#### 例: プロパティに "?" トークンを追加

上記の `transform` 関数では、オプションの"?"トークンを持つプロパティを作成することはできません。しかし、transform関数は異なる戻りオブジェクトを受け入れることもでき、これを使用してプロパティに”?“トークンを追加することができます。以下はその例です：

::: code-group

```yaml [my-openapi-3-schema.yaml]
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
      required: true;
```

:::

ここではスキーマプロパティを持つオブジェクトを返しますが、これに加えて `questionToken` プロパティを追加し、プロパティに"?"トークンを追加します。

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";

const BLOB = "Blob"; // `Blob`
const NULL = "null"; // `null`

const types = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "binary") {
      return {
        schema: schemaObject.nullable ? `${BLOB} | ${NULL}` : BLOB,
        questionToken: true,
      };
    }
  },
});
```

:::

`file` プロパティが正しく型付けされ、"?"トークンが追加された結果の差分は次のとおりです：

::: code-group

```ts [my-openapi-3-schema.d.ts]
file: Blob; // [!code --]
file?: Blob | null; // [!code ++]
```

:::

スキーマ内の任意の[Schema Object](https://spec.openapis.org/oas/latest.html#schema-object)は、このフォーマッタを通じて処理されます（リモートのものも含まれます!）。また、追加のコンテキストが役立つ場合があるので、`metadata` パラメータも必ず確認してください。

`format`のチェック以外にも、これを利用する方法は多数あります。この関数は **string** を返す必要があるため、任意のTypeScriptコード（独自のカスタム型も含む）を生成することができます。


### transformProperty

`transformProperty()` はプロパティの型変換後に実行され、`{ name, optional, readonly, type, comment?, indent }` オブジェクトを受け取ります。変更したオブジェクトを返すか、変更しない場合は `undefined` を返してください。`name` は必要に応じて引用符が付いた名前、`type` は型の文字列です。`readonly` を変更すると、スキーマや `immutable` オプションによるデフォルトを上書きできます。

```ts
import openapiTS, { tsComment } from "openapi-typescript";

const types = await openapiTS(mySchema, {
  transformProperty(property, schemaObject) {
    if (schemaObject.format === "date-time") {
      return {
        ...property,
        readonly: true,
        comment: tsComment(["@custom timestamp"], property.indent),
      };
    }
  },
});
```

`tsComment()` で作成したコメントの後に、スキーマ由来のJSDocが追加されます。このフックは Schema Object のプロパティと `$defs` に適用されます。
