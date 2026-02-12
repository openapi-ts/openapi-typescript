---
"openapi-typescript": patch
---

Support `additionalProperties: true` on string enums by generating a loose autocomplete union (`(enum literals) | (string & {})`), preserving editor suggestions while still accepting arbitrary string values.
