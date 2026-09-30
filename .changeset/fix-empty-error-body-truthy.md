---
"openapi-fetch": patch
---

Fix `error` being `undefined` when a server returns a 4xx/5xx status with no response body. Previously `if (error)` checks would silently pass even on error responses. The `error` field now contains the HTTP status text (e.g. `"Not Found"`) or status code string (e.g. `"500"`) when the body is empty, making `if (error)` reliable for all error responses.
