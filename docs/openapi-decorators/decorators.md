---
title: Decorators
---

# Decorators

Decorators are used to enrich your OpenAPI specifications. They can be applied on a Controller, a Method or a Model. They are all prefixed with `api`.

> For more information about the decorators, you can directly refer to the [source code](https://github.com/openapi-ts/openapi-typescript/packages/openapi-decorators/src/decorators).

| Decorator | Usage | Description |
|-|-|-|
| `@apiProperty` | Model | Configures a schema property. |
| `@apiTags` | Controller / Method | Adds tags to the operation. When applied on a controller, the tags are applied to all of its operations. |
| `@apiOperation` | Method | Configures an operation. |
| `@apiQuery` | Method | Adds a query parameter to the operation. |
| `@apiParam` | Method | Adds a path parameter to the operation. |
| `@apiResponse` | Method | Adds a response to the operation. |
| `@apiBody` | Method | Sets the requestBody of the operation. |

