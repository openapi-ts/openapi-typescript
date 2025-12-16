---
"openapi-typescript": minor
"openapi-typescript-helpers": minor
"openapi-fetch": minor
---

Add readOnly/writeOnly support via `--read-write-markers` flag. When enabled, readOnly properties are wrapped with `$Read<T>` and writeOnly properties with `$Write<T>`. openapi-fetch uses `Readable<T>` and `Writable<T>` helpers to exclude these properties from responses and request bodies respectively.
