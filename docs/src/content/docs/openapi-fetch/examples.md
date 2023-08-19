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
  }),
);

// src/some-other-file.ts
import { client } from "./lib/api";

const { GET, POST } = client.get();

GET("/some-authenticated-url", {
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

client.GET("/some-authenticated-url", {
  /* … */
});
```

## Frameworks

openapi-fetch is simple vanilla JS that can be used in any project. But sometimes the implementation in a framework may come with some prior art that helps you get the most out of your usage.

### React + React Query

[React Query](https://tanstack.com/query/latest) is a perfect wrapper for openapi-fetch in React. At only 13 kB, it provides clientside caching and request deduping across async React components without too much client weight in return. And its type inference preserves openapi-fetch types perfectly with minimal setup.

[View a code example in GitHub](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch/examples/react-query)

### React + SWR

TODO

### SvelteKit

TODO

### Vue

TODO
