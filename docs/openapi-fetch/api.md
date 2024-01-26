---
title: API
description: openapi-fetch API
---

# API

## Create Client

**createClient** accepts the following options, which set the default settings for all subsequent fetch calls.

```ts
createClient<paths>(options);
```

| Name              |      Type       | Description                                                                                                                             |
| :---------------- | :-------------: | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         |    `string`     | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`)                                                                 |
| `fetch`           |     `fetch`     | Fetch instance used for requests (default: `globalThis.fetch`)                                                                          |
| `querySerializer` | QuerySerializer | (optional) Provide a [querySerializer](#queryserializer)                                                                                |
| `bodySerializer`  | BodySerializer  | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                  |
| (Fetch options)   |                 | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) |

## Fetch options

The following options apply to all request methods (`.GET()`, `.POST()`, etc.)

```ts
client.get("/my-url", options);
```

| Name              |                               Type                                | Description                                                                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          |                           ParamsObject                            | [path](https://swagger.io/specification/#parameter-locations) and [query](https://swagger.io/specification/#parameter-locations) params for the endpoint                                                                          |
| `body`            |                        `{ [name]:value }`                         | [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) data for the endpoint                                                                                                                                |
| `querySerializer` |                          QuerySerializer                          | (optional) Provide a [querySerializer](#queryserializer)                                                                                                                                                                          |
| `bodySerializer`  |                          BodySerializer                           | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                                                                                                            |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (optional) Parse the response using [a built-in instance method](https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods) (default: `"json"`). `"stream"` skips parsing altogether and returns the raw stream. |
| `fetch`           |                              `fetch`                              | Fetch instance used for requests (default: fetch from `createClient`)                                                                                                                                                             |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal`, …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options))                                                                                         |

### querySerializer

By default, this library serializes query parameters using `style: form` and `explode: true` [according to the OpenAPI specification](https://swagger.io/docs/specification/serialization/#query). To change the default behavior, you can supply your own `querySerializer()` function either on the root `createClient()` as well as optionally on an individual request. This is useful if your backend expects modifications like the addition of `[]` for array params:

```ts
const { data, error } = await GET("/search", {
  params: {
    query: { tags: ["food", "california", "healthy"] },
  },
  querySerializer(q) {
    let s = [];
    for (const [k, v] of Object.entries(q)) {
      if (Array.isArray(v)) {
        for (const i of v) {
          s.push(`${k}[]=${i}`);
        }
      } else {
        s.push(`${k}=${v}`);
      }
    }
    return s.join("&"); // ?tags[]=food&tags[]=california&tags[]=healthy
  },
});
```

### bodySerializer

Similar to [querySerializer](#querySerializer), bodySerializer allows you to customize how the requestBody is serialized if you don’t want the default [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) behavior. You probably only need this when using `multipart/form-data`:

```ts
const { data, error } = await PUT("/submit", {
  body: {
    name: "",
    query: { version: 2 },
  },
  bodySerializer(body) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(body)) {
      fd.append(k, v);
    }
    return fd;
  },
});
```
