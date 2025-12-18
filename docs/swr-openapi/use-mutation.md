---
title: useMutation
---

# {{ $frontmatter.title }}

`useMutation` is a wrapper around SWR's [useSWRMutation][swr-use-mutation] function. It provides a type-safe hook for remote mutations.

```tsx
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // generated types

const client = createClient<paths>({ baseUrl: "https://my-api.com" });
const useMutation = createMutationHook(client, "my-api");

function MyComponent() {
  const { trigger, data, isMutating } = useMutation("/users", "post");

  return (
    <button
      disabled={isMutating}
      onClick={() => {
        trigger({ body: { name: "New User" } });
      }}
    >
      Create User
    </button>
  );
}
```

## API

### Parameters

- `key`:
  - `path`: Any endpoint that supports `GET` requests.
  - `init`: (_optional_) Partial fetch options for the chosen endpoint.
- `method`: HTTP method for the chosen endpoint.
- `options`: (_optional_) [SWR mutate options][swr-use-mutation-params].

### Returns

- Return of a [useSWRMutation][swr-mutation-response] including:

`data`: data for the given key returned from fetcher
`error`: error thrown by fetcher (or undefined)
`trigger(arg, options)`: a function to trigger a remote mutation
`reset`: a function to reset the state (data, error, isMutating)
`isMutating`: if there's an ongoing remote mutation

## How It Works

```ts
function useMutation(
  path,
  method,
  config,
) {
  const key = [prefix, path, method];

  return useSWRMutation(
    key,
    async (_key, { arg }) => {
      const m = method.toUpperCase();

      const res = await client[m](path, arg);
      if (res.error) {
        throw res.error;
      }
      return res.data;
    },
    config,
  );
};

```

[swr-mutate-params]: https://swr.vercel.app/docs/mutation#parameters
[swr-use-mutation]: https://swr.vercel.app/docs/mutation#useswrmutation
[swr-use-mutation-params]: https://swr.vercel.app/docs/mutation#useswrmutation-parameters
[swr-mutation-response]: https://swr.vercel.app/docs/mutation#useswrmutation-return-values
