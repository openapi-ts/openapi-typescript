---
title: API
description: openapi-fetch API
---

## Create Client

**createClient** accepts the following options, which set the default settings for all subsequent fetch calls.

```ts
createClient<paths>(options);
```

| Name            |   Type   | Description                                                                                                                                                                                   |
| :-------------- | :------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`       | `string` | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`).                                                                                                                      |
| `fetch`         | `fetch`  | Fetch function used for requests (defaults to `globalThis.fetch`)                                                                                                                             |
| (Fetch options) |          | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>) |

## Fetch options

```ts
import { paths } from "./v1";

const { get, put, post, del, options, head, patch, trace } = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const { data, error, response } = await get("/my-url", options);
```

| Name              |                               Type                                | Description                                                                                                                                                                                                                      |
| :---------------- | :---------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          |                           ParamsObject                            | Provide `path` and `query` params from the OpenAPI schema                                                                                                                                                                        |
| `params.path`     |                        `{ [name]: value }`                        | Provide all `path` params (params that are part of the URL)                                                                                                                                                                      |
| `params.query`    |                        `{ [name]: value }`                        | Provide all `query params (params that are part of the <a href="https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams" target="_blank" rel="noopener noreferrer">searchParams</a>                                    |
| `body`            |                        `{ [name]:value }`                         | The <a href="https://spec.openapis.org/oas/latest.html#request-body-object" target="_blank" rel="noopener noreferrer">requestBody</a> data, if needed (PUT/POST/PATCH/DEL only)                                                  |
| `querySerializer` |                          QuerySerializer                          | (optional) Override default param serialization (see [Parameter Serialization](#parameter-serialization))                                                                                                                        |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | Decide how to parse the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Response/body" target="_blank" rel="noopener noreferrer">response body</a>, with `"stream"` skipping processing altogether (default: `"json"`) |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>)                                    |

### Parameter Serialization

In the spirit of being lightweight, this library only uses <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams" target="_blank" rel="noopener noreferrer">URLSearchParams</a> to <a href="https://swagger.io/docs/specification/serialization/" target="_blank" rel="noopener noreferrer">serialize parameters</a>. So for complex query param types (e.g. arrays) you’ll need to provide your own `querySerializer()` method that transforms query params into a URL-safe string:

```ts
import createClient from "openapi-fetch";
import { paths } from "./v1"; // generated from openapi-typescript

const { get, post } = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const { data, error } = await get("/post/{post_id}", {
  params: {
    path: { post_id: "my-post" },
    query: { version: 2 },
  },
  querySerializer: (q) => `v=${q.version}`, // ✅ Still typechecked based on the URL!
});
```

Note that this happens **at the request level** so that you still get correct type inference for that URL’s specific query params.

_Thanks, [@ezpuzz](https://github.com/ezpuzz)!_
