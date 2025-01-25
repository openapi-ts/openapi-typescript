---
title: useQuery
---

# {{ $frontmatter.title }}

This hook is a typed wrapper over [`useSWR`][swr-api].

```ts
import createClient from "openapi-fetch";
import { createQueryHook } from "swr-openapi";
import type { paths } from "./my-schema";

const client = createClient<paths>(/* ... */);

const useQuery = createQueryHook(client, "my-api");

const { data, error, isLoading, isValidating, mutate } = useQuery(
  path,
  init,
  config,
);
```

## API

### Parameters

- `path`: Any endpoint that supports `GET` requests.
- `init`: (_sometimes optional_)
  - [Fetch options][oai-fetch-options] for the chosen endpoint.
  - `null` to skip the request (see [SWR Conditional Fetching][swr-conditional-fetching]).
- `config`: (_optional_) [SWR options][swr-options].



### Returns

- An [SWR response][swr-response].

## How It Works

`useQuery` is a very thin wrapper over [`useSWR`][swr-api]. Most of the code involves TypeScript generics that are transpiled away.

The prefix supplied in `createQueryHook` is joined with `path` and `init` to form the key passed to SWR.

> `prefix` is only used to help ensure uniqueness for SWR's cache, in the case that two or more API clients share an identical path (e.g. `/api/health`). It is not included in actual `GET` requests.

Then, `GET` is invoked with `path` and `init`. Short and sweet.

```ts
function useQuery(path, ...[init, config]) {
  return useSWR(
    init !== null ? [prefix, path, init] : null,
    async ([_prefix, path, init]) => {
      const res = await client.GET(path, init);
      if (res.error) {
        throw res.error;
      }
      return res.data;
    },
    config,
  );
}
```


[oai-fetch-options]: https://openapi-ts.pages.dev/openapi-fetch/api#fetch-options
[swr-options]: https://swr.vercel.app/docs/api#options
[swr-conditional-fetching]: https://swr.vercel.app/docs/conditional-fetching#conditional
[swr-response]: https://swr.vercel.app/docs/api#return-values
[swr-api]: https://swr.vercel.app/docs/api
