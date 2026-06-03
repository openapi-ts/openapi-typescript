---
"openapi-react-query": patch
---

Tag generated querykeys with `DataTag`, allowing us to infer the return type (data/error) associated with a given queryKey, making methods like `queryClient.setQueryData()` type-safe.
