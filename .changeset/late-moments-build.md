---
"openapi-fetch": minor
---

Added support for setting a custom path serializers either globally or per request. This allows you to customize how path parameters are serialized in the URL. E.g. you can use a custom serializer to prevent encoding of a path parameter, if you need to pass a value that should not be encoded.
