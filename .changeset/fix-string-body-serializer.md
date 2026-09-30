---
"openapi-fetch": patch
---

Fix `defaultBodySerializer` double-encoding string bodies. Previously, passing a string as the request body (e.g. a pre-serialized JSON string) would result in it being wrapped in an extra layer of JSON quotes. Strings are now passed through as-is.
