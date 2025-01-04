---
title: openapi-typescript Node.js API
description: Programmatic usage and unlimited flexibility.
---

# Node.js API

The Node API may be useful if dealing with dynamically-created schemas, or you’re using within context of a larger application. Pass in either a JSON-friendly object to load a schema from memory, or a string to load a schema from a local file or remote URL.

## Setup

```bash
npm i --save-dev openapi-typescript
```

::: tip Recommended

For the best experience, use Node ESM by adding `"type": "module"` to `package.json` ([docs](https://nodejs.org/api/esm.html#enabling))

:::

## Usage

```js
import fs from "node:fs";
import openapiTS from "openapi-typescript";

// example 1: load [object] as schema (JSON only)
const schema = await fs.promises.readFile("spec.json", "utf8"); // must be OpenAPI JSON
const output = await openapiTS(JSON.parse(schema));

// example 2: load [string] as local file (YAML or JSON; released in v4.0)
const localPath = new URL("./spec.yaml", import.meta.url); // may be YAML or JSON format
const output = await openapiTS(localPath);

// example 3: load [string] as remote URL (YAML or JSON; released in v4.0)
const output = await openapiTS("https://myurl.com/v1/openapi.yaml");
```

::: info

A YAML string isn’t supported in the Node.js API (you’ll need to [convert it to JSON](https://www.npmjs.com/package/js-yaml). But loading YAML via URL is still supported in Node.js

## Options

The Node API supports all the [CLI flags](/cli#options) in `camelCase` format, plus the following additional options:

| Name            |      Type       | Default | Description                                                                                                          |
| :-------------- | :-------------: | :------ | :------------------------------------------------------------------------------------------------------------------- |
| `commentHeader` |    `string`     |         | Override the default “This file was auto-generated …” file heading                                                   |
| `inject`        |    `string`     |         | Inject arbitrary TypeScript types into the start of the file                                                         |
| `transform`     |   `Function`    |         | Override the default Schema Object ➝ TypeScript transformer in certain scenarios                                     |
| `postTransform` |   `Function`    |         | Same as `transform` but runs _after_ the TypeScript transformation                                                   |
| `cwd`           | `string \| URL` |         | (optional) Provide the current working directory to resolve remote `$ref`s (only needed for in-memory JSON objects). |

### transform / postTransform

Use the `transform()` and `postTransform()` options to override the default Schema Object transformer with your own. This is useful for providing nonstandard modifications for specific parts of your schema.

- `transform()` runs **before** the conversion to TypeScript (you’re working with the original OpenAPI nodes)
- `postTransform()` runs **after** the conversion to TypeScript (you’re working with TypeScript types)

#### Example: `Date` types

For example, say your schema has the following property:

```yaml
properties:
  updated_at:
    type: string
    format: date-time
```

By default, openapiTS will generate `updated_at?: string;` because it’s not sure which format you want by `"date-time"` (formats are nonstandard and can be whatever you’d like). But we can enhance this by providing our own custom formatter, like so:

```js
const types = openapiTS(mySchema, {
  transform(schemaObject, metadata): string {
    if ("format" in schemaObject && schemaObject.format === "date-time") {
      return schemaObject.nullable ? "Date | null" : "Date";
    }
  },
});
```

That would result in the following change:

```diff
-  updated_at?: string;
+  updated_at?: Date;
```

#### Example: `Blob` types

Another common transformation is for file uploads, where the `body` of a request is a `multipart/form-data` with some `Blob` fields. Here's an example schema:

```yaml
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
```

Use the same pattern to transform the types:

```ts
const types = openapiTS(mySchema, {
  transform(schemaObject, metadata): string {
    if ("format" in schemaObject && schemaObject.format === "binary") {
      return schemaObject.nullable ? "Blob | null" : "Blob";
    }
  },
});
```

Resultant diff with correctly-typed `file` property:

```diff
-    file?: string;
+    file?: Blob;
```

#### transform / postTransform metadata

Any [Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) present in your schema will be run through `transform`, prior to its conversion to a TypeScript AST node, and `postTransform` after its conversion, including remote schemas!

The `metadata` parameter present on both `transform` and `postTransform` has additional context that may be helpful.

| Property | Description |
|-|-|
| `metadata.path` | A [`$ref`](https://json-schema.org/understanding-json-schema/structuring#dollarref) URI string, pointing to the current schema object |
| `metadata.schema` | The schema object being transformed (only present for `postTransform`) |
| `metadata.ctx` | The GlobalContext object, containing

There are many other uses for this besides checking `format`. Because `tranform` may return a **string** you can produce any arbitrary TypeScript code you’d like (even your own custom types).
