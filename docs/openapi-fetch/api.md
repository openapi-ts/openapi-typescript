---
title: API
description: openapi-fetch API
---

# API

## createClient

**createClient** accepts the following options, which set the default settings for all subsequent fetch calls.

```ts
createClient<paths>(options);
```

| Name              | Type            | Description                                                                                                                             |
| :---------------- | :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         | `string`        | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`)                                                                 |
| `fetch`           | `fetch`         | Fetch instance used for requests (default: `globalThis.fetch`)                                                                          |
| `querySerializer` | QuerySerializer | (optional) Provide a [querySerializer](#queryserializer)                                                                                |
| `bodySerializer`  | BodySerializer  | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                  |
| (Fetch options)   |                 | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) |

## Fetch options

The following options apply to all request methods (`.GET()`, `.POST()`, etc.)

```ts
client.GET("/my-url", options);
```

| Name              | Type                                                              | Description                                                                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          | ParamsObject                                                      | [path](https://swagger.io/specification/#parameter-locations) and [query](https://swagger.io/specification/#parameter-locations) params for the endpoint                                                                          |
| `body`            | `{ [name]:value }`                                                | [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) data for the endpoint                                                                                                                                |
| `querySerializer` | QuerySerializer                                                   | (optional) Provide a [querySerializer](#queryserializer)                                                                                                                                                                          |
| `bodySerializer`  | BodySerializer                                                    | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                                                                                                            |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (optional) Parse the response using [a built-in instance method](https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods) (default: `"json"`). `"stream"` skips parsing altogether and returns the raw stream. |
| `baseUrl`         | `string`                                                          | Prefix the fetch URL with this option (e.g. `"https://myapi.dev/v1/"`)                                                                                                                                                              |
| `fetch`           | `fetch`                                                           | Fetch instance used for requests (default: fetch from `createClient`)                                                                                                                                                             |
| `middleware`      | `Middleware[]`                                                    | [See docs](/openapi-fetch/middleware-auth)                                                                                                                                                                                        |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal`, …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options))                                                                                         |

## wrapAsPathBasedClient

**wrapAsPathBasedClient** wraps the result of `createClient()` to return a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)-based client that allows path-indexed calls:

```ts
const client = createClient<paths>(clientOptions);
const pathBasedClient = wrapAsPathBasedClient(client);

pathBasedClient["/my-url"].GET(fetchOptions);
```

The `fetchOptions` are the same than for the base client.

A path based client can lead to better type inference but comes at a runtime cost due to the use of a Proxy.

**createPathBasedClient** is a convenience method combining `createClient` and `wrapAsPathBasedClient` if you only want to use the path based call style:

```ts
const client = createPathBasedClient<paths>(clientOptions);

client["/my-url"].GET(fetchOptions);
```

Note that it does not allow you to attach middlewares. If you need middlewares, you need to use the full form:

```ts
const client = createClient<paths>(clientOptions);

client.use(...);

const pathBasedClient = wrapAsPathBasedClient(client);

client.use(...); // the client reference is shared, so the middlewares will propagate.

pathBasedClient["/my-url"].GET(fetchOptions);
```

## querySerializer

OpenAPI supports [different ways of serializing objects and arrays](https://swagger.io/docs/specification/serialization/#query) for parameters (strings, numbers, and booleans—primitives—always behave the same way). By default, this library serializes arrays using `style: "form", explode: true`, and objects using `style: "deepObject", explode: true`, but you can customize that behavior with the `querySerializer` option (either on `createClient()` to control every request, or on individual requests for just one).

### Object syntax

openapi-fetch ships the common serialization methods out-of-the-box:

| Option          |       Type        | Description                                                                                                                                                    |
| :-------------- | :---------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `array`         | SerializerOptions | Set `style` and `explode` for arrays ([docs](https://swagger.io/docs/specification/serialization/#query)). Default: `{ style: "form", explode: true }`.        |
| `object`        | SerializerOptions | Set `style` and `explode` for objects ([docs](https://swagger.io/docs/specification/serialization/#query)). Default: `{ style: "deepObject", explode: true }`. |
| `allowReserved` |     `boolean`     | Set to `true` to skip URL encoding (⚠️ may break the request) ([docs](https://swagger.io/docs/specification/serialization/#query)). Default: `false`.          |

```ts
const client = createClient({
  querySerializer: {
    array: {
      style: "pipeDelimited", // "form" (default) | "spaceDelimited" | "pipeDelimited"
      explode: true,
    },
    object: {
      style: "form", // "form" | "deepObject" (default)
      explode: true,
    },
  },
});
```

#### Array styles

| Style                        | Array `id = [3, 4, 5]`  |
| :--------------------------- | :---------------------- |
| form                         | `/users?id=3,4,5`       |
| **form (exploded, default)** | `/users?id=3&id=4&id=5` |
| spaceDelimited               | `/users?id=3%204%205`   |
| spaceDelimited (exploded)    | `/users?id=3&id=4&id=5` |
| pipeDelimited                | `/users?id=3\|4\|5`     |
| pipeDelimited (exploded)     | `/users?id=3&id=4&id=5` |

#### Object styles

| Style                    | Object `id = {"role": "admin", "firstName": "Alex"}` |
| :----------------------- | :--------------------------------------------------- |
| form                     | `/users?id=role,admin,firstName,Alex`                |
| form (exploded)          | `/users?role=admin&firstName=Alex`                   |
| **deepObject (default)** | `/users?id[role]=admin&id[firstName]=Alex`           |

::: tip

**deepObject** is always exploded, so it doesn’t matter if you set `explode: true` or `explode: false`—it’ll generate the same output.

:::

### Alternate function syntax

Sometimes your backend doesn’t use one of the standard serialization methods, in which case you can pass a function to `querySerializer` to serialize the entire string yourself. You’ll also need to use this if you’re handling deeply-nested objects and arrays in your params:

```ts
const client = createClient({
  querySerializer(queryParams) {
    const search = [];
    for (const name in queryParams) {
      const value = queryParams[name];
      if (Array.isArray(value)) {
        for (const item of value) {
          s.push(`${name}[]=${encodeURIComponent(item)}`);
        }
      } else {
        s.push(`${name}=${encodeURLComponent(value)}`);
      }
    }
    return search.join(","); // ?tags[]=food,tags[]=california,tags[]=healthy
  },
});
```

::: warning

When serializing yourself, the string will be kept exactly as-authored, so you’ll have to call [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) or [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) to escape special characters.

:::

## bodySerializer

Similar to [querySerializer](#queryserializer), bodySerializer allows you to customize how the requestBody is serialized if you don’t want the default [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) behavior. You probably only need this when using `multipart/form-data`:

```ts
const { data, error } = await client.PUT("/submit", {
  body: {
    name: "",
    query: { version: 2 },
  },
  bodySerializer(body) {
    const fd = new FormData();
    for (const name in body) {
      fd.append(name, body[name]);
    }
    return fd;
  },
});
```

::: tip

For convenience, `openapi-fetch` sets `Content-Type` to `application/json` automatically
for any request that provides value for the `body` parameter. When the `bodySerializer` returns an instance of `FormData`,
`Content-Type` is omitted, allowing the browser to set it automatically with the correct message part boundary.

You can also set `Content-Type` manually through `headers` object either in the fetch options,
or when instantiating the client.

:::

### URL-encoded body

To send a body request in `application/x-www-form-urlencoded` format, which is commonly used to transmit key-value pairs in APIs like OAuth 2.0, pass the appropriate header and body as an object. `openapi-fetch` will automatically encode the body to the correct format.

```ts
const { data, error } = await client.POST("/tokens", {
  body: {
    clientId: "someClientId",
    clientSecret: "someClientSecret",
  },
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});
```

## Path serialization

openapi-fetch supports path serialization as [outlined in the 3.1 spec](https://swagger.io/docs/specification/serialization/#path). This happens automatically, based on the specific format in your OpenAPI schema:

| Template          | Style                | Primitive `id = 5` | Array `id = [3, 4, 5]`   | Object `id = {"role": "admin", "firstName": "Alex"}` |
| :---------------- | :------------------- | :----------------- | :----------------------- | :--------------------------------------------------- |
| **`/users/{id}`** | **simple (default)** | **`/users/5`**     | **`/users/3,4,5`**       | **`/users/role,admin,firstName,Alex`**               |
| `/users/{id*}`    | simple (exploded)    | `/users/5`         | `/users/3,4,5`           | `/users/role=admin,firstName=Alex`                   |
| `/users/{.id}`    | label                | `/users/.5`        | `/users/.3,4,5`          | `/users/.role,admin,firstName,Alex`                  |
| `/users/{.id*}`   | label (exploded)     | `/users/.5`        | `/users/.3.4.5`          | `/users/.role=admin.firstName=Alex`                  |
| `/users/{;id}`    | matrix               | `/users/;id=5`     | `/users/;id=3,4,5`       | `/users/;id=role,admin,firstName,Alex`               |
| `/users/{;id*}`   | matrix (exploded)    | `/users/;id=5`     | `/users/;id=3;id=4;id=5` | `/users/;role=admin;firstName=Alex`                  |

## Middleware

Middleware is an object with `onRequest()`, `onResponse()` and `onError()` callbacks that can observe and modify requests, responses and errors.

```ts
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // generated by openapi-typescript

const myMiddleware: Middleware = {
  async onRequest({ request, options }) {
    // set "foo" header
    request.headers.set("foo", "bar");
    return request;
  },
  async onResponse({ request, response, options }) {
    const { body, ...resOptions } = res;
    // change status of response
    return new Response(body, { ...resOptions, status: 200 });
  },
  async onError({ error }) {
    // wrap errors thrown by fetch
    return new Error("Oops, fetch failed", { cause: error });
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// register middleware
client.use(myMiddleware);
```

### API

#### Parameters

Each middleware callback receives the following `options` object with the following:

| Name         | Type            | Description                                                      |
| :----------- | :-------------- | :----------------------------------------------------------------|
| `request`    | `Request`       | The current `Request` to be sent to the endpoint.                |
| `schemaPath` | `string`        | The original OpenAPI path called (e.g. `/users/{user_id}`)       |
| `params`     | `Object`        | The original `params` object passed to `GET()` / `POST()` / etc. |
| `id`         | `string`        | A random, unique ID for this request.                            |
| `options`    | `ClientOptions` | The readonly options passed to `createClient()`.                 |

In addition to these, the `onResponse` callback receives an additional `response` property:

| Name         | Type            | Description                                |
| :----------- | :-------------- | :------------------------------------------|
| `response`   | `Response`      | The `Response` returned from the endpoint. |

And the `onError` callback receives an additional `error` property:

| Name         | Type            | Description                                                              |
| :----------- | :-------------- | :------------------------------------------------------------------------|
| `error`      | `unknown`       | The error thrown by `fetch`, probably a `TypeError` or a `DOMException`. |

#### Response

Each middleware callback can return:

- **onRequest**: A `Request` to modify the request, a `Response` to short-circuit the middleware chain, or `undefined` to leave request untouched (skip)
- **onResponse**: Either a `Response` to modify the response, or `undefined` to leave it untouched (skip)
- **onError**: Either an `Error` to modify the error that is thrown, a `Response` which means that the `fetch` call will proceed as successful, or `undefined` to leave the error untouched (skip)

### Ejecting middleware

To remove middleware, call `client.eject(middleware)`:

```ts{9}
const myMiddleware = {
  // …
};

// register middleware
client.use(myMiddleware);

// remove middleware
client.eject(myMiddleware);
```

For additional guides & examples, see [Middleware & Auth](/openapi-fetch/middleware-auth)
