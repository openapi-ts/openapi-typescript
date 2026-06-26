---
"openapi-typescript": patch
---

Emit the generated `$defs` container as an optional property so schemas that declare `$defs` are no longer required to provide it when used as input types. `$refs` that index into `$defs` continue to resolve.
