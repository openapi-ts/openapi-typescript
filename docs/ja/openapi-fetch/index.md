---
title: openapi-fetch
---

<img src="/assets/openapi-fetch.svg" alt="openapi-fetch" width="216" height="40" />

openapi-fetchは、あなたのOpenAPIスキーマを取り込み、型安全なfetchクライアントを提供します。このライブラリはわずか **6 kb** で、ほとんどのランタイムを持たず、React、Vue、Svelte、あるいはバニラJSとも動作します。

| ライブラリ                 | サイズ (min) | “GET” リクエスト\*       |
| :------------------------- | -----------: | :----------------------- |
| openapi-fetch              |       `6 kB` | `300k` ops/s (最速)      |
| openapi-typescript-fetch   |       `4 kB` | `150k` ops/s (2倍遅い)   |
| axios                      |      `32 kB` | `225k` ops/s (1.3倍遅い) |
| superagent                 |      `55 kB` | `50k` ops/s (6倍遅い)    |
| openapi-typescript-codegen |     `367 kB` | `100k` ops/s (3倍遅い)   |

_\* [ベンチマークはおおよそのものです](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-fetch/test/index.bench.js) 。実際のパフォーマンスはマシンやブラウザによって異なる場合があります。ライブラリ間の相対的なパフォーマンスはより信頼性があります。_

このシンタックスは、React QueryやApollo Clientのような人気のライブラリにインスパイアされたものでありながら、すべての装飾を省き、6 kbというコンパクトなパッケージに収まっています。

::: code-group

```ts [src/my-project.ts]
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const {
  data, // 2XXレスポンスの場合のみ存在
  error, // 4XXまたは5XXレスポンスの場合のみ存在
} = await client.GET("/blogposts/{post_id}", {
  params: {
    path: { post_id: "123" },
  },
});

await client.PUT("/blogposts", {
  body: {
    title: "新しい投稿",
  },
});
```

:::

`data` と `error` は型チェックが行われ、VS Codeや他のTypeScript対応IDEでIntellisenseによる補完が利用可能です。同様に、リクエストの `body` もフィールドが型チェックされ、必要なパラメータが不足している場合や型の不一致がある場合にはエラーが発生します。

`GET()`, `PUT()`, `POST()` などは、ネイティブの [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) の薄いラッパーとして動作します（[任意の呼び出しに変更することも可能です](/openapi-fetch/api#create-client)）。

ここで重要なのは、ジェネリクスや手動の型指定が一切不要で、エンドポイントのリクエストとレスポンスが自動的に推論されることです。これは、エンドポイントの型安全性を大幅に向上させます。なぜなら、**手動でのアサーションはバグの原因となり得るからです**！これにより、次のような問題がすべて解消されます：

- ✅ URLやパラメータのタイプミスが起こらない
- ✅ すべてのパラメータ、リクエストボディ、レスポンスが型チェックされ、スキーマと100%一致する
- ✅ APIの手動での型指定が不要
- ✅ バグを隠す可能性がある `any` 型の排除
- ✅ バグを隠す可能性がある `as` 型の上書きも排除
- ✅ これらすべてが**5 kb**のクライアントパッケージで実現 🎉

## セットアップ

このライブラリと [openapi-typescript](/introduction) をインストールします：

```bash
npm i openapi-fetch
npm i -D openapi-typescript typescript
```

::: tip 強く推奨

`tsconfig.json`で [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess) を有効にしてください ([ドキュメント](/advanced#enable-nouncheckedindexaccess-in-your-tsconfigjson))

:::

次に、openapi-typescriptを使用してOpenAPIスキーマからTypeScriptの型を生成します：

```bash
npx openapi-typescript ./path/to/api/v1.yaml -o ./src/lib/api/v1.d.ts
```

最後に、プロジェクトで **型チェックを実行** してください。これは、`tsc --noEmit` を [npm scripts](https://docs.npmjs.com/cli/v9/using-npm/scripts) に追加することで可能です：

::: code-group

```json{3} [package.json]
{
  "scripts": {
    "test:ts": "tsc --noEmit"
  }
}
```

:::

そして、CIで `npm run test:ts` を実行して型エラーを検出します。

::: tip

`tsc --noEmit` を使用して型エラーをチェックし、リンターやビルドコマンドに依存しないようにしてください。TypeScriptコンパイラ自体ほど正確に型チェックを行えるものはありません。
:::

## 基本的な使用方法

openapi-fetchを従来のコード生成ツールよりも使用する最大の利点は、ドキュメントが不要であることです。openapi-fetchは、どの関数をインポートするか、あるいはその関数がどのパラメータを受け取るかを探す代わりに、既存のOpenAPIドキュメントを活用することを推奨しています：

![OpenAPI schema example](/assets/openapi-schema.png)

::: code-group

```ts [src/my-project.ts]
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const { data, error } = await client.GET("/blogposts/{post_id}", {
  params: {
    path: { post_id: "my-post" },
    query: { version: 2 },
  },
});

const { data, error } = await client.PUT("/blogposts", {
  body: {
    title: "New Post",
    body: "<p>New post body</p>",
    publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
  },
});
```

:::

1. HTTPメソッドは `createClient()` から直接取得します。
2. `GET()` , `PUT()` , などに希望するpathを渡します。
3. TypeScriptが欠落しているものや無効なものがあれば有用なエラーを返します。

### Pathname

`GET()` , `PUT()` , `POST()` などのpathnameは、スキーマと厳密に一致している必要があります。例では、URLは `/blogposts/{post_id}` です。このライブラリは、すべての `path` パラメータをすぐに置き換え、それらが型チェックされるようにします。

::: tip

openapi-fetchはURLから型を推論します。動的な実行時の値よりも静的な文字列値を優先してください。例：

- ✅ `"/blogposts/{post_id}"`
- ❌ `[...pathParts].join("/") + "{post_id}"`

:::

このライブラリはまた、**label** および **matrix** のシリアライゼーションスタイルもサポートしています（[ドキュメント](https://swagger.io/docs/specification/serialization/#path)）。

### Request

`GET()` リクエストには、[タイプごとにパラメータをグループ化する](https://spec.openapis.org/oas/latest.html#parameter-object) `params` オブジェクトが必要です（ `path`または `query` ）。必須のパラメータが欠けている場合や、型が間違っている場合には、型エラーが発生します。

`POST()` リクエストでは、必要な [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) データを提供する `body` オブジェクトが必要でした。

### Response

すべてのメソッドは**data**、**error**および **response**を持つオブジェクトを返します。

```ts
const { data, error, response } = await client.GET("/url");
```

| Object     | Response                                                                                                                        |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `data`     | OKの場合 `2xx` レスポンス、そうでない場合 `undefined`                                                                           |
| `error`    | OKでない場合 `5xx` 、`4xx` 、または `default` レスポンス、それ以外は `undefined`                                                |
| `response` | [オリジナルのレスポンス](https://developer.mozilla.org/en-US/docs/Web/API/Response)であり、`status`, `headers` などを含みます。 |

### Path-property スタイル

パスをプロパティとして選択する方が好ましい場合は、パスベースのクライアントを作成できます：

```ts
import { createPathBasedClient } from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const client = createPathBasedClient<paths>({
  baseUrl: "https://myapi.dev/v1",
});

client["/blogposts/{post_id}"].GET({
  params: { post_id: "my-post" },
  query: { version: 2 },
});
```

これにはパフォーマンスの影響があり、ミドルウェアを直接アタッチすることはできません。
詳細については、[`wrapAsPathBasedClient`](/openapi-fetch/api#wrapAsPathBasedClient) を参照してください。

## サポート

| プラットフォーム | サポート                                                                                                                                    |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **ブラウザ**     | [fetch API サポートを参照](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#browser_compatibility) (主要なブラウザで広く利用可能) |
| **Node**         | >= 18.0.0                                                                                                                                   |
| **TypeScript**   | >= 4.7 (>= 5.0 recommended)                                                                                                                 |
