---
"openapi-typescript-helpers": patch
---

Support TypeScript 6 alongside TypeScript 5 and 7.

Fix `Readable<T>` and `Writable<T>` to preserve call signatures and methods on
objects such as `Date` and `RegExp`, while resolving visibility markers on
their other data properties. Callable arguments, return types, and attached
properties remain unchanged. These fixes also apply under TypeScript 5.

Resolve readonly-array methods and iteration through their element types while
preserving readonly indices, length, required numeric properties, and extra
data properties. Retain existing mutable-tuple behavior, support generics and
recursive arrays/tuples, and use the mutable-array `never` rule for excluded
readonly elements.
