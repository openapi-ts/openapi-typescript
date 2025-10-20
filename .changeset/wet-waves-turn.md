---
"openapi-fetch": patch
---

Use text() when no content-length is provided to avoid errors parsing empty bodies (200 with no content)
