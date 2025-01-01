---
title: useMutate
---

# {{ $frontmatter.title }}

`useMutate` is a wrapper around SWR's [global mutate][swr-global-mutate] function. It provides a type-safe mechanism for updating and revalidating SWR's client-side cache for specific endpoints.

Like global mutate, this mutate wrapper accepts three parameters: `key`, `data`, and `options`. The latter two parameters are identical to those in _bound mutate_. `key` can be either a path alone, or a path with fetch options.

The level of specificity used when defining the key will determine which cached requests are updated. If only a path is provided, any cached request using that path will be updated. If fetch options are included in the key, the [`compare`](./hook-builders.md#compare) function will determine if a cached request's fetch options match the key's fetch options.

```ts
const mutate = useMutate();

await mutate([path, init], data, options);
```

## API

### Parameters

- `key`:
  - `path`: Any endpoint that supports `GET` requests.
  - `init`: (_optional_) Partial fetch options for the chosen endpoint.
- `data`: (_optional_)
  - Data to update the client cache.
  - An async function for a remote mutation.
- `options`: (_optional_) [SWR mutate options][swr-mutate-params].

### Returns

- A promise containing an array, where each array item is either updated data for a matched key or `undefined`.

> SWR's `mutate` signature specifies that when a matcher function is used, the return type will be [an array](https://github.com/vercel/swr/blob/1585a3e37d90ad0df8097b099db38f1afb43c95d/src/_internal/types.ts#L426). Since our wrapper uses a key matcher function, it will always return an array type.


## How It Works

```ts
function useMutate() {
  const { mutate } = useSWRConfig();
  return useCallback(
    ([path, init], data, opts) => {
      return mutate(
        (key) => {
          if (!Array.isArray(key) || ![2, 3].includes(key.length)) {
            return false;
          }
          const [keyPrefix, keyPath, keyOptions] = key;
          return (
            keyPrefix === prefix &&
            keyPath === path &&
            (init ? compare(keyOptions, init) : true)
          );
        },
        data,
        opts,
      );
    },
    [mutate, prefix, compare],
  );
}
```

[swr-global-mutate]: https://swr.vercel.app/docs/mutation#global-mutate
[swr-mutate-params]: https://swr.vercel.app/docs/mutation#parameters
