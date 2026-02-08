---
"openapi-typescript": patch
---

Fix `enumValues: true` output for schemas that use `oneOf`/`anyOf` unions by narrowing union types with `Extract<>` before accessing variant-specific properties. This prevents invalid type paths when an accessed property only exists on some union members.
