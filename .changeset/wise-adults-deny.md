---
"openapi-fetch": minor
---

Breaking: openapi-fetch now just takes the first media type it finds rather than preferring JSON. This is because in the case of `multipart/form-data` vs `application/json`, it’s not inherently clear which you’d want. Or if there were multiple JSON-like media types.
