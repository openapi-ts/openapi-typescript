---
title: テスト
---

# テスト

openapi-fetchのテストは、[Vitest](https://vitest.dev/) や Jest のような TypeScript をサポートするテストランナーで行うのが最適です。

## リクエストのモック

リクエストをテストするには、`fetch` オプションに `vi.fn()`（Vitest）や `jest.fn()`（Jest）などのスパイ関数を渡すことができます。

::: code-group

```ts [src/my-project.test.ts]
import createClient from "openapi-fetch";
import { expect, test, vi } from "vitest";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

test("my request", async () => {
  const mockFetch = vi.fn();
  const client = createClient<paths>({
    baseUrl: "https://my-site.com/api/v1/",
    fetch: mockFetch,
  });

  const reqBody = { name: "test" };
  await client.PUT("/tag", { body: reqBody });

  const req = mockFetch.mock.calls[0][0];
  expect(req.url).toBe("/tag");
  expect(await req.json()).toEqual(reqBody);
});
```

:::

## レスポンスのモック

テストでAPIレスポンスをモックするには、[Mock Service Worker](https://mswjs.io/) の使用を強くお勧めします。

::: code-group

```ts [src/my-project.test.ts]
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import createClient from "openapi-fetch";
import { afterEach, beforeAll, expect, test } from "vitest";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const server = setupServer();

beforeAll(() => {
  // NOTE: server.listenは、`createClient`が使用される前に呼び出される必要があります。
  // これにより、mswが自身の`fetch`バージョンをインジェクトしてリクエストをインターセプトできます。
  server.listen({
    onUnhandledRequest: (request) => {
      throw new Error(
        `No request handler found for ${request.method} ${request.url}`
      );
    },
  });
});

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("my API call", async () => {
  const rawData = { test: { data: "foo" } };

  const BASE_URL = "https://my-site.com";

  server.use(
    http.get(`${BASE_URL}/api/v1/foo`, () =>
      HttpResponse.json(rawData, { status: 200 })
    )
  );

  const client = createClient<paths>({
    baseUrl: BASE_URL,
  });

  const { data, error } = await client.GET("/api/v1/foo");

  expect(data).toEqual(rawData);
  expect(error).toBeUndefined();
});
```

:::
