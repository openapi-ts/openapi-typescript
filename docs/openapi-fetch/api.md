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
| `fetch`           | `fetch`                                                           | Fetch instance used for requests (default: fetch from `createClient`)                                                                                                                                                             |
| `middleware`      | `Middleware[]`                                                    | [See docs](/openapi-fetch/middleware-auth)                                                                                                                                                                                        |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal`, …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options))                                                                                         |

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

Middleware is an object with `onRequest()` and `onResponse()` callbacks that can observe and modify requests and responses.

```ts
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // generated by openapi-typescript

const myMiddleware: Middleware = {
  async onRequest(req, options) {
    // set "foo" header
    req.headers.set("foo", "bar");
    return req;
  },
  async onResponse(res, options) {
    const { body, ...resOptions } = res;
    // change status of response
    return new Response(body, { ...resOptions, status: 200 });
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// register middleware
client.use(myMiddleware);
```

### onRequest

```ts
onRequest(req, options) {
  // …
}
```

`onRequest()` takes 2 params:

| Name      |        Type         | Description                                                                                                                                                                          |
| :-------- | :-----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`     | `MiddlewareRequest` | A standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) with `schemaPath` (OpenAPI pathname) and `params` ([params](/openapi-fetch/api#fetch-options) object) |
| `options` |   `MergedOptions`   | Combination of [createClient](/openapi-fetch/api#create-client) options + [fetch overrides](/openapi-fetch/api#fetch-options)                                                        |

And it expects either:

- **If modifying the request:** A [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- **If not modifying:** `undefined` (void)

### onResponse

```ts
onResponse(res, options) {
  // …
}
```

`onResponse()` also takes 2 params:
| Name | Type | Description |
| :-------- | :-----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req` | `MiddlewareRequest` | A standard [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). |
| `options` | `MergedOptions` | Combination of [createClient](/openapi-fetch/api#create-client) options + [fetch overrides](/openapi-fetch/api#fetch-options) |

And it expects either:

- **If modifying the response:** A [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- **If not modifying:** `undefined` (void)

### Skipping

If you want to skip the middleware under certain conditions, just `return` as early as possible:

```ts
onRequest(req) {
  if (req.schemaPath !== "/projects/{project_id}") {
    return undefined;
  }
  // …
}
```

This will leave the request/response unmodified, and pass things off to the next middleware handler (if any). There’s no internal callback or observer library needed.

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
