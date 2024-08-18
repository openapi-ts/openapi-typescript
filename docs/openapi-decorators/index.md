---
title: 'Getting started'
---

# Introduction

`openapi-decorators` is a framework agnostic library to automatically generate OpenAPI schemas and documentation by using Typescript decorators and metadata.

::: code-group

```ts [users_controller.ts]
import { apiOperation, apiResponse } from "openapi-adonis/decorators";
import User from "./user";

class UsersController {
  @apiOperation({ 
    method: "get", 
    pattern: "/users", 
    summary: "List users"
  })
  @apiResponse({ type: [User] })
  async list() {
    ...
  }
}
```

```ts [user.ts]
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

```ts [index.ts]
import "reflect-metadata";
import { DocumentBuilder } from "openapi-decorators/builders";
import { loadController } from "openapi-decorators/loaders";
import UsersController from "./users_controller";

const builder = new DocumentBuilder()
  .setTitle("My API")
  .setVersion("1.0.0");

await loadController(builder, UsersController);

console.log(document.build()); // <- Your generated OpenAPI specifications
```

:::

## Getting started

### Setup

Install `openapi-decorators` and `reflect-metadata` using your favorite package manager.

```bash
npm install openapi-decorators reflect-metadata
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
    "experimentalDecorators": true,
  }
}
```

:::

### Create your OpenAPI document

To get started, create a new DocumentBuilder. It will hold all the informations required to generate your OpenAPI specifications.
By using the method `build()` you can already have an (almost) empty documentation.

::: code-group

```ts [index.ts]
import "reflect-metadata";
import { DocumentBuilder } from "openapi-decorators/builders";

const builder = new DocumentBuilder()
  .setTitle("My API")
  .setVersion("1.0.0");

console.log(document.build()); // <- Your generated OpenAPI specifications
```

:::

### Create your first model

Using the `apiProperty` decorator on class properties will allow your operations to use the class as a schema.

> Unlike other libraries like `@nestjs/swagger`, every element of your OpenAPI schema is lazy-loaded. Your models will only be part of your documentation if it is used.

::: code-group

```ts [user.ts]
import { apiProperty } from "openapi-decorators/decorators";

class User {
  @apiProperty()
  declare id: string;

  @apiProperty({ example: "John Doe" })
  declare name: string;

  @apiProperty()
  declare email: string;

  @apiProperty({ required: false })
  declare mobile?: string;
}
```

:::

### Create your first controller

Next we need to define our first operation. We can do this by using a controller.

In the following example we create an operation `GET /users` that returns a list of `User`.

::: code-group

```ts [users_controller.ts]
import { apiOperation, apiResponse } from "openapi-decorators/decorators";
import User from "./user";

class UsersController {
  @apiOperation({ 
    method: "get", 
    pattern: "/users", 
    summary: "List users"
  })
  @apiResponse({ type: [User] })
  async list() {
    ...
  }
}
```

:::

### Load the controller into your DocumentBuilder

You now simply have to load the controller into your DocumentBuilder and tada 🎉.

::: code-group

```ts [index.ts]
import "reflect-metadata";
import { DocumentBuilder } from "openapi-decorators/builders";
import { loadController } from "openapi-decorators/loaders";
import UsersController from "./users_controller";

const builder = new DocumentBuilder()
  .setTitle("My API")
  .setVersion("1.0.0");

await loadController(builder, UsersController);

console.log(document.build()); // <- Your generated OpenAPI specifications
```

:::
