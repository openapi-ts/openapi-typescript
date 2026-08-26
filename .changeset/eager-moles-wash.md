---
"openapi-typescript": patch
---

Fix redundant nested unions from a type array with a sibling `anyOf`/`allOf`, including when a `oneOf` sits alongside them.
