---
"openapi-fetch": patch
---

Replace `instanceof Function` with `typeof === 'function'` to fix form-urlencoded body serialization in environments with separate JavaScript realms (e.g., Jest with experimental VM modules). Also fixes missing `headers` parameter in the type definition for `defaultBodySerializer`.
