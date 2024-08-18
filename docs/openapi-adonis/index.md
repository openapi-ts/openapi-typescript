---
title: openapi-adonis
---

# Introduction

openapi-adonis is an [Adonis.js] library to automatically generate OpenAPI schemas and documentation.

- ✅ Creates operations from the Adonis Router
- ✅ Automatically adds your models to the schemas
- ✅ Automatically adds your `@vinejs/vine` validators to the schemas
- ✅ Extended type-inference using Typescript metadata
- ✅ Extensible using Typescript decorators
- ✅ Generates documentation for **Swagger, Scalar, Rapidoc**

The library is inspired by the popular library [@nestjs/swagger](https://www.npmjs.com/package/@nestjs/swagger) and is built on top of [openapi-decorators](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-decorators).

::: code-group

```tsx [app/controllers/users_controller.ts]
import { apiOperation, apiResponse } from "openapi-adonis/decorators";
import User from "#models/user";

class UsersController {
  @apiOperation({ summary: "List users" })
  @apiResponse({ type: [User] })
  async list() {
    return User.findManyBy({});
  }
}
```

```tsx [app/models/user.ts]
import { apiProperty } from "openapi-adonis/decorators";

class User {
  @apiProperty()
  declare id: number;

  @apiProperty()
  declare name: string;

  @apiProperty({ required: false })
  declare mobile?: string;
}
```

```tsx [start/routes.ts]
import router from "@adonisjs/core/services/router";
import AdonisOpenAPI from "openapi-adonis";

const UsersController = () => import("#controllers/users_controller");

router.post("/users", [UsersController, "create"]);

const builder = AdonisOpenAPI.document().setTitle("OpenAPI Adonis Example");
AdonisOpenAPI.setup("/docs", router, builder);
```

:::

## Setup

Install this library by using `ace`:

```bash
node ace add openapi-adonis
```

## Basic usage
