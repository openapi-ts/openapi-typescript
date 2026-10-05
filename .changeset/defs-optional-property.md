---
"openapi-typescript": patch
---

Emit the generated `$defs` container as an optional property so schemas that declare `$defs` are no longer required to provide it when used as input types. `$ref`s that index into `$defs` are emitted through `NonNullable<...>` so the generated types still compile under `strictNullChecks`.
