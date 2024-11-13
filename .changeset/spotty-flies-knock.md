---
"openapi-react-query": patch
---

- Fixed empty value check in queryFn: only throws error for undefined, other falsy values are allowed
- Fixed empty value check in mutationFn: allow falsy values
