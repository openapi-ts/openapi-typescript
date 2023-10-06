---
title: API
description: openapi-fetch API
---

## Create Client

**createClient** accepts the following options, which set the default settings for all subsequent fetch calls.

```ts
createClient<paths>(options);
```

| Name              |      Type       | Description                                                                                                                                                                                   |
| :---------------- | :-------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         |    `string`     | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`)                                                                                                                       |
| `fetch`           |     `fetch`     | Fetch instance used for requests (default: `globalThis.fetch`)                                                                                                                                |
| `querySerializer` | QuerySerializer | (optional) Provide a [querySerializer](#queryserializer)                                                                                                                                      |
| `bodySerializer`  | BodySerializer  | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                                                                        |
| (Fetch options)   |                 | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>) |

## Fetch options

The following options apply to all request methods (`.GET()`, `.POST()`, etc.)

```ts
client.get("/my-url", options);
```

| Name              |                               Type                                | Description                                                                                                                                                                                                                                                                            |
| :---------------- | :---------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          |                           ParamsObject                            | <a href="https://swagger.io/specification/#parameter-locations" target="_blank" rel="noopener noreferrer">path</a> and <a href="https://swagger.io/specification/#parameter-locations" target="_blank" rel="noopener noreferrer">query</a> params for the endpoint                     |
| `body`            |                        `{ [name]:value }`                         | <a href="https://spec.openapis.org/oas/latest.html#request-body-object" target="_blank" rel="noopener noreferrer">requestBody</a> data for the endpoint                                                                                                                                |
| `querySerializer` |                          QuerySerializer                          | (optional) Provide a [querySerializer](#queryserializer)                                                                                                                                                                                                                               |
| `bodySerializer`  |                          BodySerializer                           | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                                                                                                                                                                 |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (optional) Parse the response using <a href="https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods" target="_blank" rel="noopener noreferrer">a built-in instance method</a> (default: `"json"`). `"stream"` skips parsing altogether and returns the raw stream. |
| `fetch`           |                              `fetch`                              | Fetch instance used for requests (default: fetch from `createClient`)                                                                                                                                                                                                                  |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal`, …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>)                                                                                         |

### querySerializer

This library uses <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams" target="_blank" rel="noopener noreferrer">URLSearchParams</a> to <a href="https://swagger.io/docs/specification/serialization/" target="_blank" rel="noopener noreferrer">serialize query parameters</a>. For complex query param types (e.g. arrays) you’ll need to provide your own `querySerializer()` method that transforms query params into a URL-safe string:

```ts
const { data, error } = await GET("/search", {
  params: {
    query: { tags: ["food", "california", "healthy"] },
  },
  querySerializer(q) {
    let s = "";
    for (const [k, v] of Object.entries(q)) {
      if (Array.isArray(v)) {
        s += `${k}[]=${v.join(",")}`;
      } else {
        s += `${k}=${v}`;
      }
    }
    return s; // ?tags[]=food&tags[]=california&tags[]=healthy
  },
});
```

### bodySerializer

Similar to [querySerializer](#querySerializer), bodySerializer allows you to customize how the requestBody is serialized if you don’t want the default <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify" target="_blank">JSON.stringify()</a> behavior. You probably only need this when using `multipart/form-data`:

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
