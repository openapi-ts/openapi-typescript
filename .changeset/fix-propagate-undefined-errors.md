---
"openapi-react-query": patch
---

fix(openapi-react-query): propagate undefined errors from openapi-fetch

Use `!response.ok` instead of `error` truthiness check to properly handle cases where openapi-fetch returns `error: undefined` for non-OK responses with empty bodies.
