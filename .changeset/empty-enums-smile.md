---
"openapi-typescript": patch
---

Fix `--enum` output for schemas that include an empty string enum value by emitting a valid string-literal enum member name.
