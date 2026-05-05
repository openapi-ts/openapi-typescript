---
"openapi-react-query": minor
---

Add `queryKeyFn` option to `createClient` for per-client query key namespacing.

When two `openapi-fetch` clients target different servers but share endpoint paths,
TanStack Query deduplicates their requests because the default `[method, path, init]`
key is identical. Passing a `queryKeyFn` lets callers namespace keys per client
instance so each client maintains an independent cache.
