---
title: "Getting started"
---

# Introduction

`openapi-metadata` is a framework agnostic library to automatically generate OpenAPI schemas and documentation by using Typescript decorators and metadata.

::: code-group

```ts [users_controller.ts] twoslash
// @noErrors
import { ApiOperation, ApiResponse } from "openapi-metadata/decorators";
import User from "./user";

class UsersController {
  @ApiOperation({
    methods: ["get"],
    path: "/users",
    summary: "List users"
  })
  @ApiResponse({ type: [User] })
  async list() {
    ...
  }
}
```

```ts [user.ts] twoslash
import { ApiProperty } from "openapi-metadata/decorators";

class User {
  @ApiProperty()
  declare id: number;

  @ApiProperty()
  declare name: string;

  @ApiProperty({ required: false })
  declare mobile?: string;
}
```

```ts [index.ts] twoslash
// @noErrors
import "reflect-metadata";
import { generateDocument } from "openapi-metadata";
import UsersController from "./users_controller";

const document = await generateDocument({
  controllers: [UsersController],
  document: {
    info: {
      title: "My Api",
      version: "1.0.0",
    },
  },
});

console.log(document); // <- Your generated OpenAPI specifications
```

:::

- ✅ Fully compliant [OpenAPI V3](https://swagger.io/specification/)
- ✅ Automatic type inference
- ✅ Supports [Scalar](https://scalar.com/), [Swagger UI](https://swagger.io/tools/swagger-ui/) and [Rapidoc](https://rapidocweb.com/)
- ✅ Extensible with custom type loaders
- ✅ Ready to be integrated with your favorite framework

## Getting started

### Setup

Install `openapi-metadata` and `reflect-metadata` using your favorite package manager.

```bash
npm install openapi-metadata reflect-metadata
```

Import `reflect-metadata` in your main file.

::: code-group

```ts [index.ts]
import "reflect-metadata";

// Rest of your app
```

:::

Enable `experimentalDecorators` and `experimentalDecorators`.

::: code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

:::

### Create your OpenAPI document

To get started, you can use the `generateDocument` function to create an (almost) empty documentation. You can define a base document that will be merged with the generated one.

::: code-group

```ts [index.ts] twoslash
import "reflect-metadata";
import { generateDocument } from "openapi-metadata";

const document = await generateDocument({
  controllers: [],
  document: {
    info: {
      title: "My API",
      version: "1.0.0",
    },
  },
});

console.log(document); // <- Your generated OpenAPI specifications
```

:::

### Create your first controller

A controller is a simple class where each methods could be an Operation.
In the following example we have a `UsersController` which declares an operation `GET /users` that returns a list of `Users`.

::: code-group

```ts [controllers/users_controller.ts] twoslash
// @noErrors
import { ApiOperation, ApiResponse } from "openapi-metadata/decorators";
import User from "../schemas/user";

export default class UsersController {
  @ApiOperation({
    methods: ["get"],
    path: "/users",
    summary: "List users",
  })
  @ApiResponse({ type: [User] })
  async list() {
    // ...your logic
  }
}
```

:::

### Create your first schema

In our controller we define the response of your operation to be `[User]` (a list of users). We now need to create this model.

By using the `@ApiProperty` decorator on class we can define the properties of our schema.

> Unlike other libraries like `@nestjs/swagger`, every element of your OpenAPI schema is lazy-loaded. Your models will only be part of your documentation if it is used.

::: code-group

```ts [schemas/user.ts] twoslash
import { ApiProperty } from "openapi-metadata/decorators";

export default class User {
  @ApiProperty()
  declare id: string;

  @ApiProperty({ example: "John Doe" })
  declare name: string;

  @ApiProperty()
  declare email: string;

  @ApiProperty({ required: false })
  declare mobile?: string;
}
```

:::

### Register your controller

Now that we have our controller ready, we can include it when generating our document.

::: code-group

```ts [index.ts] twoslash
// @noErrors
import "reflect-metadata";
import { generateDocument } from "openapi-metadata";
import UsersController from "./controllers/users_controller.ts";

const document = await generateDocument({
  controllers: [UsersController],
  document: {
    info: {
      name: "My API",
      version: "1.0.0",
    },
  },
});

console.log(document); // <- Your generated OpenAPI specifications
```

:::
