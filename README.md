[![version(scoped)](https://img.shields.io/npm/v/openapi-typescript.svg)](https://www.npmjs.com/package/openapi-typescript)
[![npm downloads (weekly)](https://img.shields.io/npm/dw/openapi-typescript)](https://www.npmjs.com/package/openapi-typescript)
[![codecov](https://codecov.io/gh/drwpow/openapi-typescript/branch/main/graph/badge.svg)](https://codecov.io/gh/drwpow/openapi-typescript)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-70-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# 📘️ openapi-typescript

🚀 Convert static [OpenAPI](https://spec.openapis.org/oas/latest.html) schemas to TypeScript types quickly using pure Node.js. Fast, lightweight, (almost) dependency-free, and no Java/node-gyp/running OpenAPI servers necessary.

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

#### 🗄️ Reading a local schema

```bash
npx openapi-typescript schema.yaml --output schema.ts

# 🔭 Loading spec from schema.yaml…
# 🚀 schema.yaml -> schema.ts [250ms]
```

##### 🦠 Globbing local schemas

```bash
npx openapi-typescript "specs/**/*.yaml" --output schemas/

# 🔭 Loading spec from specs/one.yaml…
# 🔭 Loading spec from specs/two.yaml…
# 🔭 Loading spec from specs/three.yaml…
# 🚀 specs/one.yaml -> schemas/specs/one.ts [250ms]
# 🚀 specs/two.yaml -> schemas/specs/two.ts [250ms]
# 🚀 specs/three.yaml -> schemas/specs/three.ts [250ms]
```

_Thanks, [@sharmarajdaksh](https://github.com/sharmarajdaksh)!_

#### ☁️ Reading remote schemas

```bash
npx openapi-typescript https://petstore3.swagger.io/api/v3/openapi.yaml --output petstore.d.ts

# 🔭 Loading spec from https://petstore3.swagger.io/api/v3/openapi.yaml…
# 🚀 https://petstore3.swagger.io/api/v3/openapi.yaml -> petstore.d.ts [650ms]
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

✨ **Tip**: Automatically-typed fetch wrappers are better to use than manually-assigned generics. The latter is not only more work, but it can be error-prone (which makes your OpenAPI typing worthless if it can’t catch all your errors!).

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

The Node API may be useful if dealing with dynamically-created schemas, or you’re using within context of a larger application. Pass in either a JSON-friendly object to load a schema from memory, or a string to load a schema from a local file or remote URL (it will load the file quickly using built-in Node methods). Note that a YAML string isn’t supported in the Node.js API; either use the CLI or convert to JSON using [js-yaml](https://www.npmjs.com/package/js-yaml) first.

#### 📖 Node options

The Node API supports all the [CLI flags](#--options) above in `camelCase` format, plus the following additional options:

| Name            |    Type    | Default | Description                                                                      |
| :-------------- | :--------: | :------ | :------------------------------------------------------------------------------- |
| `commentHeader` |  `string`  |         | Override the default “This file was auto-generated …” file heading               |
| `inject`        |  `string`  |         | Inject arbitrary TypeScript types into the start of the file                     |
| `transform`     | `Function` |         | Override the default Schema Object ➝ TypeScript transformer in certain scenarios |
| `postTransform` | `Function` |         | Same as `transform` but runs _after_ the TypeScript transformation               |

#### 🤖 transform / postTransform

If using the Node.js API, you can override the normal Schema Object transformer with your own. This is useful for providing enhanced functionality for specific parts of your schema.

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

✨ Don’t forget about `postTransform()` as well! It works the same way, but runs _after_ the TypeScript transformation so you can extend/modify types as-needed.

## 🏅 Project Goals

1. Support converting any valid OpenAPI schema to TypeScript types, no matter how complicated.
1. This library does **NOT** validate your schema, there are other libraries for that.
1. The generated TypeScript types **must** match your schema as closely as possible (e.g. no renaming to `PascalCase`)
1. This library should never require Java, node-gyp, or some other complex environment to work. This should require Node.js and nothing else.
1. This library will never require a running OpenAPI server to work.

## 🤝 Contributing

PRs are welcome! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) guide.

### Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://pow.rs"><img src="https://avatars3.githubusercontent.com/u/1369770?v=4?s=100" width="100px;" alt="Drew Powers"/><br /><sub><b>Drew Powers</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=dangodev" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dangodev" title="Documentation">📖</a> <a href="#infra-dangodev" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dangodev" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://smyrdek.com"><img src="https://avatars1.githubusercontent.com/u/6187417?v=4?s=100" width="100px;" alt="Przemek Smyrdek"/><br /><sub><b>Przemek Smyrdek</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=psmyrdek" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=psmyrdek" title="Documentation">📖</a> <a href="#ideas-psmyrdek" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=psmyrdek" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://danielenman.com"><img src="https://avatars3.githubusercontent.com/u/432487?v=4?s=100" width="100px;" alt="Dan Enman"/><br /><sub><b>Dan Enman</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aenmand" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=enmand" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://atlefren.net"><img src="https://avatars2.githubusercontent.com/u/1829927?v=4?s=100" width="100px;" alt="Atle Frenvik Sveen"/><br /><sub><b>Atle Frenvik Sveen</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=atlefren" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=atlefren" title="Documentation">📖</a> <a href="#ideas-atlefren" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=atlefren" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.timdewolf.com"><img src="https://avatars0.githubusercontent.com/u/4455209?v=4?s=100" width="100px;" alt="Tim de Wolf"/><br /><sub><b>Tim de Wolf</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tpdewolf" title="Code">💻</a> <a href="#ideas-tpdewolf" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tombarton"><img src="https://avatars1.githubusercontent.com/u/6222711?v=4?s=100" width="100px;" alt="Tom Barton"/><br /><sub><b>Tom Barton</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tombarton" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tombarton" title="Documentation">📖</a> <a href="#ideas-tombarton" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tombarton" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.viig.no"><img src="https://avatars0.githubusercontent.com/u/1080888?v=4?s=100" width="100px;" alt="Sven Nicolai Viig"/><br /><sub><b>Sven Nicolai Viig</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asvnv" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=svnv" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=svnv" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://toot.cafe/@sorin"><img src="https://avatars1.githubusercontent.com/u/2109702?v=4?s=100" width="100px;" alt="Sorin Davidoi"/><br /><sub><b>Sorin Davidoi</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asorin-davidoi" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=sorin-davidoi" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=sorin-davidoi" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/scvnathan"><img src="https://avatars3.githubusercontent.com/u/73474?v=4?s=100" width="100px;" alt="Nathan Schneirov"/><br /><sub><b>Nathan Schneirov</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=scvnathan" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=scvnathan" title="Documentation">📖</a> <a href="#ideas-scvnathan" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=scvnathan" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://lbenie.xyz/"><img src="https://avatars1.githubusercontent.com/u/7316046?v=4?s=100" width="100px;" alt="Lucien Bénié"/><br /><sub><b>Lucien Bénié</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=lbenie" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=lbenie" title="Documentation">📖</a> <a href="#ideas-lbenie" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=lbenie" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://boris.sh"><img src="https://avatars1.githubusercontent.com/u/17952318?v=4?s=100" width="100px;" alt="Boris K"/><br /><sub><b>Boris K</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=bokub" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://twitter.com/antonk52"><img src="https://avatars1.githubusercontent.com/u/5817809?v=4?s=100" width="100px;" alt="Anton"/><br /><sub><b>Anton</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aantonk52" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=antonk52" title="Code">💻</a> <a href="#ideas-antonk52" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=antonk52" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tshelburne"><img src="https://avatars3.githubusercontent.com/u/1202267?v=4?s=100" width="100px;" alt="Tim Shelburne"/><br /><sub><b>Tim Shelburne</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tshelburne" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tshelburne" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://typeofweb.com"><img src="https://avatars0.githubusercontent.com/u/1338731?v=4?s=100" width="100px;" alt="Michał Miszczyszyn"/><br /><sub><b>Michał Miszczyszyn</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mmiszy" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/skh-"><img src="https://avatars1.githubusercontent.com/u/1292598?v=4?s=100" width="100px;" alt="Sam K Hall"/><br /><sub><b>Sam K Hall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=skh-" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=skh-" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/BlooJeans"><img src="https://avatars2.githubusercontent.com/u/1751182?v=4?s=100" width="100px;" alt="Matt Jeanes"/><br /><sub><b>Matt Jeanes</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=BlooJeans" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.selbekk.io"><img src="https://avatars1.githubusercontent.com/u/1307267?v=4?s=100" width="100px;" alt="Kristofer Giltvedt Selbekk"/><br /><sub><b>Kristofer Giltvedt Selbekk</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=selbekk" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://mause.me"><img src="https://avatars2.githubusercontent.com/u/1405026?v=4?s=100" width="100px;" alt="Elliana May"/><br /><sub><b>Elliana May</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Mause" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Mause" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/henhal"><img src="https://avatars3.githubusercontent.com/u/9608258?v=4?s=100" width="100px;" alt="Henrik Hall"/><br /><sub><b>Henrik Hall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://dev.to/gr2m"><img src="https://avatars3.githubusercontent.com/u/39992?v=4?s=100" width="100px;" alt="Gregor Martynus"/><br /><sub><b>Gregor Martynus</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=gr2m" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=gr2m" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Agr2m" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://samn.co.uk"><img src="https://avatars2.githubusercontent.com/u/408983?v=4?s=100" width="100px;" alt="Sam Mesterton-Gibbons"/><br /><sub><b>Sam Mesterton-Gibbons</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=samdbmg" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asamdbmg" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=samdbmg" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://rendall.dev"><img src="https://avatars2.githubusercontent.com/u/293263?v=4?s=100" width="100px;" alt="Rendall"/><br /><sub><b>Rendall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=rendall" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Arendall" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=rendall" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://massaioli.wordpress.com"><img src="https://avatars3.githubusercontent.com/u/149178?v=4?s=100" width="100px;" alt="Robert Massaioli"/><br /><sub><b>Robert Massaioli</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=robertmassaioli" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Arobertmassaioli" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://jankuca.com"><img src="https://avatars3.githubusercontent.com/u/367262?v=4?s=100" width="100px;" alt="Jan Kuča"/><br /><sub><b>Jan Kuča</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=jankuca" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=jankuca" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/th-m"><img src="https://avatars3.githubusercontent.com/u/13792029?v=4?s=100" width="100px;" alt="Thomas Valadez"/><br /><sub><b>Thomas Valadez</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=th-m" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://asithadesilva.com"><img src="https://avatars1.githubusercontent.com/u/3814354?v=4?s=100" width="100px;" alt="Asitha de Silva"/><br /><sub><b>Asitha de Silva</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=asithade" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aasithade" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MikeYermolayev"><img src="https://avatars2.githubusercontent.com/u/8783498?v=4?s=100" width="100px;" alt="Mikhail Yermolayev"/><br /><sub><b>Mikhail Yermolayev</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AMikeYermolayev" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/radist2s"><img src="https://avatars.githubusercontent.com/u/725645?v=4?s=100" width="100px;" alt="Alex Batalov"/><br /><sub><b>Alex Batalov</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=radist2s" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=radist2s" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/FedeBev"><img src="https://avatars.githubusercontent.com/u/22151395?v=4?s=100" width="100px;" alt="Federico Bevione"/><br /><sub><b>Federico Bevione</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AFedeBev" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FedeBev" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FedeBev" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yamacent"><img src="https://avatars.githubusercontent.com/u/8544439?v=4?s=100" width="100px;" alt="Daisuke Yamamoto"/><br /><sub><b>Daisuke Yamamoto</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=yamacent" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Ayamacent" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=yamacent" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dnalborczyk"><img src="https://avatars.githubusercontent.com/u/2903325?v=4?s=100" width="100px;" alt="dnalborczyk"/><br /><sub><b>dnalborczyk</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=dnalborczyk" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dnalborczyk" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dnalborczyk" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/FabioWanner"><img src="https://avatars.githubusercontent.com/u/46821078?v=4?s=100" width="100px;" alt="FabioWanner"/><br /><sub><b>FabioWanner</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AFabioWanner" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FabioWanner" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FabioWanner" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ashsmith.io"><img src="https://avatars.githubusercontent.com/u/1086841?v=4?s=100" width="100px;" alt="Ash Smith"/><br /><sub><b>Ash Smith</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ashsmith" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aashsmith" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=ashsmith" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://mehalter.com"><img src="https://avatars.githubusercontent.com/u/1591837?v=4?s=100" width="100px;" alt="Micah Halter"/><br /><sub><b>Micah Halter</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mehalter" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=mehalter" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Amehalter" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Chrg1001"><img src="https://avatars.githubusercontent.com/u/40189653?v=4?s=100" width="100px;" alt="Yuto Yoshihara"/><br /><sub><b>Yuto Yoshihara</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Chrg1001" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AChrg1001" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Chrg1001" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sharmarajdaksh"><img src="https://avatars.githubusercontent.com/u/33689528?v=4?s=100" width="100px;" alt="Dakshraj Sharma"/><br /><sub><b>Dakshraj Sharma</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=sharmarajdaksh" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shuluster"><img src="https://avatars.githubusercontent.com/u/1707910?v=4?s=100" width="100px;" alt="Shaosu Liu"/><br /><sub><b>Shaosu Liu</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=shuluster" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://vytenis.kuciauskas.lt"><img src="https://avatars.githubusercontent.com/u/468006?v=4?s=100" width="100px;" alt="Vytenis"/><br /><sub><b>Vytenis</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=FDiskas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.zornwebdev.com"><img src="https://avatars.githubusercontent.com/u/22532542?v=4?s=100" width="100px;" alt="Eric Zorn"/><br /><sub><b>Eric Zorn</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ericzorn93" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=ericzorn93" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=ericzorn93" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.mbelsky.com/"><img src="https://avatars.githubusercontent.com/u/3923527?v=4?s=100" width="100px;" alt="Max Belsky"/><br /><sub><b>Max Belsky</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mbelsky" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Ambelsky" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Peteck"><img src="https://avatars.githubusercontent.com/u/1520592?v=4?s=100" width="100px;" alt="Peter Bech"/><br /><sub><b>Peter Bech</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Peteck" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3APeteck" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://rusty.today"><img src="https://avatars.githubusercontent.com/u/731941?v=4?s=100" width="100px;" alt="Rusty Conover"/><br /><sub><b>Rusty Conover</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=rustyconover" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bunkscene"><img src="https://avatars.githubusercontent.com/u/2693678?v=4?s=100" width="100px;" alt="Dave Carlson"/><br /><sub><b>Dave Carlson</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=bunkscene" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ottomated.net"><img src="https://avatars.githubusercontent.com/u/31470743?v=4?s=100" width="100px;" alt="ottomated"/><br /><sub><b>ottomated</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ottomated" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aottomated" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://karanarqq.dev"><img src="https://avatars.githubusercontent.com/u/28733669?v=4?s=100" width="100px;" alt="Artem Shuvaev"/><br /><sub><b>Artem Shuvaev</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=sadfsdfdsa" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asadfsdfdsa" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ajaishankar"><img src="https://avatars.githubusercontent.com/u/328008?v=4?s=100" width="100px;" alt="ajaishankar"/><br /><sub><b>ajaishankar</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ajaishankar" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.dominikdosoudil.cz"><img src="https://avatars.githubusercontent.com/u/15929942?v=4?s=100" width="100px;" alt="Dominik Dosoudil"/><br /><sub><b>Dominik Dosoudil</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=dominikdosoudil" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dominikdosoudil" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://kgtkr.net/"><img src="https://avatars.githubusercontent.com/u/17868838?v=4?s=100" width="100px;" alt="tkr"/><br /><sub><b>tkr</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=kgtkr" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=kgtkr" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/berzi"><img src="https://avatars.githubusercontent.com/u/32619123?v=4?s=100" width="100px;" alt="berzi"/><br /><sub><b>berzi</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=berzi" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=berzi" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=berzi" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://philip-trauner.me"><img src="https://avatars.githubusercontent.com/u/9287847?v=4?s=100" width="100px;" alt="Philip Trauner"/><br /><sub><b>Philip Trauner</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=PhilipTrauner" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=PhilipTrauner" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=PhilipTrauner" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://powell-v2.github.io/"><img src="https://avatars.githubusercontent.com/u/25308326?v=4?s=100" width="100px;" alt="Pavel Yermolin"/><br /><sub><b>Pavel Yermolin</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Powell-v2" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Powell-v2" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Powell-v2" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.duncanbeevers.com"><img src="https://avatars.githubusercontent.com/u/7367?v=4?s=100" width="100px;" alt="Duncan Beevers"/><br /><sub><b>Duncan Beevers</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=duncanbeevers" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aduncanbeevers" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=duncanbeevers" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=duncanbeevers" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://t.me/tkukushkin"><img src="https://avatars.githubusercontent.com/u/1482516?v=4?s=100" width="100px;" alt="Timofey Kukushkin"/><br /><sub><b>Timofey Kukushkin</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tkukushkin" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tkukushkin" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Atkukushkin" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://semigradsky.dev/"><img src="https://avatars.githubusercontent.com/u/1198848?v=4?s=100" width="100px;" alt="Dmitry Semigradsky"/><br /><sub><b>Dmitry Semigradsky</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3ASemigradsky" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Semigradsky" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Semigradsky" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://jeremyliberman.com/"><img src="https://avatars.githubusercontent.com/u/2754163?v=4?s=100" width="100px;" alt="Jeremy Liberman"/><br /><sub><b>Jeremy Liberman</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=MrLeebo" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=MrLeebo" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://axelhzf.com"><img src="https://avatars.githubusercontent.com/u/175627?v=4?s=100" width="100px;" alt="Axel Hernández Ferrera"/><br /><sub><b>Axel Hernández Ferrera</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=axelhzf" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aaxelhzf" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=axelhzf" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/imagoiq"><img src="https://avatars.githubusercontent.com/u/12294151?v=4?s=100" width="100px;" alt="Loïc Fürhoff"/><br /><sub><b>Loïc Fürhoff</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=imagoiq" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=imagoiq" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aimagoiq" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/BTMPL"><img src="https://avatars.githubusercontent.com/u/247153?v=4?s=100" width="100px;" alt="Bartosz Szczeciński"/><br /><sub><b>Bartosz Szczeciński</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=BTMPL" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3ABTMPL" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=BTMPL" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/HiiiiD"><img src="https://avatars.githubusercontent.com/u/61231210?v=4?s=100" width="100px;" alt="Marco Salomone"/><br /><sub><b>Marco Salomone</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=HiiiiD" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=HiiiiD" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AHiiiiD" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yacinehmito"><img src="https://avatars.githubusercontent.com/u/6893840?v=4?s=100" width="100px;" alt="Yacine Hmito"/><br /><sub><b>Yacine Hmito</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=yacinehmito" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=yacinehmito" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Ayacinehmito" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sajadtorkamani.com"><img src="https://avatars.githubusercontent.com/u/9380313?v=4?s=100" width="100px;" alt="Sajad Torkamani"/><br /><sub><b>Sajad Torkamani</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=sajadtorkamani" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://sci-scale.net/"><img src="https://avatars.githubusercontent.com/u/6804901?v=4?s=100" width="100px;" alt="Marius van den Beek"/><br /><sub><b>Marius van den Beek</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mvdbeek" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Amvdbeek" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=mvdbeek" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sgrimm"><img src="https://avatars.githubusercontent.com/u/1248649?v=4?s=100" width="100px;" alt="Steven Grimm"/><br /><sub><b>Steven Grimm</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=sgrimm" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asgrimm" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=sgrimm" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://trutoo.com/people/erik-hughes"><img src="https://avatars.githubusercontent.com/u/455178?v=4?s=100" width="100px;" alt="Erik Hughes"/><br /><sub><b>Erik Hughes</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Swiftwork" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3ASwiftwork" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Swiftwork" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mtth"><img src="https://avatars.githubusercontent.com/u/1216372?v=4?s=100" width="100px;" alt="Matthieu Monsch"/><br /><sub><b>Matthieu Monsch</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mtth" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Amtth" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=mtth" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mitchell-merry"><img src="https://avatars.githubusercontent.com/u/8567231?v=4?s=100" width="100px;" alt="Mitchell Merry"/><br /><sub><b>Mitchell Merry</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mitchell-merry" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=mitchell-merry" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Amitchell-merry" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.francoisrisoud.com"><img src="https://avatars.githubusercontent.com/u/6012554?v=4?s=100" width="100px;" alt="François Risoud"/><br /><sub><b>François Risoud</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=qnp" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aqnp" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=qnp" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shoffmeister"><img src="https://avatars.githubusercontent.com/u/3868036?v=4?s=100" width="100px;" alt="shoffmeister"/><br /><sub><b>shoffmeister</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=shoffmeister" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/liangskyli"><img src="https://avatars.githubusercontent.com/u/31531283?v=4?s=100" width="100px;" alt="liangsky"/><br /><sub><b>liangsky</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=liangskyli" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aliangskyli" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=liangskyli" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://happycollision.com"><img src="https://avatars.githubusercontent.com/u/3663628?v=4?s=100" width="100px;" alt="Don Denton"/><br /><sub><b>Don Denton</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=happycollision" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Ahappycollision" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!
