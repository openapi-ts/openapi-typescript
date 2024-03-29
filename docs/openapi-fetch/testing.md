---
title: Testing
---

# Testing

Testing openapi-fetch is best done in a test runner that supports TypeScript, such as [Vitest](https://vitest.dev/) or Jest.

## Mocking Requests

To test requests, the `fetch` option can be supplied with any spy function like `vi.fn()` (Vitest) or `jest.fn()` (Jest).

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

## Mocking Responses

Any library that can mock the native `fetch` API can work, such as [vitest-fetch-mock](https://github.com/IanVS/vitest-fetch-mock):

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

## Mock Service Worker

[Mock Service Worker](https://mswjs.io/) can also be used for testing and mocking actual responses:

```ts
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import createClient from "openapi-fetch";
import { afterEach, beforeAll, expect, test } from "vitest";
import type { paths } from "./api/v1";

const server = setupServer();

beforeAll(() => {
  // NOTE: server.listen must be called before `createClient` is used to ensure
  // the msw can inject its version of `fetch` to intercept the requests.
  server.listen({
    onUnhandledRequest: (request) => {
      throw new Error(
        `No request handler found for ${request.method} ${request.url}`,
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
    http.get(`${BASE_URL}/api/v1/foo`, () => HttpResponse.json(rawData, { status: 200 }))
  );

  const client = createClient<paths>({
    baseUrl: BASE_URL,
  });

  const { data, error } = await client.GET("/api/v1/foo");

  expect(data).toEqual(rawData);
  expect(error).toBeUndefined();
});
```
