---
"openapi-typescript-helpers": patch
"openapi-fetch": minor
"openapi-typescript": patch
---

Fix `Readable` and `Writable` types to correctly handle readonly arrays, and make marker resolution opt-in via `Markers` type parameter (default: `false`). This fixes issues where `Readable<readonly string[]>` would destructure the array into an object type (#2615), and where applying `Readable`/`Writable` unconditionally broke discriminated union narrowing (#2620).

### Breaking change for `--read-write-markers` users

`Readable`/`Writable` are no longer applied unconditionally to all responses and request bodies. If you use `--read-write-markers` with `openapi-fetch`, you now need to pass `true` as the third type parameter to opt in to marker resolution:

```ts
// Before (0.17.x): markers resolved automatically
const client = createClient<paths>();

// After: opt in explicitly
import type { MediaType } from "openapi-typescript-helpers";
//                          ↓ MediaType is required as a positional placeholder
const client = createClient<paths, MediaType, true>();
```

The second type parameter (`MediaType`) is the media type filter — it defaults to `MediaType` which accepts all content types. You must specify it explicitly to reach the third `Markers` parameter, since TypeScript does not support skipping positional type arguments.

Without `Markers = true`, `$Read`/`$Write` markers will be treated as raw wrapper types and not resolved. This is the intended default for users who do not use `--read-write-markers`.
