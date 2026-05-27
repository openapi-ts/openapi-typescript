---
title: 使用例
description: openapi-typescriptを実際のアプリケーションで使用する例
---

# 使用例

openapi-typescript で生成された型は汎用性が高く、さまざまな方法で利用できます。これらの例は包括的なものではありませんが、アプリケーションでの使用方法についてのアイデアを刺激することを期待しています。

## データフェッチ

データを取得する際には、**自動的に型付けされたfetchラッパー**を使用すると、簡単かつ安全に行えます：

<details>
<summary><a href="/openapi-fetch/">openapi-fetch</a> (推奨)</summary>

::: code-group

```ts [test/my-project.ts]
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const {
  data, // 2XX レスポンスの場合のみ存在
  error, // 4XX または 5XX レスポンスの場合のみ存在
} = await client.GET("/blogposts/{post_id}", {
  params: {
    path: { post_id: "123" },
  },
});

await client.PUT("/blogposts", {
  body: {
    title: "My New Post",
  },
});
```

:::

</details>

<details>
<summary><a href="https://www.npmjs.com/package/openapi-typescript-fetch" target="_blank" rel="noreferrer">openapi-typescript-fetch</a> by <a href="https://github.com/ajaishankar" target="_blank" rel="noreferrer">@ajaishankar</a></summary>

::: code-group

```ts [test/my-project.ts]
import { Fetcher } from "openapi-typescript-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const fetcher = Fetcher.for<paths>();

// GET リクエストを送信
const getBlogPost = fetcher.path("/blogposts/{post_id}").method("get").create();

try {
  const { status, data } = await getBlogPost({
    pathParams: { post_id: "123" },
  });
  console.log(data);
} catch (error) {
  console.error("Error:", error);
}

// PUT リクエストを送信
const updateBlogPost = fetcher.path("/blogposts").method("put").create();

try {
  await updateBlogPost({ body: { title: "My New Post" } });
} catch (error) {
  console.error("Error:", error);
}
```

:::

</details>

<details>
<summary><a href="https://www.npmjs.com/package/feature-fetch" target="_blank" rel="noreferrer">feature-fetch</a> by <a href="https://github.com/builder-group/community" target="_blank" rel="noreferrer">builder.group</a></summary>

`feature-fetch` は、OpenAPI で型付けされた request と、明示的な success/error 分岐が欲しい場合に向いています。生成された `paths` から path strings、params、request body、response data を型付けします。各 call は `[ok, error, data]` を返すため、失敗時の処理が呼び出し箇所に残り、成功分岐では data の型が絞り込まれます。retry、cache、hooks、middleware は client に production 向けの挙動が必要になったときに追加できます。

::: code-group

```ts [test/my-project.ts]
import {
  createOpenApiFetchClient,
  hasStatusCode,
  retryFeature,
} from "feature-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const api = createOpenApiFetchClient<paths>({
  baseUrl: "https://myapi.dev/v1",
}).with(retryFeature({ maxRetries: 3 }));

const [isPostOk, postErr, post] = await api.get("/blogposts/{post_id}", {
  pathParams: {
    post_id: "123",
  },
});

if (isPostOk) {
  console.log(post); // 2XX response schema から型付けされる
} else if (hasStatusCode(postErr, 404)) {
  console.error("Post not found");
} else {
  console.error(postErr.message); // NetworkError | HttpError | FetchError
}

const [isUpdateOk, updateErr] = await api.put("/blogposts", {
  body: {
    title: "My New Post", // request body schema と照合される
  },
});

if (!isUpdateOk) {
  console.error(updateErr.message);
}
```

:::

[完全な例](https://github.com/builder-group/community/tree/develop/examples/feature-fetch/vanilla/basic)

</details>

<details>
<summary><a href="https://www.npmjs.com/package/@web-bee-ru/openapi-axios" target="_blank" rel="noreferrer">openapi-axios</a> by <a href="https://github.com/web-bee-ru" target="_blank" rel="noreferrer">@web-bee-ru</a></summary>

::: code-group

```ts [test/my-project.ts]
import { OpenApiAxios } from "@web-bee-ru/openapi-axios";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型
import Axios from "axios";

const axios = Axios.create({
  baseURL: "https://myapi.dev/v1",
  adapter: "fetch", // 強く推奨 (axios@1.7.0 から利用可能)
});

// 例1. "axios"（デフォルト）のステータス処理方法での使用 (validStatus: 'axios')

// axiosのようにエラーをスローする（例：status >= 400、ネットワークエラー、インターセプターエラー）
const api = new OpenApiAxios<paths, "axios">(axios, { validStatus: "axios" });

// const api =  new OpenApiAxios<paths>(axios) // 同じ結果になる

try {
  const { status, data, response } = await api.get("/users");
} catch (err) {
  if (api.isAxiosError(err)) {
    if (typeof err.status === "number") {
      // status >= 400
    }
    // リクエスト失敗（例：ネットワークエラー）
  }
  throw err; // axios.interceptors のエラー
}

// 例2. "fetch" ステータス処理方法での使用 (validStatus: 'fetch')

// ブラウザのfetch()のようにエラーをスローする（例：ネットワークエラー、インターセプターエラー）
const fetchApi = new OpenApiAxios<paths, "fetch">(axios, {
  validStatus: "fetch",
});

try {
  const { status, data, error, response } = await api.get("/users");

  if (error) {
    // status >= 400
  }
} catch (err) {
  if (api.isAxiosError(err)) {
    // リクエスト失敗（例：ネットワークエラー）
  }
  throw err; // axios.interceptors のエラー
}

// 例3. "safe" ステータス処理方法での使用 (validStatus: 'all')
// （try/catch は不要）

// エラーは投げない
const safeApi = new OpenApiAxios<paths, "all">(axios, { validStatus: "all" });

const { status, data, error, response } = await api.get("/users");

if (error) {
  if (typeof status === "number") {
    // status >= 400
  } else if (api.isAxiosError(error)) {
    // リクエスト失敗（例：ネットワークエラー)
  }
  throw error; // axios.interceptors のエラー
}
```

:::

</details>

::: tip

良い fetch ラッパーは**ジェネリクスの使用は避ける**べきです。ジェネリクスは多くのタイプ指定が必要で、エラーを隠してしまう可能性があります！

:::

## Hono

[Hono](https://hono.dev/)は、Node.js用のモダンなサーバーフレームワークで、エッジ環境（例：[Cloudflare Workers](https://developers.cloudflare.com/workers/)）や標準コンテナに簡単にデプロイできます。また、TypeScriptが組み込まれており、生成された型と非常に相性が良いです。

[CLIを使用して型を生成](/ja/introduction)した後、各エンドポイントに適切な `paths` レスポンスを渡します：

::: code-group

```ts [src/my-project.ts]
import { Hono } from "hono";
import { components, paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const app = new Hono();

/** /users */
app.get("/users", async (ctx) => {
  try {
    const users = db.get("SELECT * from users");
    return ctx.json<
      paths["/users"]["responses"][200]["content"]["application/json"]
    >(users);
  } catch (err) {
    return ctx.json<components["schemas"]["Error"]>({
      status: 500,
      message: err ?? "エラーが発生しました",
    });
  }
});

export default app;
```

::: tip

サーバー環境ではデータベースクエリや他のエンドポイントとのやり取りがあり、TypeScriptが検査できない部分があるため型チェックが難しくなり得ます。しかし、ジェネリクスを使用することで、TypeScriptがキャッチできる明らかなエラーについて警告を受けることができるようになります（そして、スタック内の多くのものが型を持っていることに気付くかもしれません！）。

:::

## Hono と [`openapi-ts-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router)

[`openapi-ts-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router) は、OpenAPI document で実装側の server code も制約したい場合に向いています。[Hono router](https://hono.dev/docs/api/routing) をラップし、route registration では `/pet/{petId}` のような OpenAPI path strings をそのまま使います。生成された `paths` に存在しない path や method、必須 schema の不足、schema に合わない JSON success response は TypeScript が拒否します。[Standard Schema](https://standardschema.dev/) library で request の各部分を検証し、handler では parse 済みの値を `c.req.valid()` から読み取れます。

::: code-group

```ts [src/router.ts]
import { Hono } from "hono";
import { createHonoOpenApiRouter } from "openapi-ts-router/hono";
import * as z from "zod";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const app = new Hono();
const openApiRouter = createHonoOpenApiRouter<paths>(app);

openApiRouter.get("/pet/{petId}", {
  pathSchema: z.object({
    petId: z.number(),
  }),
  handler: (c) => {
    const { petId } = c.req.valid("param");
    return c.json({ name: `Pet ${petId}`, photoUrls: [] });
  },
});

openApiRouter.post("/pet", {
  bodySchema: z.object({
    name: z.string(),
    photoUrls: z.array(z.string()),
  }),
  handler: (c) => {
    const { name, photoUrls } = c.req.valid("json");
    return c.json({ name, photoUrls });
  },
});
```

:::

[完全な例](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/hono/petstore)

## Express と [`openapi-ts-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router)

[`openapi-ts-router`](https://github.com/builder-group/community/tree/develop/packages/openapi-ts-router) は、既存の Express API implementation も OpenAPI document で制約したい場合に向いています。[Express router](https://expressjs.com/en/5x/api.html#router) をラップし、route registration では `/pet/{petId}` のような OpenAPI path strings をそのまま使います。生成された `paths` に存在しない path や method、必須 schema の不足、schema に合わない JSON success response は TypeScript が拒否します。[Standard Schema](https://standardschema.dev/) library で request の各部分を検証し、handler では parse 済みの値を `req.valid` から読み取れます。JSON body を検証する場合は、この router の前に `express.json()` を mount してください。

::: code-group

```ts [src/router.ts]
import { Router } from "express";
import { createExpressOpenApiRouter } from "openapi-ts-router/express";
import * as z from "zod";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const router = Router();
const openApiRouter = createExpressOpenApiRouter<paths>(router);

openApiRouter.get("/pet/{petId}", {
  pathSchema: z.object({
    petId: z.number(),
  }),
  handler: (req, res) => {
    const { petId } = req.valid.path;
    res.json({ name: `Pet ${petId}`, photoUrls: [] });
  },
});

openApiRouter.post("/pet", {
  bodySchema: z.object({
    name: z.string(),
    photoUrls: z.array(z.string()),
  }),
  handler: (req, res) => {
    const { name, photoUrls } = req.valid.body;
    res.json({ name, photoUrls });
  },
});
```

:::

[完全な例](https://github.com/builder-group/community/tree/develop/examples/openapi-ts-router/express/petstore)

## Mock-Service-Worker (MSW)

[Mock Service Worker (MSW)](https://mswjs.io) を使用してAPIモックを定義している場合、**小さくて自動的に型付けされたラッパー**をMSWと合わせて使用することで、OpenAPI仕様が変更された際にAPIモックのコンフリクトを簡単に解決できます。最終的には、アプリケーションのAPIクライアントとAPIモックの**両方**に同じレベルの信頼を持つことができます。

`openapi-typescript` と `openapi-fetch` のようなfetchラッパーを使用することで、アプリケーションのAPIクライアントがOpenAPI仕様とコンフリクトしないように保証できます。

しかし、APIクライアントの問題を簡単に解決できる一方で、コンフリクトについて警告するメカニズムがないため、APIモックを"手動で"調整する必要があります。

以下のラッパーは、`openapi-typescript` と完璧に連携しますのでお勧めします：

- [openapi-msw](https://www.npmjs.com/package/openapi-msw) by [@christoph-fricke](https://github.com/christoph-fricke)

## テスト用モック

最も一般的なテストの誤検知の原因の一つは、モックが実際のAPIレスポンスと一致していない場合です。

`openapi-typescript` は、最小限の労力でこれを防ぐための素晴らしい方法を提供します。以下に、OpenAPIスキーマに一致するようにすべてのモックを型チェックするためのヘルパー関数を書く一例を示します（ここでは [vitest](https://vitest.dev/) や [vitest-fetch-mock](https://www.npmjs.com/package/vitest-fetch-mock) を使用しますが、同じ原則が他の設定にも適用できます）：

次のようなオブジェクト構造でモックを定義し、一度に複数のエンドポイントをモックすることを考えてみましょう：

```ts
{
  [pathname]: {
    [HTTP method]: { status: [status], body: { …[何らかのモックデータ] } };
  }
}
```

生成された型を使用して、指定されたパス + HTTPメソッド + ステータスコードに対して正しいデータ形状を推論できます。テストの例は以下のようになります：

::: code-group

```ts [my-test.test.ts]
import { mockResponses } from "../test/utils";

describe("My API test", () => {
  it("mocks correctly", async () => {
    mockResponses({
      "/users/{user_id}": {
        // ✅ 正常な 200 レスポンス
        get: { status: 200, body: { id: "user-id", name: "User Name" } },
        // ✅ 正常な 403 レスポンス
        delete: { status: 403, body: { code: "403", message: "Unauthorized" } },
      },
      "/users": {
        // ✅ 正常な 201 レスポンス
        put: { 201: { status: "success" } },
      },
    });

    // テスト 1: GET /users/{user_id}: 200
    await fetch("/users/user-123");

    // テスト 2: DELETE /users/{user_id}: 403
    await fetch("/users/user-123", { method: "DELETE" });

    // テスト 3: PUT /users: 200
    await fetch("/users", {
      method: "PUT",
      body: JSON.stringify({ id: "new-user", name: "New User" }),
    });

    // テストをクリーンアップ
    fetchMock.resetMocks();
  });
});
```

:::

_注: この例では、標準の `fetch()` 関数を使用していますが、[openapi-fetch](/ja/openapi-fetch/) を含む他の fetch ラッパーも、何の変更も加えずに代わりに使用できます。_

コードは、`test/utils.ts` ファイルにあり、必要に応じてプロジェクトにコピー＆ペーストして使用することができます（シンプルさを保つために隠しています）。

<details>
<summary>📄 <strong>test/utils.ts</strong></summary>

::: code-group

```ts [test/utils.ts]
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

// 設定
// ⚠️ 重要: ここを変更してください！これはすべてのURLにプレフィックスを追加します
const BASE_URL = "https://myapi.com/v1";
// 設定終了

// 型ヘルパー — これらはTSルックアップを改善するためのものです。無視しても構いません
type FilterKeys<Obj, Matchers> = {
  [K in keyof Obj]: K extends Matchers ? Obj[K] : never;
}[keyof Obj];
type PathResponses<T> = T extends { responses: any } ? T["responses"] : unknown;
type OperationContent<T> = T extends { content: any } ? T["content"] : unknown;
type MediaType = `${string}/${string}`;
type MockedResponse<T, Status extends keyof T = keyof T> =
  FilterKeys<OperationContent<T[Status]>, MediaType> extends never
    ? { status: Status; body?: never }
    : {
        status: Status;
        body: FilterKeys<OperationContent<T[Status]>, MediaType>;
      };

/**
 * fetch()呼び出しをモックし、OpenAPIスキーマに基づいて型を指定します
 */
export function mockResponses(responses: {
  [Path in keyof Partial<paths>]: {
    [Method in keyof Partial<paths[Path]>]: MockedResponse<
      PathResponses<paths[Path][Method]>
    >;
  };
}) {
  fetchMock.mockResponse((req) => {
    const mockedPath = findPath(
      req.url.replace(BASE_URL, ""),
      Object.keys(responses)
    )!;
    // 注意: ここでの型は省略されており、この関数は`void`を返すシグネチャを持っています。重要なのはパラメータのシグネチャです。
    if (!mockedPath || (!responses as any)[mockedPath])
      throw new Error(`No mocked response for ${req.url}`); // モックされていない応答の場合はエラーをスローします（必要に応じて動作を変更してください）
    const method = req.method.toLowerCase();
    if (!(responses as any)[mockedPath][method])
      throw new Error(`${req.method} called but not mocked on ${mockedPath}`); // 同様に、他の部分がモックされていない場合もエラーをスローします
    if (!(responses as any)[mockedPath][method]) {
      throw new Error(`${req.method} called but not mocked on ${mockedPath}`);
    }
    const { status, body } = (responses as any)[mockedPath][method];
    return { status, body: JSON.stringify(body) };
  });
}

// 現実的なURL（/users/123）をOpenAPIパス（/users/{user_id}）にマッチさせるヘルパー関数
export function findPath(
  actual: string,
  testPaths: string[]
): string | undefined {
  const url = new URL(
    actual,
    actual.startsWith("http") ? undefined : "http://testapi.com"
  );
  const actualParts = url.pathname.split("/");
  for (const p of testPaths) {
    let matched = true;
    const testParts = p.split("/");
    if (actualParts.length !== testParts.length) continue; // 長さが異なる場合は自動的に一致しない
    for (let i = 0; i < testParts.length; i++) {
      if (testParts[i]!.startsWith("{")) continue; // パスパラメータ（{user_id}）は常に一致とみなされる
      if (actualParts[i] !== testParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return p;
  }
}
```

:::

::: info 追加の説明

このコードはかなり複雑です！ 大部分は詳細な実装なので無視しても構いません。重要な仕掛けが行われているのは、`mockResponses(…)` 関数のシグネチャです。ここにすべての重要な処理が行われています—この構造と私たちの設計との直接的な関係が見えるでしょう。残りのコードはランタイムが期待通りに動作するように整えるだけです。

:::

```ts
export function mockResponses(responses: {
  [Path in keyof Partial<paths>]: {
    [Method in keyof Partial<paths[Path]>]: MockedResponse<
      PathResponses<paths[Path][Method]>
    >;
  };
});
```

</details>

これで、スキーマが更新されるたびに、**すべてのモックデータが正しく型チェックされる**ようになります 🎉。これは、堅牢で正確なテストを確保するための大きな一歩です。
