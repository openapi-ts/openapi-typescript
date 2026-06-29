---
"openapi-typescript": patch
---

Keep multi-line `x-enum-descriptions` on a single comment line. A description containing a line break previously ended the `//` comment early and pushed the remaining text onto its own line as code, producing an invalid `enum` (only relevant with the `enum` option).
