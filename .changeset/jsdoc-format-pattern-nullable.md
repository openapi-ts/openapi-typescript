---
"openapi-typescript": minor
---

Add JSDoc `@format`, `@pattern`, and `@nullable` tags to generated types. Previously, `format` was output as plain text (`Format: date-time`), and `pattern`/`nullable` were not included in JSDoc at all. These are now proper JSDoc tags that downstream tools like ts-to-zod can parse for runtime validation.
