---
"openapi-typescript": patch
"openapi-typescript-helpers": patch
---

Add TypeScript 6 support.

- `openapi-typescript`: widen the `typescript` peer dependency to `^5.x || ^6.x`.
- `openapi-typescript-helpers`: fix `Readable<T>` and `Writable<T>` so callable types (`Date`, `RegExp`, functions, and class instance methods) are preserved through the recursive mapped type. Without this, the mapped type recursed into method signatures and collapsed them to `{}` under `--strict`, breaking patterns like `Readable<{ createdAt: Date }>.createdAt.toISOString()`. Reproduces on both TS 5 and TS 6.
