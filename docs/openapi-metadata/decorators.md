---
title: Decorators
---

# Decorators

Decorators are used to enrich your OpenAPI specifications. They can be applied on a Controller, a Method or a Model. They are all prefixed with `Api`.

> For more information about the decorators, you can directly refer to the [source code](https://github.com/openapi-ts/openapi-typescript/packages/openapi-metadata/src/decorators).

| Decorator               | Usage               | Description                                                              |
| ----------------------- | ------------------- | ------------------------------------------------------------------------ |
| `@ApiBody`              | Method              | Sets the requestBody of the operation.                                   |
| `@ApiCookie`            | Controller / Method | Adds a cookie parameter to the operation(s).                             |
| `@ApiExcludeController` | Method              | Excludes the operations of this controller from the document generation. |
| `@ApiExcludeOperation`  | Method              | Excludes this operation from the document generation.                    |
| `@ApiExtraModels`       | Controller          | Adds extra models to be loaded in the schema.                            |
| `@ApiHeader`            | Controller / Method | Adds a header parameter to the operation(s).                             |
| `@ApiOperation`         | Method              | Configures an operation.                                                 |
| `@ApiParam`             | Controller / Method | Adds a path parameter to the operation(s).                               |
| `@ApiProperty`          | Model               | Configures a schema property property.                                   |
| `@ApiQuery`             | Controller / Method | Adds a query parameter to the operation(s).                              |
| `@ApiResponse`          | Controller / Method | Adds a response to the operation(s).                                     |
| `@ApiSecurity`          | Controller / Method | Sets the security scheme to the operation(s).                            |
| `@ApiTags`              | Controller / Method | Adds tags to the operation(s).                                           |
