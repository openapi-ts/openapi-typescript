---
title: Decorators
---

# Decorators

Decorators are used to enrich your OpenAPI specifications. They can be applied on a Controller, a Method or a Model. They are all prefixed with `Api`.

> For more information about the decorators, you can directly refer to the [source code](https://github.com/openapi-ts/openapi-typescript/packages/openapi-metadata/src/decorators).

_You can hover the following code snippet to get information about each decorator._

```ts twoslash
// @noErrors
// ---cut---
import {
  ApiBody,
  ApiCookie,
  ApiExcludeController,
  ApiExcludeOperation,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiBasicAuth,
  ApiOauth2,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiTags
} from 'openapi-metadata/decorators'
// ---cut---
@ApiBody()
@ApiCookie()
@ApiExcludeController()
@ApiExcludeOperation()
@ApiExtraModels()
@ApiHeader()
@ApiOperation()
@ApiParam()
@ApiProperty()
@ApiPropertyOptional()
@ApiQuery()
@ApiResponse()
@ApiSecurity()
@ApiBasicAuth()
@ApiOAuth2()
@ApiBearerAuth()
@ApiCookieAuth()
@ApiTags()
```
