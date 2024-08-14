---
title: 使用例
description: openapi-typescriptを実際のアプリケーションで使用する例
---

# 使用例

openapi-typescriptで生成された型は汎用性が高く、さまざまな方法で利用できます。これらの例は包括的なものではありませんが、アプリケーションでの使用方法についてのアイデアを刺激することを期待しています。

## データフェッチ

データを取得する際には、**自動的に型付けされたfetchラッパー**を使用すると、簡単かつ安全に行えます：

- [openapi-fetch](/ja/openapi-fetch/) (推奨)
- [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) by [@ajaishankar](https://github.com/ajaishankar)

::: tip

良いfetchラッパーは**ジェネリクスの使用は避ける**べきです。ジェネリクスは多くのタイプ指定が必要で、エラーを隠してしまう可能性があります！

:::

## Hono

[Hono](https://hono.dev/)は、Node.js用のモダンなサーバーフレームワークで、エッジ環境（例：[Cloudflare Workers](https://developers.cloudflare.com/workers/)）や標準コンテナに簡単にデプロイできます。また、TypeScriptが組み込まれており、生成された型と非常に相性が良いです。

[CLIを使用して型を生成](/ja/introduction)した後、各エンドポイントに適切な `paths` レスポンスを渡します：

::: code-group

```ts [src/my-project.ts]
import { Hono } from "hono";
import { components, paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成

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

## Mock-Service-Worker (MSW)

[Mock Service Worker (MSW)](https://mswjs.io) を使用してAPIモックを定義している場合、**小さくて自動的に型付けされたラッパー**をMSWと合わせて使用することで、OpenAPI仕様が変更された際にAPIモックのコンフリクトを簡単に解決できます。最終的には、アプリケーションのAPIクライアントとAPIモックの**両方**に同じレベルの信頼を持つことができます。

`openapi-typescript` と `openapi-fetch` のようなfetchラッパーを使用することで、アプリケーションのAPIクライアントがOpenAPI仕様とコンフリクトしないように保証できます。

しかし、APIクライアントの問題を簡単に解決できる一方で、コンフリクトについて警告するメカニズムがないため、APIモックを"手動で"調整する必要があります。

以下のラッパーは、`openapi-typescript` と完璧に連携しますのでお勧めします：

- [openapi-msw](https://www.npmjs.com/package/openapi-msw) by [@christoph-fricke](https://github.com/christoph-fricke)

## テスト用モック

最も一般的なテストの誤検知の原因の一つは、モックが実際のAPIレスポンスと一致していない場合です。

`openapi-typescript` は、最小限の労力でこれを防ぐための素晴らしい方法を提供します。以下に、OpenAPIスキーマに一致するようにすべてのモックを型チェックするためのヘルパー関数を書く一例を示します（ここでは[vitest](https://vitest.dev/)や[vitest-fetch-mock](https://www.npmjs.com/package/vitest-fetch-mock)を使用しますが、同じ原則が他の設定にも適用できます）：

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

以下のコードは、`test/utils.ts` ファイルに記述し、必要に応じてプロジェクトにコピー＆ペーストして使用することができます（シンプルさを保つために隠しています）。

<details>
<summary>📄 <strong>test/utils.ts</strong></summary>

::: code-group

```ts [test/utils.ts]
import type { paths } from "./my-openapi-3-schema"; // generated by openapi-typescript

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

このコードはかなり複雑です！ 大部分は詳細な実装なので無視しても構いません。重要な仕掛けが行われているのは、`mockResponses(…)` 関数のシグネチャです。ここには、この構造と私たちの設計との直接的なリンクがあることに気づくでしょう。その後、残りのコードは、ランタイムが期待通りに動作するように調整するためのものです。

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
