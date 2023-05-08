---
title: Examples
description: openapi-fetch practical examples
---

## Authentication

Authentication often requires some reactivity dependent on a token. Since this library is so low-level, there are myriad ways to handle it:

### Nano Stores

Here’s how it can be handled using <a href="https://github.com/nanostores/nanostores" target="_blank" rel="noopener noreferrer">nanostores</a>, a tiny (334 b), universal signals store:

```ts
// src/lib/api/index.ts
import { atom, computed } from "nanostores";
import createClient from "openapi-fetch";
import { paths } from "./v1";

export const authToken = atom<string | undefined>();
someAuthMethod().then((newToken) => authToken.set(newToken));

export const client = computed(authToken, (currentToken) =>
  createClient<paths>({
    headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
    baseUrl: "https://myapi.dev/v1/",
  })
);

// src/some-other-file.ts
import { client } from "./lib/api";

const { get, post } = client.get();

get("/some-authenticated-url", {
  /* … */
});
```

### Vanilla JS Proxies

You can also use <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy" target="_blank" rel="noopener noreferrer">proxies</a> which are now supported in all modern browsers:

```ts
// src/lib/api/index.ts
import createClient from "openapi-fetch";
import { paths } from "./v1";

let authToken: string | undefined = undefined;
someAuthMethod().then((newToken) => (authToken = newToken));

const baseClient = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });
export default new Proxy(baseClient, {
  get(_, key: keyof typeof baseClient) {
    const newClient = createClient<paths>({
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      baseUrl: "https://myapi.dev/v1/",
    });
    return newClient[key];
  },
});

// src/some-other-file.ts
import client from "./lib/api";

client.get("/some-authenticated-url", {
  /* … */
});
```

## Caching

openapi-fetch doesn’t provide any caching utilities (it’s 1 kb, remember?). But this library is so lightweight, caching can be added easily.

### Built-in Fetch caching

Out-of-the box, most browsers do a darn good job of caching Fetch requests, especially when caching is configured properly on the API end (the appropriate <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control" target="_blank">Cache-Control</a> headers are served):

```ts
// src/lib/api/index.ts
import createClient from "openapi-fetch";
import { paths } from "./v1";

export default createClient({
  baseUrl: "https://myapi.dev/v1",
  cache: "default", // (recommended)
});

// src/some-other-file.ts
import client from "./lib/api";

client.get("/my/endpoint", {
  /* … */
});
```

<a href="https://developer.mozilla.org/en-US/docs/Web/API/Request/cache" target="_blank">Learn more about cache options</a>

### Custom cache wrapper

> ⚠️ You probably shouldn’t use this, relying instead on [built-in Fetch caching behavior](#built-in-fetch-caching)

Say for some special reason you needed to add custom caching behavior on top of openapi-fetch. Here is an example of how to do that using <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy" target="_blank" rel="noopener noreferrer">proxies</a> in conjunction with the <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control" target="_blank" rel="noopener noreferrer">Cache-Control</a> header (the latter is only for the purpose of example, and should be replaced with your caching strategy).

```ts
// src/lib/api/index.ts
import createClient from "openapi-fetch";
import { paths } from "./v1";

const MAX_AGE_RE = /max-age=([^,]+)/;

const expiryCache = new Map<string, number>();
const resultCache = new Map<string, any>();
const baseClient = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

function parseMaxAge(cc: string | null): number {
  // if no Cache-Control header, or if "no-store" or "no-cache" present, skip cache
  if (!cc || cc.includes("no-")) return 0;
  const maxAge = cc.match(MAX_AGE_RE);
  // if "max-age" missing, skip cache
  if (!maxAge || !maxAge[1]) return 0;
  return Date.now() + parseInt(maxAge[1]) * 1000;
}

export default new Proxy(baseClient, {
  get(_, key: keyof typeof baseClient) {
    const [url, init] = arguments;
    const expiry = expiryCache.get(url);

    // cache expired: update
    if (!expiry || expiry <= Date.now()) {
      const result = await baseClient[key](url, init);
      const nextExpiry = parseMaxAge(result.response.headers.get("Cache-Control"));
      // erase cache on error, or skipped cache
      if (result.error || nextExpiry <= Date.now()) {
        expiryCache.delete(url);
        resultCache.delete(url);
      }
      // update cache on success and response is cacheable
      else if (result.data) {
        resultCache.set(url, result);
        if (nextExpiry) expiryCache.set(url, nextExpiry);
      }
      return result;
    }

    // otherwise, serve cache
    return resultCache.get(url);
  },
});

// src/some-other-file.ts
import client from "./lib/api";

client.get("/my/endpoint", {
  /* … */
});
```
