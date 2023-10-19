---
"openapi-fetch": minor
---

⚠️ **Breaking**: change default querySerializer behavior to produce `style: form`, `explode: true` query params [according to the OpenAPI specification]((https://swagger.io/docs/specification/serialization/#query). Also adds support for `deepObject`s (square bracket style).
