[![version
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
(scoped)](https://img.shields.io/npm/v/@manifoldco/swagger-to-ts.svg)](https://www.npmjs.com/package/@manifoldco/swagger-to-ts)
[![codecov](https://codecov.io/gh/manifoldco/swagger-to-ts/branch/master/graph/badge.svg)](https://codecov.io/gh/manifoldco/swagger-to-ts)

# 📘️ swagger-to-ts

🚀 Convert [OpenAPI 2.0][openapi2] and [OpenAPI 3.0][openapi3] schemas to TypeScript interfaces using Node.js.

💅 The output is prettified with [Prettier][prettier] (and can be customized!).

👉 Works for both local and remote resources (filesystem and HTTP).

View examples:

- [Stripe, OpenAPI 2.0](./examples/stripe-openapi2.ts)
- [Stripe, OpenAPI 3.0](./examples/stripe-openapi3.ts)

## Usage

### CLI

#### 🗄️ Reading specs from file system

```bash
npx @manifoldco/swagger-to-ts schema.yaml --output schema.ts

# 🤞 Loading spec from tests/v2/specs/stripe.yaml…
# 🚀 schema.yaml -> schema.ts [250ms]
```

#### ☁️ Reading specs from remote resource

```bash
npx @manifoldco/swagger-to-ts https://petstore.swagger.io/v2/swagger.json --output petstore.ts

# 🤞 Loading spec from https://petstore.swagger.io/v2/swagger.json…
# 🚀 https://petstore.swagger.io/v2/swagger.json -> petstore.ts [650ms]
```

#### Generating multiple schemas

In your `package.json`, for each schema you’d like to transform add one `generate:specs:[name]` npm-script. Then combine them all into one `generate:specs` script, like so:

```json
"scripts": {
  "generate:specs": "npm run generate:specs:one && npm run generate:specs:two && npm run generate:specs:three",
  "generate:specs:one": "npx @manifoldco/swagger-to-ts one.yaml -o one.ts",
  "generate:specs:two": "npx @manifoldco/swagger-to-ts two.yaml -o two.ts",
  "generate:specs:three": "npx @manifoldco/swagger-to-ts three.yaml -o three.ts"
}
```

You can even specify unique options per-spec, if needed. To generate them all together, run:

```bash
npm run generate:specs
```

Rinse and repeat for more specs.

For anything more complicated, or for generating specs dynamically, you can also use the [Node API](#node).

#### CLI Options

| Option                         | Alias | Default  | Description                                                      |
| :----------------------------- | :---- | :------: | :--------------------------------------------------------------- |
| `--output [location]`          | `-o`  | (stdout) | Where should the output file be saved?                           |
| `--prettier-config [location]` |       |          | (optional) Path to your custom Prettier configuration for output |

### Node

```bash
npm i --save-dev @manifoldco/swagger-to-ts
```

```js
const { readFileSync } = require("fs");
const swaggerToTS = require("@manifoldco/swagger-to-ts");

const input = JSON.parse(readFileSync("spec.json", "utf8")); // Input can be any JS object (OpenAPI format)
const output = swaggerToTS(input); // Outputs TypeScript defs as a string (to be parsed, or written to a file)
```

The Node API is a bit more flexible: it will only take a JS object as input (OpenAPI format), and
return a string of TS definitions. This lets you pull from any source (a Swagger server, local
files, etc.), and similarly lets you parse, post-process, and save the output anywhere.

If your specs are in YAML, you’ll have to convert them to JS objects using a library such as
[js-yaml][js-yaml]. If you’re batching large folders of specs, [glob][glob] may also come in handy.

#### PropertyMapper

In order to allow more control over how properties are parsed, and to specifically handle
`x-something`-properties, the `propertyMapper` option may be specified as the optional 2nd
parameter.

This is a function that, if specified, is called for each property and allows you to change how
swagger-to-ts handles parsing of Swagger files.

An example on how to use the `x-nullable` property to control if a property is optional:

```js
const getNullable = (d: { [key: string]: any }): boolean => {
  const nullable = d["x-nullable"];
  if (typeof nullable === "boolean") {
    return nullable;
  }
  return true;
};

const output = swaggerToTS(swagger, {
  propertyMapper: (swaggerDefinition, property): Property => ({
    ...property,
    optional: getNullable(swaggerDefinition),
  }),
});
```

## Upgrading from v1 to v2

Some options were removed in swagger-to-ts v2 that will break apps using v1, but it does so in exchange for more control, more stability, and more resilient types.

TL;DR:

```diff
-import { OpenAPI2 } from './generated';
+import { definitions } from './generated';

-type MyType = OpenAPI2.MyType;
+type MyType = definitions['MyType'];
```

#### In-depth explanation

In order to explain the change, let’s go through an example with the following Swagger definition (partial):

```yaml
swagger: 2.0
definitions:
  user:
    type: object
    properties:
      role:
        type: object
        properties:
          access:
            enum:
              - admin
              - user
  user_role:
    type: object
      role:
        type: string
  team:
    type: object
    properties:
      users:
        type: array
        items:
          $ref: user
```

This is how **v1** would have generated those types:

```ts
declare namespace OpenAPI2 {
  export interface User {
    role?: UserRole;
  }
  export interface UserRole {
    access?: "admin" | "user";
  }
  export interface UserRole {
    role?: string;
  }
  export interface Team {
    users?: User[];
  }
}
```

Uh oh. It tried to be intelligent, and keep interfaces shallow by transforming `user.role` into `UserRole.` However, we also have another `user_role` entry that has a conflicting `UserRole` interface. This is not what we want.

v1 of this project made certain assumptions about your schema that don’t always hold true. This is how **v2** generates types from that same schema:

```ts
export interface definitions {
  user: {
    role?: {
      access?: "admin" | "user";
    };
  };
  user_role: {
    role?: string;
  };
  team: {
    users?: definitions["user"][];
  };
}
```

This matches your schema more accurately, and doesn’t try to be clever by keeping things shallow. It’s also more predictable, with the generated types matching your schema naming. In your code here’s what would change:

```diff
-UserRole
+definitions['user']['role'];
```

While this is a change, it’s more predictable. Now you don’t have to guess what `user_role` was renamed to; you simply chain your type from the Swagger definition you‘re used to.

#### Better \$ref generation

swagger-to-ts v1 would attempt to resolve and flatten `$ref`s. This was bad because it would break on circular references (which both Swagger and TypeScript allow), and resolution also slowed it down.

In v2, your `$ref`s are preserved as-declared, and TypeScript does all the work. Now the responsibility is on your schema to handle collisions rather than swagger-to-ts, which is a better approach in general.

#### No Wrappers

The `--wrapper` CLI flag was removed because it was awkward having to manage part of your TypeScript definition in a CLI flag. In v2, simply compose the wrapper yourself however you’d like in TypeScript:

```ts
import { components as Schema1 } from './generated/schema-1.ts';
import { components as Schema2 } from './generated/schema-2.ts';

declare namespace OpenAPI3 {
  export Schema1;
  export Schema2;
}
```

#### No CamelCasing

The `--camelcase` flag was removed because it would mangle object names incorrectly or break trying to sanitize them (for example, you couldn’t run camelcase on a schema with `my.obj` and `my-obj`—they both would transfom to the same thing causing unexpected results).

OpenAPI allows for far more flexibility in naming schema objects than JavaScript, so that should be carried over from your schema. In v2, the naming of generated types maps 1:1 with your schema name.

[glob]: https://www.npmjs.com/package/glob
[js-yaml]: https://www.npmjs.com/package/js-yaml
[openapi2]: https://swagger.io/specification/v2/
[openapi3]: https://swagger.io/specification
[namespace]: https://www.typescriptlang.org/docs/handbook/namespaces.html
[prettier]: https://npmjs.com/prettier

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://pow.rs"><img src="https://avatars3.githubusercontent.com/u/1369770?v=4" width="100px;" alt=""/><br /><sub><b>Drew Powers</b></sub></a><br /><a href="https://github.com/manifoldco/swagger-to-ts/commits?author=dangodev" title="Code">💻</a> <a href="https://github.com/manifoldco/swagger-to-ts/commits?author=dangodev" title="Documentation">📖</a> <a href="#infra-dangodev" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/manifoldco/swagger-to-ts/commits?author=dangodev" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://smyrdek.com"><img src="https://avatars1.githubusercontent.com/u/6187417?v=4" width="100px;" alt=""/><br /><sub><b>Przemek Smyrdek</b></sub></a><br /><a href="https://github.com/manifoldco/swagger-to-ts/commits?author=psmyrdek" title="Code">💻</a> <a href="https://github.com/manifoldco/swagger-to-ts/commits?author=psmyrdek" title="Documentation">📖</a> <a href="#ideas-psmyrdek" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/manifoldco/swagger-to-ts/commits?author=psmyrdek" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!