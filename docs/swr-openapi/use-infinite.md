---
title: useInfinite
---

# {{ $frontmatter.title }}

This hook is a typed wrapper over [`useSWRInfinite`][swr-infinite].

```ts
import createClient from "openapi-fetch";
import { createInfiniteHook } from "swr-openapi";
import type { paths } from "./my-schema";

const client = createClient<paths>(/* ... */);

const useInfinite = createInfiniteHook(client, "my-api");

const {
  data,
  error,
  isLoading,
  isValidating,
  mutate,
  size,
  setSize
} = useInfinite(path, getInit, config);
```

## API

### Parameters

- `path`: Any endpoint that supports `GET` requests.
- [`getInit`](#getinit): A function that returns the fetch options for a given page.
- `config`: (_optional_) [SWR infinite options][swr-infinite-options].

### Returns

- An [SWR infinite response][swr-infinite-return].

## `getInit`

This function is similar to the [`getKey`][swr-infinite-options] parameter accepted by `useSWRInfinite`, with some slight alterations to take advantage of Open API types.

### Parameters

- `pageIndex`: The zero-based index of the current page to load.
- `previousPageData`:
  - `undefined` (if on the first page).
  - The fetched response for the last page retrieved.

### Returns

- [Fetch options][oai-fetch-options] for the next page to load.
- `null` if no more pages should be loaded.

## Examples

### Using limit and offset

```ts
useInfinite("/something", (pageIndex, previousPageData) => {
  // No more pages
  if (previousPageData && !previousPageData.hasMore) {
    return null;
  }

  // First page
  if (!previousPageData) {
    return {
      params: {
        query: {
          limit: 10,
        },
      },
    };
  }

  // Next page
  return {
    params: {
      query: {
        limit: 10,
        offset: 10 * pageIndex,
      },
    },
  };
});
```

### Using cursors

```ts
useInfinite("/something", (pageIndex, previousPageData) => {
  // No more pages
  if (previousPageData && !previousPageData.nextCursor) {
    return null;
  }

  // First page
  if (!previousPageData) {
    return {
      params: {
        query: {
          limit: 10,
        },
      },
    };
  }

  // Next page
  return {
    params: {
      query: {
        limit: 10,
        cursor: previousPageData.nextCursor,
      },
    },
  };
});
```

## How It Works

Just as [`useQuery`](./use-query.md) is a thin wrapper over [`useSWR`][swr-api], `useInfinite` is a thin wrapper over [`useSWRInfinite`][swr-infinite].

Instead of using static [fetch options][oai-fetch-options] as part of the SWR key, `useInfinite` is given a function ([`getInit`](#getinit)) that should dynamically determines the fetch options based on the current page index and the data from a previous page.

```ts
function useInfinite(path, getInit, config) {
  const fetcher = async ([_, path, init]) => {
    const res = await client.GET(path, init);
    if (res.error) {
      throw res.error;
    }
    return res.data;
  };
  const getKey = (index, previousPageData) => {
    const init = getInit(index, previousPageData);
    if (init === null) {
      return null;
    }
    const key = [prefix, path, init];
    return key;
  };
  return useSWRInfinite(getKey, fetcher, config);
}
```


[oai-fetch-options]: https://openapi-ts.pages.dev/openapi-fetch/api#fetch-options
[swr-api]: https://swr.vercel.app/docs/api
[swr-infinite]: https://swr.vercel.app/docs/pagination#useswrinfinite
[swr-infinite-return]: https://swr.vercel.app/docs/pagination#return-values
[swr-infinite-options]: https://swr.vercel.app/docs/pagination#parameters
