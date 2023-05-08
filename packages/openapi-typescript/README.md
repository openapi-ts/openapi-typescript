<img src="../../docs/public/assets/openapi-ts.svg" alt="openapi-typescript" width="200" height="40" />

openapi-typescript generates TypeScript types from static <a href="https://spec.openapis.org/oas/latest.html" target="_blank" rel="noopener noreferrer">OpenAPI</a> schemas quickly using only Node.js. It is fast, lightweight, (almost) dependency-free, and no Java/node-gyp/running OpenAPI servers necessary.

The code is [MIT-licensed](./LICENSE) and free for use.

**Features**

- ✅ Supports YAML and JSON formats
- ✅ Supports advanced OpenAPI 3.1 features like [discriminators](https://spec.openapis.org/oas/v3.1.0#discriminator-object)
- ✅ Supports loading via remote URL (simple authentication supported with the `--auth` flag)
- ✅ Supports remote references: `$ref: "external.yaml#components/schemas/User"`
- ✅ Fetches remote schemas quickly using [undici](https://www.npmjs.com/package/undici)

**Examples**

👀 [See examples](./examples/)

## Usage

Note:️ openapiTS requires **VALID** OpenAPI 3.x schemas to work, and this library does not handle validation. There are several quality tools that handle this like [@apidevtools/swagger-parser](https://www.npmjs.com/package/@apidevtools/swagger-parser). Make sure to validate your schemas first!

### 🖥️ CLI

#### 🗄️ Reading schemas

```bash
npx openapi-typescript schema.yaml --output schema.ts

# 🚀 schema.yaml -> schema.ts [7ms]
```

##### 🦠 Globbing local schemas

```bash
npx openapi-typescript "specs/**/*.yaml" --output schemas/

# 🚀 specs/one.yaml -> schemas/specs/one.ts [7ms]
# 🚀 specs/two.yaml -> schemas/specs/two.ts [7ms]
# 🚀 specs/three.yaml -> schemas/specs/three.ts [7ms]
```

_Thanks, [@sharmarajdaksh](https://github.com/sharmarajdaksh)!_

#### ☁️ Remote schemas

```bash
npx openapi-typescript https://petstore3.swagger.io/api/v3/openapi.yaml --output petstore.d.ts

# 🚀 https://petstore3.swagger.io/api/v3/openapi.yaml -> petstore.d.ts [250ms]
```

_Thanks, [@psmyrdek](https://github.com/psmyrdek)!_

#### 🟦 Using in TypeScript

Import any top-level item from the generated spec to use it. It works best if you also alias types to save on typing:

```ts
import { components } from "./generated-schema.ts";

type APIResponse = components["schemas"]["APIResponse"];
```

Because OpenAPI schemas may have invalid TypeScript characters as names, the square brackets are a safe way to access every property.

##### 🏗️ Operations

Operations can be imported directly by their [operationId](https://spec.openapis.org/oas/latest.html#operation-object):

```ts
import { operations } from "./generated-schema.ts";

type getUsersById = operations["getUsersById"];
```

_Thanks, [@gr2m](https://github.com/gr2m)!_

#### ⚾ Fetching data

Fetching data can be done simply and safely using an **automatically-typed fetch wrapper**:

- [openapi-fetch](https://github.com/drwpow/openapi-fetch) (recommended)
- [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) by [@ajaishankar](https://github.com/ajaishankar)

**Example** ([openapi-fetch](https://github.com/drwpow/openapi-fetch))

```ts
import createClient from "openapi-fetch";
import { paths } from "./v1"; // (generated from openapi-typescript)

const { get, post, put, patch, del } = createClient<paths>({
  baseUrl: "https://myserver.com/api/v1/",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_AUTH_TOKEN}`,
  },
});
```

See each project’s respective pages for usage & install instructions.

> ✨ **Tip**
>
> A good fetch wrapper should **never use generics.** Generics require more typing and can hide errors!

### 📖 Options

The following flags can be appended to the CLI command.

| Option                    | Alias | Default  | Description                                                                                                                  |
| :------------------------ | :---- | :------: | :--------------------------------------------------------------------------------------------------------------------------- |
| `--help`                  |       |          | Display inline help message and exit                                                                                         |
| `--version`               |       |          | Display this library’s version and exit                                                                                      |
| `--output [location]`     | `-o`  | (stdout) | Where should the output file be saved?                                                                                       |
| `--auth [token]`          |       |          | Provide an auth token to be passed along in the request (only if accessing a private schema)                                 |
| `--header`                | `-x`  |          | Provide an array of or singular headers as an alternative to a JSON object. Each header must follow the `key: value` pattern |
| `--headers-object="{…}"`  | `-h`  |          | Provide a JSON object as string of HTTP headers for remote schema request. This will take priority over `--header`           |
| `--http-method`           | `-m`  |  `GET`   | Provide the HTTP Verb/Method for fetching a schema from a remote URL                                                         |
| `--immutable-types`       |       | `false`  | Generates immutable types (readonly properties and readonly array)                                                           |
| `--additional-properties` |       | `false`  | Allow arbitrary properties for all schema objects without `additionalProperties: false`                                      |
| `--empty-objects-unknown` |       | `false`  | Allow arbitrary properties for schema objects with no specified properties, and no specified `additionalProperties`          |
| `--default-non-nullable`  |       | `false`  | Treat schema objects with default values as non-nullable                                                                     |
| `--export-type`           | `-t`  | `false`  | Export `type` instead of `interface`                                                                                         |
| `--path-params-as-types`  |       | `false`  | Allow dynamic string lookups on the `paths` object                                                                           |
| `--support-array-length`  |       | `false`  | Generate tuples using array `minItems` / `maxItems`                                                                          |
| `--alphabetize`           |       | `false`  | Sort types alphabetically                                                                                                    |

#### 🚩 `--path-params-as-types`

By default, your URLs are preserved exactly as-written in your schema:

```ts
export interface paths {
  "/user/{user_id}": components["schemas"]["User"];
}
```

Which means your type lookups also have to match the exact URL:

```ts
import { paths } from "./my-schema";

const url = `/user/${id}`;
type UserResponses = paths["/user/{user_id}"]["responses"];
```

But when `--path-params-as-types` is enabled, you can take advantage of dynamic lookups like so:

```ts
import { paths } from "./my-schema";

const url = `/user/${id}`;
type UserResponses = paths[url]["responses"]; // automatically matches `paths['/user/{user_id}']`
```

Though this is a contrived example, you could use this feature to automatically infer typing based on the URL in a fetch client or in some other useful place in your application.

_Thanks, [@Powell-v2](https://github.com/Powell-v2)!_

#### 🚩 `--support-array-length`

This option is useful for generating tuples if an array type specifies `minItems` or `maxItems`.

For example, given the following schema:

```yaml
components:
  schemas:
    TupleType
      type: array
      items:
        type: string
      minItems: 1
      maxItems: 2
```

Enabling `--support-array-length` would change the typing like so:

```diff
  export interface components {
    schemas: {
-     TupleType: string[];
+     TupleType: [string] | [string, string];
    };
  }
```

This results in more explicit typechecking of array lengths.

_Note: this has a reasonable limit, so for example `maxItems: 100` would simply flatten back down to `string[];`_

_Thanks, [@kgtkr](https://github.com/kgtkr)!_

### 🐢 Node

```bash
npm i --save-dev openapi-typescript
```

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

> ⚠️ Note that unlike the CLI, YAML isn’t supported in the Node.js API. You’ll need to convert it to JSON yourself using <a href="https://www.npmjs.com/package/js-yaml" target="_blank" rel="noopener noreferrer">js-yaml</a> first.

#### 📖 Node options

The Node API supports all the [CLI flags](#--options) above in `camelCase` format, plus the following additional options:

| Name            |    Type    | Default | Description                                                                      |
| :-------------- | :--------: | :------ | :------------------------------------------------------------------------------- |
| `commentHeader` |  `string`  |         | Override the default “This file was auto-generated …” file heading               |
| `inject`        |  `string`  |         | Inject arbitrary TypeScript types into the start of the file                     |
| `transform`     | `Function` |         | Override the default Schema Object ➝ TypeScript transformer in certain scenarios |
| `postTransform` | `Function` |         | Same as `transform` but runs _after_ the TypeScript transformation               |

#### 🤖 transform / postTransform

Use the `transform()` and `postTransform()` options to override the default Schema Object transformer with your own. This is useful for providing non-standard modifications for specific parts of your schema.

- `transform()` runs **BEFORE** the conversion to TypeScript (you’re working with the original OpenAPI nodes)
- `postTransform()` runs **AFTER** the conversion to TypeScript (you’re working with TypeScript types)

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

Any [Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) present in your schema will be run through this formatter (even remote ones!). Also be sure to check the `metadata` parameter for additional context that may be helpful.

There are many other uses for this besides checking `format`. Because this must return a **string** you can produce any arbitrary TypeScript code you’d like (even your own custom types).

## 🏅 Project Goals

1. Support converting any valid OpenAPI schema to TypeScript types, no matter how complicated.
1. This library does **NOT** validate your schema, there are other libraries for that.
1. The generated TypeScript types **must** match your schema as closely as possible (e.g. no renaming to `PascalCase`)
1. This library should never require Java, node-gyp, or some other complex environment to work. This should require Node.js and nothing else.
1. This library will never require a running OpenAPI server to work.

## 🤝 Contributing

PRs are welcome! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) guide.
