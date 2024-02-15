---
"openapi-fetch": minor
---

⚠️ **Breaking change**: Responses are no longer automatically `.clone()`’d in certain instances. Be sure to `.clone()` yourself if you need to access the raw body!
