---
title: openapi-typescript Node.js API
description: Programmatic usage and unlimited flexibility.
---

# Node.js API

The Node API may be useful if dealing with dynamically-created schemas, or you’re using within context of a larger application. Pass in either a JSON-friendly object to load a schema from memory, or a string to load a schema from a local file or remote URL.

## Setup

```bash
npm i --save-dev openapi-typescript@next typescript
```

::: tip Recommended

For the best experience, use Node ESM by adding `"type": "module"` to `package.json` ([docs](https://nodejs.org/api/esm.html#enabling))

:::

## Usage

The Node.js API accepts either a `URL`, `string`, or JSON object as input:

|   Type   | Description                 | Example                                                                                                                          |
| :------: | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
|  `URL`   | Read a local or remote file | `await openapiTS(new URL('./schema.yaml', import.meta.url))`<br/>`await openapiTS(new URL('https://myapi.com/v1/openapi.yaml'))` |
| `string` | Read dynamic YAML or JSON   | `await openapiTS('openapi: "3.1" … ')`                                                                                           |
|  `JSON`  | Read dynamic JSON           | `await openapiTS({ openapi: '3.1', … })`                                                                                         |

It also accepts `Readable` streams and `Buffer` types that are resolved and treated as strings (validation, bundling, and type generation can’t really happen without the whole document).

The Node API returns a `Promise` with a TypeScript AST. You can then traverse / manipulate / modify the AST as you see fit.

To convert the TypeScript AST into a string, you can use `astToString()` helper which is a thin wrapper around [TypeScript’s printer](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#re-printing-sections-of-a-typescript-file):

::: code-group

```ts [src/my-project.ts]
import fs from "node:fs";
import openapiTS, { astToString } from "openapi-typescript";

const ast = await openapiTS(new URL("./my-schema.yaml", import.meta.url));
const contents = astToString(ast);

// (optional) write to file
fs.writeFileSync("./my-schema.ts", contents);
```

:::

### Redoc config

A Redoc config isn’t required to use openapi-typescript. By default it extends the `"minimal"` built-in config. But if you want to modify the default settings, you’ll need to provide a fully-initialized Redoc config to the Node API. You can do this with the helpers in `@redocly/openapi-core`:

::: code-group

```ts [src/my-project.ts]
import { createConfig, loadConfig } from "@redocly/openapi-core";
import openapiTS from "openapi-typescript";

// option 1: create in-memory config
const redoc = await createConfig(
  {
    apis: {
      "core@v2": { … },
      "external@v1": { … },
    },
  },
  { extends: ["recommended"] },
);

// option 2: load from redocly.yaml file
const redoc = await loadConfig({ configPath: "redocly.yaml" });

const ast = await openapiTS(mySchema, { redoc });
```

:::

## Options

The Node API supports all the [CLI flags](/cli#options) in `camelCase` format, plus the following additional options:

| Name            |      Type       |     Default     | Description                                                                                  |
| :-------------- | :-------------: | :-------------: | :------------------------------------------------------------------------------------------- |
| `transform`     |   `Function`    |                 | Override the default Schema Object ➝ TypeScript transformer in certain scenarios             |
| `postTransform` |   `Function`    |                 | Same as `transform` but runs _after_ the TypeScript transformation                           |
| `silent`        |    `boolean`    |     `false`     | Silence warning messages (fatal errors will still show)                                      |
| `cwd`           | `string \| URL` | `process.cwd()` | (optional) Provide the current working directory to help resolve remote `$ref`s (if needed). |

### transform / postTransform

Use the `transform()` and `postTransform()` options to override the default Schema Object transformer with your own. This is useful for providing nonstandard modifications for specific parts of your schema.

- `transform()` runs **before** the conversion to TypeScript (you’re working with the original OpenAPI nodes)
- `postTransform()` runs **after** the conversion to TypeScript (you’re working with TypeScript AST)

#### Example: `Date` types

For example, say your schema has the following property:

```yaml
properties:
  updated_at:
    type: string
    format: date-time
```

By default, openapiTS will generate `updated_at?: string;` because it’s not sure which format you want by `"date-time"` (formats are nonstandard and can be whatever you’d like). But we can enhance this by providing our own custom formatter, like so:

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";
import ts from "typescript";

const DATE = ts.factory.createIdentifier("Date"); // `Date`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "date-time") {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([DATE, NULL])
        : DATE;
    }
  },
});
```

:::

That would result in the following change:

::: code-group

```yaml [my-openapi-3-schema.yaml]
updated_at?: string; // [!code --]
updated_at: Date | null; // [!code ++]
```

:::

#### Example: `Blob` types

Another common transformation is for file uploads, where the `body` of a request is a `multipart/form-data` with some `Blob` fields. Here's an example schema:

::: code-group

```yaml [my-openapi-3-schema.yaml]
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
```

:::

Use the same pattern to transform the types:

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";
import ts from "typescript";

const BLOB = ts.factory.createIdentifier("Blob"); // `Blob`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "binary") {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([BLOB, NULL])
        : BLOB;
    }
  },
});
```

:::

Resultant diff with correctly-typed `file` property:

::: code-group

```ts [my-openapi-3-schema.d.ts]
file?: string; // [!code --]
file: Blob | null; // [!code ++]
```

:::

#### Example: Add "?" token to property

It is not possible to create a property with the optional "?" token with the above `transform` functions. The transform function also accepts a different return object, which allows you to add a "?" token to the property. Here's an example schema:

::: code-group

```yaml [my-openapi-3-schema.yaml]
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
      required: true;
```

:::

Here we return an object with a schema property, which is the same as the above example, but we also add a `questionToken` property, which will add the "?" token to the property.

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";
import ts from "typescript";

const BLOB = ts.factory.createIdentifier("Blob"); // `Blob`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "binary") {
      return {
        schema: schemaObject.nullable
          ? ts.factory.createUnionTypeNode([BLOB, NULL])
          : BLOB,
        questionToken: true,
      };
    }
  },
});
```

:::

Resultant diff with correctly-typed `file` property and "?" token:

::: code-group

```ts [my-openapi-3-schema.d.ts]
file: Blob; // [!code --]
file?: Blob | null; // [!code ++]
```

:::

Any [Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) present in your schema will be run through this formatter (even remote ones!). Also be sure to check the `metadata` parameter for additional context that may be helpful.

There are many other uses for this besides checking `format`. Because this must return a **string** you can produce any arbitrary TypeScript code you’d like (even your own custom types).
