---
title: openapi-fetch Examples
---

# Examples

## Authentication

Authentication often requires some reactivity dependent on a token. Since this library is so low-level, there are myriad ways to handle it:

### Nano Stores

Here’s how it can be handled using [Nano Stores](https://github.com/nanostores/nanostores), a tiny (334 b), universal signals store:

```ts
// src/lib/api/index.ts
import { atom, computed } from "nanostores";
import createClient from "openapi-fetch";
import type { paths } from "./api/v1";

export const authToken = atom<string | undefined>();
someAuthMethod().then((newToken) => authToken.set(newToken));

export const client = computed(authToken, (currentToken) =>
  createClient<paths>({
    headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
    baseUrl: "https://myapi.dev/v1/",
  }),
);
```

```ts
// src/some-other-file.ts
import { client } from "./lib/api";

const { GET, POST } = client.get();

GET("/some-authenticated-url", {
  /* … */
});
```

### Vanilla JS Proxies

You can also use [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which are now supported in all modern browsers:

```ts
// src/lib/api/index.ts
import createClient from "openapi-fetch";
import type { paths } from "./api/v1";

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
```

```ts
// src/some-other-file.ts
import client from "./lib/api";

client.GET("/some-authenticated-url", {
  /* … */
});
```

### Vanilla JS getter

You can also use a [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get):

```ts
// src/lib/api/index.ts
import createClient from "openapi-fetch";
import type { paths } from "./api/v1";

let authToken: string | undefined = undefined;
someAuthMethod().then((newToken) => (authToken = newToken));

export default createClient<paths>({
  baseUrl: "https://myapi.dev/v1/",
  headers: {
    get Authorization() {
      return authToken ? `Bearer ${authToken}` : undefined;
    },
  },
});
```

```ts
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

### Next.js

[Next.js](https://nextjs.org/) is the most popular SSR framework for React. While [React Query](#react--react-query) is recommended for all clientside fetching with openapi-fetch (not SWR), this example shows how to take advantage of Next.js’s [server-side fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch) with built-in caching.

[View a code example in GitHub](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch/examples/nextjs)

### Svelte / SvelteKit

[SvelteKit](https://kit.svelte.dev)’s automatic type inference can easily pick up openapi-fetch’s types in both clientside fetching and [Page Data](https://kit.svelte.dev/docs/load#page-data) fetching. And it doesn’t need any additional libraries to work. SvelteKit also advises to use their [custom fetch](https://kit.svelte.dev/docs/load#making-fetch-requests) in load functions. This can be achieved with [fetch options](/openapi-fetch/api#fetch-options).

_Note: if you’re using Svelte without SvelteKit, the root example in `src/routes/+page.svelte` doesn’t use any SvelteKit features and is generally-applicable to any setup._

[View a code example in GitHub](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch/examples/sveltekit)

### Vue

TODO
