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

client.GET("/my/endpoint", {
  /* … */
});
```

Beyond this, you’re better off using a prebuilt fetch wrapper in whatever JS library you’re consuming:

- **React**: [React Query](#react-query)
- **Svelte**: (suggestions welcome — please file an issue!)
- **Vue**: (suggestions welcome — please file an issue!)
- **Vanilla JS**: (see below)

#### Further Reading

- <a href="https://developer.mozilla.org/en-US/docs/Web/API/Request/cache" target="_blank">HTTP cache options</a>

### Vanilla JS (idempotent)

For idempotent data fetching (not having to wrestle with promises—great for UI applications), [Nano Stores](https://github.com/nanostores/nanostores) is a great pair with `openapi-fetch`. This general strategy could also be used in simple UI applications or Web Components:

```ts
import createClient, { Success, Error } from "openapi-fetch";
import { map } from "nanostores";
import { components, paths } from "./my-schema";

/**
 * Shared query
 */

type DataLoader<T> = { loading: true; data?: never; error?: never } | { loading: false; data: Success<T>; error?: never } | { loading: false; data?: never; error: Error<t> };

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const GET_USER = "/users/{user_id}";

$userCache = atom<Record<string, DataLoader<Success[paths[typeof GET_USER]["get"]]>>>({});
$userErrorCache = atom<Record<string, DataLoader<Error[paths[typeof GET_USER]["get"]]>>>({});

function getUser(userId: string): DataLoader<paths[typeof GET_USER]["get"]> {
  // if last response was successful, return that
  if ($userCache.get()[userId]) {
    return { loading: false, data: $userCache.get()[userId] };
  }
  // otherwise if last response erred, return that
  else if ($userErrorCache.get()[userId]) {
    return { loading: false, error: $userErrorCache.get()[userId] };
  }
  // otherwise, return `loading: true` and fetch in the background (and update stores, alerting all listeners)
  else {
    client.get(GET_USER, { params: { path: { user_id: userId } } }).then(({ data, error }) => {
      if (data) {
        $userCache.set({ ...$userCache.get(), [userId]: data });
      } else {
        $userErrorCache.set({ ...$userErrorCache.get(), [userId]: error });
      }
    });
    return { loading: true };
  }
}

/**
 * Usage example
 */

// Loading
console.log(getUser("user-123")); // { loading: true }
// Success
console.log(getUser("user-123")); // { loading: false, data: { … } }
// Error
console.log(getUser("user-123")); // { loading: false, error: { … } }
```

Keep in mind, though, that reactivity is difficult! You’ll have to account for stale data in the context of your application (if using a JS framework, there are already existing libraries that can handle this for you). Further, this is a contrived example that doesn’t handle invalidating the cache—both data and errors. Cache invalidation will be dependent on your specific needs.

If you need to work with promises, then just using `openapi-fetch` as-is will usually suffice. If you need promises + caching, then you’ll have to come up with a solution that fits your own custom usecase.

## React Query

[React Query](https://tanstack.com/query/latest) is a perfect wrapper for openapi-fetch in React. At only 13 kB, it provides clientside caching and request deduping across async React components without too much client weight in return. And its type inference preserves openapi-fetch types perfectly with minimal setup. Here’s one example of how you could create your own [React Hook](https://react.dev/learn/reusing-logic-with-custom-hooks) to reuse and cache the same request across multiple components:

```tsx
import { useQuery } from "@tanstack/react-query";
import createClient, { Params, RequestBody } from "openapi-fetch";
import React from "react";
import { paths } from "./my-schema";

/**
 * openapi-fetch wrapper
 * (this could go in a shared file)
 */

type UseQueryOptions<T> = Params<T> &
  RequestBody<T> & {
    // add your custom options here
    reactQuery: {
      enabled: boolean; // Note: React Query type’s inference is difficult to apply automatically, hence manual option passing here
      // add other React Query options as needed
    };
  };

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const GET_USER = "/users/{user_id}";

function useUser({ params, body, reactQuery }: UseQueryOptions<paths[typeof GET_USER]["get"]>) {
  return useQuery({
    ...reactQuery,
    queryKey: [
      GET_USER,
      params.path.user_id,
      // add any other hook dependencies here
    ],
    queryFn: async ({ signal }) => {
      const { data, error } = await client.GET(GET_USER, {
        params,
        // body - isn’t used for GET, but needed for other request types
        signal, // allows React Query to cancel request
      });
      if (res.data) return res.data;
      throw new Error(res.error.message); // React Query expects errors to be thrown to show a message
    },
  });
}

/**
 * MyComponent example usage
 */

interface MyComponentProps {
  user_id: string;
}

function MyComponent({ user_id }: MyComponentProps) {
  const user = useUser({ params: { path: { user_id } } });

  return <span>{user.data?.name}</span>;
}
```

Some important callouts:

- `UseQueryOptions<T>` is a bit technical, but it’s what passes through the `params` and `body` options to React Query for the endpoint used. It’s how in `<MyComponent />` you can provide `params.path.user_id` despite us not having manually typed that anywhere (after all, it’s in the OpenAPI schema—why would we need to type it again if we don’t have to?).
- Saving the pathname as `GET_USER` is an important concept. That lets us use the same value to:
  1. Query the API
  2. Infer types from the OpenAPI schema’s [Paths Object](https://spec.openapis.org/oas/latest.html#paths-object)
  3. Cache in React Query (using the pathname as a cache key)
- Note that `useUser()` types its parameters as `UseQueryOptions<paths[typeof GET_USER]["get"]>`. The type `paths[typeof GET_USER]["get"]`:
  1. Starts from the OpenAPI `paths` object,
  2. finds the `GET_USER` pathname,
  3. and finds the `"get"` request off that path (remember every pathname can have multiple methods)
- To create another hook, you’d replace `typeof GET_USER` with another URL, and `"get"` with the method you’re using.
- Lastly, `queryKey` in React Query is what creates the cache key for that request (same as hook dependencies). In our example, we want to key off of two things—the pathname and the `params.path.user_id` param. This, sadly, does require some manual typing, but it’s so you can have granular control over when refetches happen (or don’t) for this request.

### Further optimization

Setting the default [network mode](https://tanstack.com/query/latest/docs/react/guides/network-mode) and [window focus refreshing](https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching) options could be useful if you find React Query making too many requests:

```tsx
import { QueryClient } from '@tanstack/react-query';

const reactQueryClient = new QueryClient({
  defaultOptions: {
  queries: {
    networkMode: "offlineFirst", // keep caches as long as possible
    refetchOnWindowFocus: false, // don’t refetch on window focus
  },
});
```

Experiment with the options to improve what works best for your setup.
