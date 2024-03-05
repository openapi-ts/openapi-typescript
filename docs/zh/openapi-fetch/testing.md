---
title: 测试
---

# 测试

最好在支持 TypeScript 的测试运行器中进行 openapi-fetch 的测试，比如 [Vitest](https://vitest.dev/) 或 Jest。

## 模拟请求

要测试请求，可以使用 `fetch` 选项并提供任何 spy 函数，比如 `vi.fn()`（Vitest）或 `jest.fn()`（Jest）。

```ts
import createClient from "openapi-fetch";
import { expect, test, vi } from "vitest";
import type { paths } from "./api/v1";

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

## 模拟响应

任何能够模拟原生 `fetch` API 的库都可以工作，比如 [vitest-fetch-mock](https://github.com/IanVS/vitest-fetch-mock):

```ts
import createClient from "openapi-fetch";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import type { paths } from "./api/v1";

const fetchMocker = createFetchMock(vi);

beforeAll(() => {
  fetchMocker.enableMocks();
});
afterEach(() => {
  fetchMocker.resetMocks();
});

test("my API call", async () => {
  const rawData = { test: { data: "foo" } };
  mockFetchOnce({
    status: 200,
    body: JSON.stringify(rawData),
  });
  const client = createClient<paths>({
    baseUrl: "https://my-site.com/api/v1/",
  });

  const { data, error } = await client.GET("/foo");

  expect(data).toEqual(rawData);
  expect(error).toBeUndefined();
});
```
