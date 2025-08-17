---
title: UI integrations
---

# UI integrations

`openapi-metadata` bring some utilities to easily display your API documentation.

## [Scalar](https://scalar.com)

```ts twoslash
import { generateScalarUI } from "openapi-metadata/ui";

generateScalarUI("http://localhost:3000/api", { theme: "purple" });
```

## [Swagger UI](https://swagger.io/tools/swagger-ui/)

```ts twoslash
import { generateSwaggerUI } from "openapi-metadata/ui";

generateSwaggerUI("http://localhost:3000/api");
```

## [Rapidoc](https://rapidocweb.com/)

```ts twoslash
import { generateRapidocUI } from "openapi-metadata/ui";

generateRapidocUI("http://localhost:3000/api");
```
