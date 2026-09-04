---
"openapi-typescript": patch
---

Fix `allOf` composition to apply required properties from `$ref`-resolved subschemas and omit empty members that produced meaningless `& unknown` intersections.
