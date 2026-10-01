---
"openapi-typescript": patch
---

Fix crash (`URIError: URI malformed`) when a schema has a property name containing a literal percent sign (e.g. `"25%"`) that resolves to an object. JSON Pointer segments are now parsed resiliently, falling back to the raw segment when `decodeURIComponent` fails instead of throwing.
