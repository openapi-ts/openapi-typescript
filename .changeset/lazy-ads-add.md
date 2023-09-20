---
"openapi-typescript": major
---

⚠️ **Breaking**: No more `external` export in schemas anymore. Everything gets flattened into the `components` object instead (if referencing a schema object from a remote partial, note it may have had a minor name change to avoid conflict).
