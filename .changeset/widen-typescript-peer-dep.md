---
"openapi-typescript": patch
"openapi-typescript-helpers": patch
---

feat: add TypeScript 6 support

- Widen peer dep to `^5.x || ^6.x`
- Fix `Readable<T>` and `Writable<T>` to preserve built-in objects (Date, RegExp, functions) that now match `extends object` in TS6
