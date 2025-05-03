---
title: useImmutable
---

# {{ $frontmatter.title }}

This hook has the same contracts as [`useQuery`](./use-query.md). However, instead of wrapping [`useSWR`][swr-api], it wraps `useSWRImmutable`. This immutable hook [disables automatic revalidations][swr-disable-auto-revalidate] but is otherwise identical to `useSWR`.

```ts
import createClient from "openapi-fetch";
import { createImmutableHook } from "swr-openapi";
import type { paths } from "./my-schema";

const useImmutable = createImmutableHook(client, "my-api");

const { data, error, isLoading, isValidating, mutate } = useImmutable(
  path,
  init,
  config,
);
```

## API

### Parameters

Identical to `useQuery` [parameters](./use-query.md#parameters).

### Returns

Identical to `useQuery` [returns](./use-query.md#returns).


[swr-disable-auto-revalidate]: https://swr.vercel.app/docs/revalidation.en-US#disable-automatic-revalidations
[swr-api]: https://swr.vercel.app/docs/api
