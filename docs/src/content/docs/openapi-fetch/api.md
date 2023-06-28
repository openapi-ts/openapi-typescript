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
| `baseUrl`         |    `string`     | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`).                                                                                                                      |
| `fetch`           |     `fetch`     | Fetch function used for requests (defaults to `globalThis.fetch`)                                                                                                                             |
| `querySerializer` | QuerySerializer | (optional) Serialize query params for all requests (default: `new URLSearchParams()`)                                                                                                         |
| `bodySerializer`  | BodySerializer  | (optional) Serialize request body object for all requests (default: `JSON.stringify()`)                                                                                                       |
| (Fetch options)   |                 | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>) |

## Fetch options

The following options apply to all request methods (`.get()`, `.post()`, etc.)

```ts
client.get("/my-url", options);
```

| Name              |                               Type                                | Description                                                                                                                                                                                                        |
| :---------------- | :---------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          |                           ParamsObject                            | Provide `path` and `query` params from the OpenAPI schema                                                                                                                                                          |
| `params.path`     |                        `{ [name]: value }`                        | Provide all `path` params (params that are part of the URL)                                                                                                                                                        |
| `params.query`    |                        `{ [name]: value }`                        | Provide all `query params (params that are part of the <a href="https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams" target="_blank" rel="noopener noreferrer">searchParams</a>                      |
| `body`            |                        `{ [name]:value }`                         | The <a href="https://spec.openapis.org/oas/latest.html#request-body-object" target="_blank" rel="noopener noreferrer">requestBody</a> data, if needed (PUT/POST/PATCH/DEL only)                                    |
| `querySerializer` |                          QuerySerializer                          | (optional) Serialize query params for this request only (default: `new URLSearchParams()`)                                                                                                                         |
| `bodySerializer`  |                          BodySerializer                           | (optional) Serialize request body for this request only (default: `JSON.stringify()`)                                                                                                                              |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | Parse the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Response/body" target="_blank" rel="noopener noreferrer">response body</a>, with `"stream"` skipping processing altogether (default: `"json"`) |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>)                      |

### querySerializer

This library uses <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams" target="_blank" rel="noopener noreferrer">URLSearchParams</a> to <a href="https://swagger.io/docs/specification/serialization/" target="_blank" rel="noopener noreferrer">serialize query parameters</a>. For complex query param types (e.g. arrays) you’ll need to provide your own `querySerializer()` method that transforms query params into a URL-safe string:

```ts
const { data, error } = await get("/search", {
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

Similar to [querySerializer](#querySerializer), bodySerializer works for requestBody. You probably only need this when using `multipart/form-data`:

```ts
const { data, error } = await put("/submit", {
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
