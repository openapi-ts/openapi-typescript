import { assertType, expect, expectTypeOf, test } from "vitest";
import type { Middleware, MiddlewareCallbackParams } from "../../src/index.js";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/middleware.js";

test("receives a UUID per-request", async () => {
  const client = createObservedClient<paths>();

  const requestIDs: string[] = [];
  const responseIDs: string[] = [];

  client.use({
    async onRequest({ id }) {
      requestIDs.push(id);
    },
    async onResponse({ id }) {
      responseIDs.push(id);
    },
  });

  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  // assert IDs matched between requests and responses
  expect(requestIDs[0]).toBe(responseIDs[0]);
  expect(requestIDs[1]).toBe(responseIDs[1]);
  expect(requestIDs[2]).toBe(responseIDs[2]);

  // assert IDs were unique
  expect(requestIDs[0] !== requestIDs[1] && requestIDs[1] !== requestIDs[2]).toBe(true);
});

test("can modify request", async () => {
  let actualRequest = new Request("https://nottherealurl.fake");
  const client = createObservedClient<paths>({}, async (req) => {
    actualRequest = new Request(req);
    return Response.json({});
  });
  client.use({
    async onRequest({ request }) {
      return new Request("https://foo.bar/api/v1", {
        ...request,
        method: "OPTIONS",
        headers: { foo: "bar" },
      });
    },
  });

  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  expect(actualRequest.url).toBe("https://foo.bar/api/v1");
  expect(actualRequest.method).toBe("OPTIONS");
  expect(actualRequest.headers.get("foo")).toBe("bar");
});

test("can modify response", async () => {
  const toUnix = (date: string) => new Date(date).getTime();

  const rawBody = {
    email: "user123@gmail.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-20T00:00:00Z",
  };

  const client = createObservedClient<paths>({}, async () => Response.json(rawBody, { headers: { foo: "bar" } }));

  client.use({
    // convert date string to unix time
    async onResponse({ response }) {
      const body = await response.json();
      body.created_at = toUnix(body.created_at);
      body.updated_at = toUnix(body.updated_at);
      const headers = new Headers(response.headers);
      headers.set("middleware", "value");
      return new Response(JSON.stringify(body), {
        status: 201,
        headers,
      });
    },
  });

  const { data, response } = await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  // assert body was modified
  expect((data as any).created_at).toBe(toUnix(rawBody.created_at));
  expect((data as any).updated_at).toBe(toUnix(rawBody.updated_at));
  // assert rest of body was preserved
  expect((data as any).email).toBe(rawBody.email);
  // assert status changed
  expect(response.status).toBe(201);
  // assert server headers were preserved
  expect(response.headers.get("foo")).toBe("bar");
  // assert middleware heaers were added
  expect(response.headers.get("middleware")).toBe("value");
});

test("returns original errors if nothing is returned", async () => {
  const actualError = new Error();
  const client = createObservedClient<paths>({}, async (req) => {
    throw actualError;
  });
  client.use({
    onError({ error }) {
      expect(error).toBe(actualError);
      return;
    },
  });

  try {
    await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
  } catch (thrownError) {
    expect(thrownError).toBe(actualError);
  }
});

test("can modify errors", async () => {
  const actualError = new Error();
  const modifiedError = new Error();
  const client = createObservedClient<paths>({}, async (req) => {
    throw actualError;
  });
  client.use({
    onError() {
      return modifiedError;
    },
  });

  try {
    await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
  } catch (thrownError) {
    expect(thrownError).toBe(modifiedError);
  }
});

test("can catch errors and return a response instead", async () => {
  const actualError = new Error();
  const customResponse = Response.json({});
  const client = createObservedClient<paths>({}, async (req) => {
    throw actualError;
  });
  client.use({
    onError({ error }) {
      expect(error).toBe(actualError);
      return customResponse;
    },
  });

  const { response } = await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  expect(response).toBe(customResponse);
});

test("executes in expected order", async () => {
  let actualRequest = new Request("https://nottherealurl.fake");
  const client = createObservedClient<paths>({}, async (req) => {
    actualRequest = new Request(req);
    return Response.json({});
  });
  // this middleware passes along the “step” header
  // for both requests and responses, but first checks if
  // it received the end result of the previous middleware step
  client.use(
    {
      async onRequest({ request }) {
        request.headers.set("step", "A");
        return request;
      },
      async onResponse({ response }) {
        if (response.headers.get("step") === "B") {
          const headers = new Headers(response.headers);
          headers.set("step", "A");
          return new Response(response.body, { ...response, headers });
        }
      },
    },
    {
      async onRequest({ request }) {
        request.headers.set("step", "B");
        return request;
      },
      async onResponse({ response }) {
        const headers = new Headers(response.headers);
        headers.set("step", "B");
        if (response.headers.get("step") === "C") {
          return new Response(response.body, { ...response, headers });
        }
      },
    },
    {
      onRequest({ request }) {
        request.headers.set("step", "C");
        return request;
      },
      onResponse({ response }) {
        const headers = new Headers(response.headers);
        headers.set("step", "C");
        if (response.headers.get("step") === "D") {
          return new Response(response.body, { ...response, headers });
        }
      },
    },
  );

  const { response } = await client.GET("/posts/{id}", {
    params: { path: { id: 123 } },
    middleware: [
      {
        onRequest({ request }) {
          request.headers.set("step", "D");
          return request;
        },
        onResponse({ response }) {
          response.headers.set("step", "D");
          return response;
        },
      },
    ],
  });

  // assert requests ended up on step C (array order)
  expect(actualRequest.headers.get("step")).toBe("D");

  // assert responses ended up on step A (reverse order)
  expect(response.headers.get("step")).toBe("A");
});

test("executes error handlers in expected order", async () => {
  const actualError = new Error();
  const modifiedError = new Error();
  const customResponse = Response.json({});
  const client = createObservedClient<paths>({}, async (req) => {
    throw actualError;
  });
  client.use({
    onError({ error }) {
      expect(error).toBe(modifiedError);
      return customResponse;
    },
  });
  client.use({
    onError() {
      return modifiedError;
    },
  });

  const { response } = await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  expect(response).toBe(customResponse);
});

test("receives correct options", async () => {
  let requestBaseUrl = "";

  const client = createObservedClient<paths>({
    baseUrl: "https://api.foo.bar/v1/",
  });
  client.use({
    onRequest({ options }) {
      requestBaseUrl = options.baseUrl;
      return undefined;
    },
  });

  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
  expect(requestBaseUrl).toBe("https://api.foo.bar/v1");
});

test("receives the original request", async () => {
  const client = createObservedClient<paths>();
  client.use({
    onResponse({ request }) {
      expect(request).toBeInstanceOf(Request);
      return undefined;
    },
  });

  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });
});

test("receives OpenAPI options passed in from parent", async () => {
  const pathname = "/tag/{name}";
  const tagData = {
    params: {
      path: {
        name: "New Tag",
      },
    },
    body: {
      description: "Tag Description",
    },
    query: {
      foo: "bar",
    },
  };

  let receivedPath = "";
  let receivedParams: MiddlewareCallbackParams["params"] = {};

  const client = createObservedClient<paths>();
  client.use({
    onRequest({ schemaPath, params }) {
      receivedPath = schemaPath;
      receivedParams = params;
      return undefined;
    },
  });
  await client.PUT(pathname, tagData);

  expect(receivedPath).toBe(pathname);
  expect(receivedParams).toEqual(tagData.params);
});

test("can be skipped without interrupting request", async () => {
  const client = createObservedClient<paths>({}, async (req) => {
    if (!req) {
      return Response.json(null, { status: 500 });
    }
    return Response.json({ id: 123 });
  });
  client.use({
    onRequest() {
      return undefined;
    },
  });
  const { data } = await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  expect(data).toEqual({ id: 123 });
});

test("can be ejected", async () => {
  let called = false;
  const errorMiddleware = {
    onRequest() {
      called = true;
      throw new Error("oops");
    },
  };

  const client = createObservedClient<paths>({}, async (req) => Response.json({ id: 123 }));
  client.use(errorMiddleware);
  client.eject(errorMiddleware);

  expect(() => client.GET("/posts/{id}", { params: { path: { id: 123 } } })).not.toThrow();
  expect(called).toBe(false);
});

test("preserves (and can safely add) headers", async () => {
  let actualRequest = new Request("https://nottherealurl.fake");
  const client = createObservedClient<paths>(
    {
      headers: {
        createClient: "exists",
      },
    },
    async (req) => {
      actualRequest = new Request(req);
      return Response.json({ id: 123 });
    },
  );

  client.use(
    {
      onRequest({ request }) {
        // assert headers are kept in middleware onRequest
        expect(request.headers.get("createClient")).toBe("exists");
        expect(request.headers.get("onFetch")).toBe("exists");
        request.headers.set("onRequest", "exists");
        return request;
      },
      onResponse({ request }) {
        // assert headers are (still) kept in onResponse
        expect(request.headers.get("createClient")).toBe("exists");
        expect(request.headers.get("onFetch")).toBe("exists");
        expect(request.headers.get("onRequest")).toBe("exists");
      },
    },
    {
      onRequest({ request }) {
        // also assert a 2nd middleware (that doesn’t modify request) still sees headers
        expect(request.headers.get("createClient")).toBe("exists");
        expect(request.headers.get("onFetch")).toBe("exists");
        expect(request.headers.get("onRequest")).toBe("exists");
      },
    },
  );

  await client.GET("/posts/{id}", {
    params: { path: { id: 123 } },
    headers: { onFetch: "exists" },
  });

  // assert server received them in final request
  expect(actualRequest.headers.get("createClient")).toBe("exists");
  expect(actualRequest.headers.get("onFetch")).toBe("exists");
  expect(actualRequest.headers.get("onRequest")).toBe("exists");
});

test("baseUrl can be overridden", async () => {
  let reqUrl = "";

  const client = createObservedClient<paths>(
    {
      baseUrl: "https://nottherealurl.fake",
    },
    async () => Response.json({ id: 123 }),
  );
  client.use({
    onRequest({ options }) {
      reqUrl = options.baseUrl;
      return undefined;
    },
  });

  await client.GET("/posts/{id}", {
    baseUrl: "https://api.foo.bar/v1/",
    params: { path: { id: 123 } },
  });
  expect(reqUrl).toBe("https://api.foo.bar/v1");
});

test("auth header", async () => {
  let accessToken: string | undefined;
  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      if (accessToken) {
        request.headers.set("Authorization", `Bearer ${accessToken}`);
        return request;
      }
    },
  };

  let headers = new Headers();
  const client = createObservedClient<paths>({}, async (req) => {
    headers = req.headers;
    return Response.json({});
  });
  client.use(authMiddleware);

  // assert initial call is unauthenticated
  await client.GET("/posts/{id}", {
    params: { path: { id: 123 } },
  });
  expect(headers.get("authorization")).toBeNull();

  // assert after setting token, client is authenticated
  accessToken = "real_token";
  await client.GET("/posts/{id}", {
    params: { path: { id: 123 } },
  });
  expect(headers.get("authorization")).toBe(`Bearer ${accessToken}`);
});

test("type error occurs only when neither onRequest nor onResponse is specified", async () => {
  expectTypeOf<Middleware>().not.toEqualTypeOf({});
  const onRequest = async ({ request }: MiddlewareCallbackParams) => request;
  const onResponse = async ({ response }: MiddlewareCallbackParams & { response: Response }) => response;
  assertType<Middleware>({ onRequest });
  assertType<Middleware>({ onResponse });
  assertType<Middleware>({ onRequest, onResponse });
});

test("can return response directly from onRequest", async () => {
  const customResponse = Response.json({});

  const client = createObservedClient<paths>({}, () => {
    throw new Error("unexpected call to fetch");
  });

  client.use({
    async onRequest() {
      return customResponse;
    },
  });

  const { response } = await client.GET("/posts/{id}", {
    params: { path: { id: 123 } },
  });

  expect(response).toBe(customResponse);
});

test("skips subsequent onRequest handlers when response is returned", async () => {
  let onRequestCalled = false;
  const client = createObservedClient<paths>();

  client.use(
    {
      async onRequest() {
        return Response.json({});
      },
    },
    {
      async onRequest() {
        onRequestCalled = true;
        return undefined;
      },
    },
  );

  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  expect(onRequestCalled).toBe(false);
});

test("skips onResponse handlers when response is returned from onRequest", async () => {
  let onResponseCalled = false;
  const client = createObservedClient<paths>();

  client.use({
    async onRequest() {
      return Response.json({});
    },
    async onResponse() {
      onResponseCalled = true;
      return undefined;
    },
  });

  await client.GET("/posts/{id}", { params: { path: { id: 123 } } });

  expect(onResponseCalled).toBe(false);
});

test("add middleware at the request level", async () => {
  const customResponse = Response.json({});
  const client = createObservedClient<paths>({}, async () => {
    throw new Error("unexpected call to fetch");
  });

  const { response } = await client.GET("/posts/{id}", {
    params: { path: { id: 123 } },
    middleware: [
      {
        async onRequest() {
          return customResponse;
        },
      },
    ],
  });

  expect(response).toBe(customResponse);
});
