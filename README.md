[![version(scoped)](https://img.shields.io/npm/v/openapi-typescript.svg)](https://www.npmjs.com/package/openapi-typescript)
[![npm downloads (weekly)](https://img.shields.io/npm/dw/openapi-typescript)](https://www.npmjs.com/package/openapi-typescript)
[![codecov](https://codecov.io/gh/drwpow/openapi-typescript/branch/main/graph/badge.svg)](https://codecov.io/gh/drwpow/openapi-typescript)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-52-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# 📘️ openapi-typescript

🚀 Convert [OpenAPI 3.0][openapi3] and [2.0 (Swagger)][openapi2] schemas to TypeScript interfaces using Node.js.

**Features**

- ✅ [OpenAPI 3.0][openapi3]
- ✅ [Swagger 2.0][openapi2]
- ✅ Supports YAML and JSON schema formats
- ✅ Supports loading via remote URL (simple authentication supported with the `--auth` flag)
- ✅ Supports remote references: `$ref: "external.yaml#components/schemas/User"`
- ✅ Formats using [Prettier][prettier]
- ✅ TypeScript 4.0 features

**Examples**

- [Stripe, OpenAPI 2.0](./examples/stripe-openapi2.ts)
- [Stripe, OpenAPI 3.0](./examples/stripe-openapi3.ts)

## Usage

### 🖥️ CLI

#### 🗄️ Reading specs from file system

```bash
npx openapi-typescript schema.yaml --output schema.ts

# 🔭 Loading spec from schema.yaml…
# 🚀 schema.yaml -> schema.ts [250ms]

npx openapi-typescript "specs/**/*.yaml" --output schemas/

# 🔭 Loading spec from specs/one.yaml…
# 🔭 Loading spec from specs/two.yaml…
# 🔭 Loading spec from specs/three.yaml…
# 🚀 specs/one.yaml -> schemas/specs/one.ts [250ms]
# 🚀 specs/two.yaml -> schemas/specs/two.ts [250ms]
# 🚀 specs/three.yaml -> schemas/specs/three.ts [250ms]
```

_Note: if generating a single schema, `--output` must be a file (preferably `*.ts`). If using globs, `--output` must be a directory._

_Thanks to [@sharmarajdaksh](https://github.com/sharmarajdaksh) for the glob feature!_

#### ☁️ Reading specs from remote resource

```bash
npx openapi-typescript https://petstore.swagger.io/v2/swagger.json --output petstore.ts

# 🔭 Loading spec from https://petstore.swagger.io/v2/swagger.json…
# 🚀 https://petstore.swagger.io/v2/swagger.json -> petstore.ts [650ms]
```

_Note: globbing doesn’t work for remote schemas because there is no reliable way to determine a list of files to select from a remote file system._

_Thanks to [@psmyrdek](https://github.com/psmyrdek) for the remote spec feature!_

#### Using in TypeScript

Import any top-level item from the generated spec to use it. It works best if you also alias types to save on typing:

```ts
import { components } from "./generated-schema.ts";

type APIResponse = components["schemas"]["APIResponse"];
```

Because OpenAPI schemas may have invalid TypeScript characters as names, the square brackets are a safe way to access every property.

Also note that there’s a special `operations` interface that you can import `OperationObjects` by their [operationId][openapi-operationid]:

```ts
import { operations } from "./generated-schema.ts";

type getUsersById = operations["getUsersById"];
```

Even though `operations` isn’t present in your original schema, it’s a simple convenience and won’t disrupt any of your other types.

_Thanks to [@gr2m](https://github.com/gr2m) for the operations feature!_

#### openapi-typescript-fetch

The generated spec can also be used with [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) which implements a typed fetch client for openapi-typescript.

```ts
import { paths } from "./petstore";

import { Fetcher } from "openapi-typescript-fetch";

// declare fetcher for paths
const fetcher = Fetcher.for<paths>()

// global configuration
fetcher.configure({
  baseUrl: "https://petstore.swagger.io/v2",
  init: {
    headers: {
      ...
    },
  },
  use: [...] // middlewares
})

// create fetch operations
const findPetsByStatus = fetcher.path("/pet/findByStatus").method("get").create()
const addPet = fetcher.path("/pet").method("post").create()

// fetch
try {
  const { status, data: pets } = await findPetsByStatus({
    status: ["available", "pending"],
  })
  await addPet({ ... })
} catch(e) {
  // check which operation threw the exception
  if (e instanceof addPet.Error) {
    // get discriminated union { status, data }
    const error = e.getActualType()
    if (error.status === 400) {
      error.data.validationErrors // 400 response data
    } else if (error.status === 500) {
      error.data.errorMessage // 500 response data
    } else {
      ...
    }
  }
}
```

#### Outputting to stdout

Simply omit the `--output` flag to return to stdout:

```bash
npx openapi-typescript schema.yaml
```

#### CLI Options

| Option                         | Alias | Default  | Description                                                                                                                             |
| :----------------------------- | :---- | :------: | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `--output [location]`          | `-o`  | (stdout) | Where should the output file be saved?                                                                                                  |
| `--auth [token]`               |       |          | (optional) Provide an auth token to be passed along in the request (only if accessing a private schema)                                 |
| `--header`                     | `-x`  |          | (optional) Provide an array of or singular headers as an alternative to a JSON object. Each header must follow the `key: value` pattern |
| `--headersObject`              | `-h`  |          | (optional) Provide a JSON object as string of HTTP headers for remote schema request. This will take priority over `--header`           |
| `--httpMethod`                 | `-m`  | `GET`    | (optional) Provide the HTTP Verb/Method for fetching a schema from a remote URL                                                         |
| `--immutable-types`            | `-it` | `false`  | (optional) Generates immutable types (readonly properties and readonly array)                                                           |
| `--additional-properties`      | `-ap` | `false`  | (optional) Allow arbitrary properties for all schema objects without `additionalProperties: false`                                      |
| `--default-non-nullable`       |       | `false`  | (optional) Treat schema objects with default values as non-nullable                                                                     |
| `--prettier-config [location]` | `-c`  |          | (optional) Path to your custom Prettier configuration for output                                                                        |
| `--export-type`                |       | `false`  | (optional) Export `type` instead of `interface`                                                                                         |
| `--support-array-length`       |       | `false`  | (optional) Generate tuples using array minItems / maxItems                                                                              |
| `--make-paths-enum`            | `-pe` | `false`  | (optional) Generate an enum of endpoint paths                                                                                           |
| `--path-params-as-types`       |       | `false`  | (optional) Substitute path parameter names with their respective types                                                                  |
| `--raw-schema`                 |       | `false`  | Generate TS types from partial schema (e.g. having `components.schema` at the top level)                                                |
| `--version`                    |       |          | Force OpenAPI version with `--version 3` or `--version 2` (required for `--raw-schema` when version is unknown)                         |

### 🐢 Node

```bash
npm i --save-dev openapi-typescript
```

```js
import fs from "fs";
import openapiTS from "openapi-typescript";

// example 1: load [object] as schema (JSON only)
const schema = await fs.promises.readFile("spec.json", "utf8") // must be OpenAPI JSON
const output = await openapiTS(JSON.parse(schema));

// example 2: load [string] as local file (YAML or JSON; released in v4.0)
const localPath = new URL("./spec.yaml", import.meta.url); // may be YAML or JSON format
const output = await openapiTS(localPath);

// example 3: load [string] as remote URL (YAML or JSON; released in v4.0)
const output = await openapiTS("https://myurl.com/v1/openapi.yaml");
```

The Node API may be useful if dealing with dynamically-created schemas, or you’re using within context of a larger application. Pass in either a JSON-friendly object to load a schema from memory, or a string to load a schema from a local file or remote URL (it will load the file quickly using built-in Node methods). Note that a YAML string isn’t supported in the Node.js API; either use the CLI or convert to JSON using [js-yaml][js-yaml] first.

⚠️ As of `v4.0`, `openapiTS()` is an async function.

#### Custom Formatter

If using the Node.js API, you can optionally pass a **formatter** to openapi-typescript. This is useful if you want to override the default types and substitute your own.

For example, say your schema has the following property:

```yaml
properties:
  updated_at:
    type: string
    format: date-time
```

By default, this will generate a type `updated_at?: string;`. But we can override this by passing a formatter to the Node API, like so:

```js
const types = openapiTS(mySchema, {
  formatter(node: SchemaObject) {
    if (node.format === "date-time") {
      return "Date"; // return the TypeScript “Date” type, as a string
    }
  // for all other schema objects, let openapi-typescript decide (return undefined)
});
```

This will generate `updated_at?: Date` instead. Note that you will still have to do the parsing of your data yourself. But this will save you from having to also update all your types.

_Note: you don’t have to use `.format`—this is just an example! You can use any property on a schema object to overwrite its generated type if desired._

## 🏅 Project Goals

1. Support converting any OpenAPI 3.0 or 2.0 (Swagger) schema to TypeScript types, no matter how complicated
1. The generated TypeScript types **must** match your schema as closely as possible (i.e. don’t convert names to
   `PascalCase` or follow any TypeScript-isms; faithfully reproduce your schema as closely as possible, capitalization
   and all)
1. This library is a TypeScript generator, not a schema validator.

## 🤝 Contributing

PRs are welcome! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) guide. Opening an issue beforehand to discuss is
encouraged but not required.

[glob]: https://www.npmjs.com/package/glob
[js-yaml]: https://www.npmjs.com/package/js-yaml
[namespace]: https://www.typescriptlang.org/docs/handbook/namespaces.html
[npm-run-all]: https://www.npmjs.com/package/npm-run-all
[openapi-format]: https://swagger.io/specification/#data-types
[openapi-operationid]: https://swagger.io/specification/#operation-object
[openapi2]: https://swagger.io/specification/v2/
[openapi3]: https://swagger.io/specification
[prettier]: https://npmjs.com/prettier

### Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://pow.rs"><img src="https://avatars3.githubusercontent.com/u/1369770?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Drew Powers</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=dangodev" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dangodev" title="Documentation">📖</a> <a href="#infra-dangodev" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dangodev" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://smyrdek.com"><img src="https://avatars1.githubusercontent.com/u/6187417?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Przemek Smyrdek</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=psmyrdek" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=psmyrdek" title="Documentation">📖</a> <a href="#ideas-psmyrdek" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=psmyrdek" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://danielenman.com"><img src="https://avatars3.githubusercontent.com/u/432487?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dan Enman</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aenmand" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=enmand" title="Code">💻</a></td>
    <td align="center"><a href="http://atlefren.net"><img src="https://avatars2.githubusercontent.com/u/1829927?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Atle Frenvik Sveen</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=atlefren" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=atlefren" title="Documentation">📖</a> <a href="#ideas-atlefren" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=atlefren" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://www.timdewolf.com"><img src="https://avatars0.githubusercontent.com/u/4455209?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tim de Wolf</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tpdewolf" title="Code">💻</a> <a href="#ideas-tpdewolf" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/tombarton"><img src="https://avatars1.githubusercontent.com/u/6222711?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tom Barton</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tombarton" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tombarton" title="Documentation">📖</a> <a href="#ideas-tombarton" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tombarton" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://www.viig.no"><img src="https://avatars0.githubusercontent.com/u/1080888?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sven Nicolai Viig</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asvnv" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=svnv" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=svnv" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://toot.cafe/@sorin"><img src="https://avatars1.githubusercontent.com/u/2109702?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sorin Davidoi</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asorin-davidoi" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=sorin-davidoi" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=sorin-davidoi" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/scvnathan"><img src="https://avatars3.githubusercontent.com/u/73474?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nathan Schneirov</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=scvnathan" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=scvnathan" title="Documentation">📖</a> <a href="#ideas-scvnathan" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=scvnathan" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://lbenie.xyz/"><img src="https://avatars1.githubusercontent.com/u/7316046?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Lucien Bénié</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=lbenie" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=lbenie" title="Documentation">📖</a> <a href="#ideas-lbenie" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=lbenie" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://boris.sh"><img src="https://avatars1.githubusercontent.com/u/17952318?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Boris K</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=bokub" title="Documentation">📖</a></td>
    <td align="center"><a href="https://twitter.com/antonk52"><img src="https://avatars1.githubusercontent.com/u/5817809?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anton</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aantonk52" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=antonk52" title="Code">💻</a> <a href="#ideas-antonk52" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=antonk52" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/tshelburne"><img src="https://avatars3.githubusercontent.com/u/1202267?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tim Shelburne</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=tshelburne" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=tshelburne" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://typeofweb.com"><img src="https://avatars0.githubusercontent.com/u/1338731?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michał Miszczyszyn</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mmiszy" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/skh-"><img src="https://avatars1.githubusercontent.com/u/1292598?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sam K Hall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=skh-" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=skh-" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/BlooJeans"><img src="https://avatars2.githubusercontent.com/u/1751182?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matt Jeanes</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=BlooJeans" title="Code">💻</a></td>
    <td align="center"><a href="https://www.selbekk.io"><img src="https://avatars1.githubusercontent.com/u/1307267?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kristofer Giltvedt Selbekk</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=selbekk" title="Code">💻</a></td>
    <td align="center"><a href="https://mause.me"><img src="https://avatars2.githubusercontent.com/u/1405026?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Elliana May</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Mause" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Mause" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/henhal"><img src="https://avatars3.githubusercontent.com/u/9608258?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Henrik Hall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://dev.to/gr2m"><img src="https://avatars3.githubusercontent.com/u/39992?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gregor Martynus</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=gr2m" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=gr2m" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Agr2m" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://samn.co.uk"><img src="https://avatars2.githubusercontent.com/u/408983?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sam Mesterton-Gibbons</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=samdbmg" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asamdbmg" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=samdbmg" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://rendall.dev"><img src="https://avatars2.githubusercontent.com/u/293263?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rendall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=rendall" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Arendall" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=rendall" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://massaioli.wordpress.com"><img src="https://avatars3.githubusercontent.com/u/149178?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Robert Massaioli</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=robertmassaioli" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Arobertmassaioli" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://jankuca.com"><img src="https://avatars3.githubusercontent.com/u/367262?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jan Kuča</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=jankuca" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=jankuca" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/th-m"><img src="https://avatars3.githubusercontent.com/u/13792029?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Thomas Valadez</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=th-m" title="Documentation">📖</a></td>
    <td align="center"><a href="https://asithadesilva.com"><img src="https://avatars1.githubusercontent.com/u/3814354?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Asitha de Silva</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=asithade" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aasithade" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/MikeYermolayev"><img src="https://avatars2.githubusercontent.com/u/8783498?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mikhail Yermolayev</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AMikeYermolayev" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/radist2s"><img src="https://avatars.githubusercontent.com/u/725645?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alex Batalov</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=radist2s" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=radist2s" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/FedeBev"><img src="https://avatars.githubusercontent.com/u/22151395?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Federico Bevione</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AFedeBev" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FedeBev" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FedeBev" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/yamacent"><img src="https://avatars.githubusercontent.com/u/8544439?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Daisuke Yamamoto</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=yamacent" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Ayamacent" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=yamacent" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/dnalborczyk"><img src="https://avatars.githubusercontent.com/u/2903325?v=4?s=100" width="100px;" alt=""/><br /><sub><b>dnalborczyk</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=dnalborczyk" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dnalborczyk" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dnalborczyk" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/FabioWanner"><img src="https://avatars.githubusercontent.com/u/46821078?v=4?s=100" width="100px;" alt=""/><br /><sub><b>FabioWanner</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AFabioWanner" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FabioWanner" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=FabioWanner" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://www.ashsmith.io"><img src="https://avatars.githubusercontent.com/u/1086841?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ash Smith</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ashsmith" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aashsmith" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=ashsmith" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://mehalter.com"><img src="https://avatars.githubusercontent.com/u/1591837?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Micah Halter</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mehalter" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=mehalter" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Amehalter" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/Chrg1001"><img src="https://avatars.githubusercontent.com/u/40189653?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Yuto Yoshihara</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Chrg1001" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3AChrg1001" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Chrg1001" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/sharmarajdaksh"><img src="https://avatars.githubusercontent.com/u/33689528?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dakshraj Sharma</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=sharmarajdaksh" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/shuluster"><img src="https://avatars.githubusercontent.com/u/1707910?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Shaosu Liu</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=shuluster" title="Code">💻</a></td>
    <td align="center"><a href="https://vytenis.kuciauskas.lt"><img src="https://avatars.githubusercontent.com/u/468006?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vytenis</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=FDiskas" title="Code">💻</a></td>
    <td align="center"><a href="http://www.zornwebdev.com"><img src="https://avatars.githubusercontent.com/u/22532542?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Eric Zorn</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ericzorn93" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=ericzorn93" title="Tests">⚠️</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=ericzorn93" title="Documentation">📖</a></td>
    <td align="center"><a href="https://www.mbelsky.com/"><img src="https://avatars.githubusercontent.com/u/3923527?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Max Belsky</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=mbelsky" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Ambelsky" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/Peteck"><img src="https://avatars.githubusercontent.com/u/1520592?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Peter Bech</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Peteck" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3APeteck" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://rusty.today"><img src="https://avatars.githubusercontent.com/u/731941?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rusty Conover</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=rustyconover" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/bunkscene"><img src="https://avatars.githubusercontent.com/u/2693678?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dave Carlson</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=bunkscene" title="Code">💻</a></td>
    <td align="center"><a href="https://ottomated.net"><img src="https://avatars.githubusercontent.com/u/31470743?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ottomated</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ottomated" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aottomated" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://karanarqq.dev"><img src="https://avatars.githubusercontent.com/u/28733669?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Artem Shuvaev</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=sadfsdfdsa" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Asadfsdfdsa" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/ajaishankar"><img src="https://avatars.githubusercontent.com/u/328008?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ajaishankar</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=ajaishankar" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.dominikdosoudil.cz"><img src="https://avatars.githubusercontent.com/u/15929942?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dominik Dosoudil</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=dominikdosoudil" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=dominikdosoudil" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://kgtkr.net/"><img src="https://avatars.githubusercontent.com/u/17868838?v=4?s=100" width="100px;" alt=""/><br /><sub><b>tkr</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=kgtkr" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=kgtkr" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/berzi"><img src="https://avatars.githubusercontent.com/u/32619123?v=4?s=100" width="100px;" alt=""/><br /><sub><b>berzi</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=berzi" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=berzi" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=berzi" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://philip-trauner.me"><img src="https://avatars.githubusercontent.com/u/9287847?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Philip Trauner</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=PhilipTrauner" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=PhilipTrauner" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=PhilipTrauner" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://powell-v2.github.io/"><img src="https://avatars.githubusercontent.com/u/25308326?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Pavel Yermolin</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=Powell-v2" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Powell-v2" title="Documentation">📖</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=Powell-v2" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://www.duncanbeevers.com"><img src="https://avatars.githubusercontent.com/u/7367?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Duncan Beevers</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=duncanbeevers" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/issues?q=author%3Aduncanbeevers" title="Bug reports">🐛</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=duncanbeevers" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!
