---
"openapi-react-query": patch
---

Fixed empty value check in queryFn and mutationFn: only throws error for undefined, other falsy values are allowed now
