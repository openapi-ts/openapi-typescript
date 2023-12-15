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
client.get("/my-url", options);
```

| Name              | Type                                                              | Description                                                                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          | ParamsObject                                                      | [path](https://swagger.io/specification/#parameter-locations) and [query](https://swagger.io/specification/#parameter-locations) params for the endpoint                                                                          |
| `body`            | `{ [name]:value }`                                                | [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) data for the endpoint                                                                                                                                |
| `querySerializer` | QuerySerializer                                                   | (optional) Provide a [querySerializer](#queryserializer)                                                                                                                                                                          |
| `bodySerializer`  | BodySerializer                                                    | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                                                                                                            |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (optional) Parse the response using [a built-in instance method](https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods) (default: `"json"`). `"stream"` skips parsing altogether and returns the raw stream. |
| `fetch`           | `fetch`                                                           | Fetch instance used for requests (default: fetch from `createClient`)                                                                                                                                                             |
| `middleware`      | `Middleware[]`                                                    | [See docs](#middleware)                                                                                                                                                                                                           |
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

> [!NOTE]
>
> **deepObject** is always exploded, so it doesn’t matter if you set `explode: true` or `explode: false`—it’ll generate the same output.

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

> [!WARNING]
>
> When serializing yourself, the string will be kept exactly as-authored, so you’ll have to call [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) or [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) to escape special characters.

## bodySerializer

Similar to [querySerializer](#queryserializer), bodySerializer allows you to customize how the requestBody is serialized if you don’t want the default [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) behavior. You probably only need this when using `multipart/form-data`:

```ts
const { data, error } = await PUT("/submit", {
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

As of `0.9.0` this library supports lightweight middleware. Middleware allows you to modify either the request, response, or both for all fetches.

You can declare middleware as an array of functions on [createClient](#create-client). Each middleware function will be **called twice**—once for the request, then again for the response. On request, they’ll be called in array order. On response, they’ll be called in reverse-array order. That way the first middleware gets the first “dibs” on request, and the final control over responses.

Within your middleware function, you’ll either need to check for `req` (request) or `res` (response) to handle each pass appropriately:

```ts
createClient({
  middleware: [
    async function myMiddleware({
      req, // request (undefined for responses)
      res, // response (undefined for requests)
      options, // all options passed to openapi-fetch
    }) {
      if (req) {
        return new Request(req.url, {
          ...req,
          headers: { ...req.headers, foo: "bar" },
        });
      } else if (res) {
        return new Response({
          ...res,
          status: 200,
        });
      }
    },
  ],
});
```

### Request pass

The request pass of each middleware provides `req` that’s a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) instance, but has 2 additional properties:

| Name         |   Type   | Description                                                      |
| :----------- | :------: | :--------------------------------------------------------------- |
| `schemaPath` | `string` | The OpenAPI pathname called (e.g. `/projects/{project_id}`)      |
| `params`     | `Object` | The [params](#fetch-options) fetch option provided by the client |

### Response pass

The response pass returns a standard [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) instance with no modifications.

### Skipping middleware

If you want to skip the middleware under certain conditions, just `return` as early as possible:

```ts
async function myMiddleware({ req }) {
  if (req.schemaPath !== "/projects/{project_id}") {
    return;
  }

  // …
}
```

This will leave the request/response unmodified, and pass things off to the next middleware handler (if any). There’s no internal callback or observer library needed.

### Handling statefulness

When using middleware, it’s important to remember 2 things:

- **Create new instances** when modifying (e.g. `new Response()`)
- **Clone bodies** before accessing (e.g. `res.clone().json()`)

This is to account for the fact responses are [stateful](https://developer.mozilla.org/en-US/docs/Web/API/Response/bodyUsed), and if the stream is consumed in middleware [the client will throw an error](https://developer.mozilla.org/en-US/docs/Web/API/Response/clone).

<!-- prettier-ignore -->
```ts
async function myMiddleware({ req, res }) {
  // Example 1: modifying request
  if (req) {
    res.headers.foo = "bar"; // [!code --]
    return new Request(req.url, { // [!code ++]
      ...req, // [!code ++]
      headers: { ...req.headers, foo: "bar" }, // [!code ++]
    }); // [!code ++]
  }

  // Example 2: accessing response
  if (res) {
    const data = await res.json(); // [!code --]
    const data = await res.clone().json(); // [!code ++]
  }
}
```

### Other notes

- `querySerializer()` runs _before_ middleware
  - This is to save middleware from having to do annoying URL formatting. But remember middleware can access `req.params`
- `bodySerializer()` runs _after_ middleware
  - There is some overlap with `bodySerializer()` and middleware. Probably best to use one or the other; not both together.
