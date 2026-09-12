# openapi-typescript-helpers

Helper utilities that power `openapi-fetch` but are generically-available for any project.

This package isn’t as well-documented as the others, so it’s a bit “use at your own discretion.”

`Readable<T>` resolves `$Read<T>` markers and excludes `$Write<T>` properties for responses. `Writable<T>` resolves `$Write<T>` markers and excludes `$Read<T>` properties for requests. Both recurse through objects and arrays, including recursive JSON types. Array methods and iteration expose resolved elements, and array mutability is preserved.

Existing tuple handling is retained: mutable tuples resolve to arrays of their element union; readonly tuples retain fixed positional properties and length, not full tuple bounds or rest-position constraints. Readonly collections also retain and resolve additional data properties. Excluded array elements resolve to `never`, including in readonly collections.

Callable types remain unchanged, including their call signatures, arguments, return types, and attached properties. Visibility markers inside those types are intentionally left intact. Object types such as `Date` and `RegExp` are traversed, preserving their callable methods while resolving markers on other properties.
