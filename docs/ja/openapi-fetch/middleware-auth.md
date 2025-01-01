---
title: ミドルウェアと認証
---

# ミドルウェアと認証

ミドルウェアは、すべてのフェッチに対してリクエスト、レスポンス、またはその両方を修正するために使用できます。最も一般的なユースケースの1つは認証ですが、ロギングやテレメトリ、エラーのスロー、特定のエッジケースの処理にも使用できます。

## ミドルウェア

各ミドルウェアは、リクエストやレスポンスを監視および/または変更するための `onRequest()` および `onResponse()` コールバックを提供できます。

::: code-group

```ts [src/my-project.ts]
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const myMiddleware: Middleware = {
  async onRequest({ request, options }) {
    // "foo" ヘッダーを設定
    request.headers.set("foo", "bar");
    return request;
  },
  async onResponse({ request, response, options }) {
    const { body, ...resOptions } = response;
    // レスポンスのステータスを変更
    return new Response(body, { ...resOptions, status: 200 });
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// ミドルウェアを登録
client.use(myMiddleware);
```

:::

::: tip

ミドルウェアが登録される順序は重要です。リクエストに対しては、`onRequest()` が登録順に呼び出されます。レスポンスに対しては、`onResponse()` が逆順で呼び出されます。これにより、最初のミドルウェアがリクエストに対して最初に作用し、最終的なレスポンスを制御することができます。

:::

### スキップ

特定の条件下でミドルウェアをスキップしたい場合は、可能な限り早く `return` してください。

```ts
onRequest({ schemaPath }) {
  if (schemaPath !== "/projects/{project_id}") {
    return undefined;
  }
  // …
}
```

これにより、リクエストやレスポンスが変更されず、次のミドルウェアハンドラ（ある場合）に処理が渡されます。内部のコールバックやオブザーバーライブラリは必要ありません。

### エラーのスロー

ミドルウェアは、通常 `fetch()` がスローしないエラーをスローするためにも使用できます。これは [TanStack Query](https://tanstack.com/query/latest) などのライブラリで便利です。

```ts
onResponse({ response }) {
  if (response.error) {
    throw new Error(response.error.message);
  }
}
```

### ミドルウェアの削除

ミドルウェアを削除するには、`client.eject(middleware)` を呼び出します。

```ts{9}
const myMiddleware = {
  // …
};

// ミドルウェアを登録
client.use(myMiddleware);

// ミドルウェアを削除
client.eject(myMiddleware);
```

### ステートフルな処理

ミドルウェアはネイティブの `Request` と `Response` インスタンスを使用するため、[ボディはステートフル](https://developer.mozilla.org/en-US/docs/Web/API/Response/bodyUsed)であることを覚えておくことが重要です。つまり、

- 変更する場合は**新しいインスタンスを作成する** (`new Request()` / `new Response()`)
- 変更しない場合は**クローンする** (`res.clone().json()`)

デフォルトでは、`openapi-fetch` はパフォーマンスのためにリクエストやレスポンスをクローン**しません**。クリーンなコピーを作成するのはあなた次第です。

<!-- prettier-ignore -->
```ts
const myMiddleware: Middleware = {
  onResponse({ response }) {
    const data = await response.json(); // [!code --]
    const data = await response.clone().json(); // [!code ++]
    return undefined;
  },
};
```

## 認証

このライブラリは特定の認証設定には依存しないため、任意の [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) 設定と組み合わせて使用することができます。しかし、認証を容易にするためのいくつかの提案を以下に示します。

### ベーシック認証

この基本的な例では、各リクエストで最新のトークンを取得するためにミドルウェアを使用します。この例では、アクセストークンがJavaScriptモジュールの状態で保持されており、クライアントアプリケーションには安全ですが、サーバーアプリケーションでは避けるべきです。

::: code-group

```ts [src/my-project.ts]
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema";

let accessToken: string | undefined = undefined;

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // トークンが存在しない場合は取得
    if (!accessToken) {
      const authRes = await someAuthFunc();
      if (authRes.accessToken) {
        accessToken = authRes.accessToken;
      } else {
        // 認証エラーの処理
      }
    }

    // （任意）トークンが期限切れになった場合のロジックを追加

    // すべてのリクエストにAuthorizationヘッダーを追加
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });
client.use(authMiddleware);

const authRequest = await client.GET("/some/auth/url");
```

:::

### 条件付き認証

特定のルートには認証が不要な場合、ミドルウェアでそれを処理することもできます:

::: code-group

```ts [src/my-project.ts]
const UNPROTECTED_ROUTES = ["/v1/login", "/v1/logout", "/v1/public/"];

const authMiddleware = {
  onRequest({ schemaPath, request }) {
    if (
      UNPROTECTED_ROUTES.some((pathname) => schemaPath.startsWith(pathname))
    ) {
      return undefined; // 特定のパスに対してはリクエストを変更しない
    }

    // その他のパスには期待通りにAuthorizationヘッダーを設定
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
};
```

:::
