---
"openapi-typescript-helpers": patch
---

Fix `Readable` and `Writable` widening tuple types (e.g. `[number, number]`) to arrays; tuples and readonly arrays are now preserved.
