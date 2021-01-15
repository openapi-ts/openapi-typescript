[![version(scoped)](https://img.shields.io/npm/v/openapi-typescript.svg)](https://www.npmjs.com/package/openapi-typescript)
[![npm downloads (weekly)](https://img.shields.io/npm/dw/openapi-typescript)](https://www.npmjs.com/package/openapi-typescript)
[![codecov](https://codecov.io/gh/drwpow/openapi-typescript/branch/master/graph/badge.svg)](https://codecov.io/gh/drwpow/openapi-typescript)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-27-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# 📘️ openapi-typescript

🚀 Convert [OpenAPI 3.0][openapi3] and [2.0 (Swagger)][openapi2] schemas to TypeScript interfaces using Node.js.

💅 The output is prettified with [Prettier][prettier] (and can be customized!).

👉 Works for both local and remote resources (filesystem and HTTP).

View examples:

- [Stripe, OpenAPI 2.0](./examples/stripe-openapi2.ts)
- [Stripe, OpenAPI 3.0](./examples/stripe-openapi3.ts)

## Usage

### CLI

#### 🗄️ Reading specs from file system

```bash
npx openapi-typescript schema.yaml --output schema.ts

# 🤞 Loading spec from tests/v2/specs/stripe.yaml…
# 🚀 schema.yaml -> schema.ts [250ms]
```

#### ☁️ Reading specs from remote resource

```bash
npx openapi-typescript https://petstore.swagger.io/v2/swagger.json --output petstore.ts

# 🤞 Loading spec from https://petstore.swagger.io/v2/swagger.json…
# 🚀 https://petstore.swagger.io/v2/swagger.json -> petstore.ts [650ms]
```

_Thanks to @psmyrdek for the remote spec feature!_

#### Using in TypeScript

Import any top-level item from the generated spec to use it. It works best if you also alias types to save on typing:

```ts
import { components } from './generated-schema.ts';

type APIResponse = components["schemas"]["APIResponse"];
```

The reason for all the `["…"]` everywhere is because OpenAPI lets you use more characters than are valid TypeScript identifiers. The goal of this project is to generate _all_ of your schema, not merely the parts that are “TypeScript-safe.”

Also note that there’s a special `operations` interface that you can import `OperationObjects` by their [operationId][openapi-operationid]:

```ts
import { operations } from './generated-schema.ts';

type getUsersById = operations["getUsersById"];
```

This is the only place where our generation differs from your schema as-written, but it’s done so as a convenience and shouldn’t cause any issues (you can still use deep references as-needed).

_Thanks to @gr2m for the operations feature!_

#### Outputting to `stdout`

```bash
npx openapi-typescript schema.yaml
```

#### Generating multiple schemas

In your `package.json`, for each schema you’d like to transform add one `generate:specs:[name]` npm-script. Then combine
them all into one `generate:specs` script, like so:

```json
"scripts": {
  "generate:specs": "npm run generate:specs:one && npm run generate:specs:two && npm run generate:specs:three",
  "generate:specs:one": "npx openapi-typescript one.yaml -o one.ts",
  "generate:specs:two": "npx openapi-typescript two.yaml -o two.ts",
  "generate:specs:three": "npx openapi-typescript three.yaml -o three.ts"
}
```

If you use [npm-run-all][npm-run-all], you can shorten this:

```json
"scripts": {
  "generate:specs": "run-p generate:specs:*",
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
| `--raw-schema`                 |       | `false`  | Generate TS types from partial schema (e.g. having `components.schema` at the top level) |

### Node

```bash
npm i --save-dev openapi-typescript
```

```js
const { readFileSync } = require("fs");
const swaggerToTS = require("openapi-typescript").default;

const input = JSON.parse(readFileSync("spec.json", "utf8")); // Input can be any JS object (OpenAPI format)
const output = swaggerToTS(input); // Outputs TypeScript defs as a string (to be parsed, or written to a file)
```

The Node API is a bit more flexible: it will only take a JS object as input (OpenAPI format), and return a string of TS
definitions. This lets you pull from any source (a Swagger server, local files, etc.), and similarly lets you parse,
post-process, and save the output anywhere.

If your specs are in YAML, you’ll have to convert them to JS objects using a library such as [js-yaml][js-yaml]. If
you’re batching large folders of specs, [glob][glob] may also come in handy.

## Migrating from v1 to v2

[Migrating from v1 to v2](./docs/migrating-from-v1.md)

## Project Goals

1. Support converting any OpenAPI 3.0 or 2.0 (Swagger) schema to TypeScript types, no matter how complicated
1. The generated TypeScript types **must** match your schema as closely as possible (i.e. don’t convert names to
   `PascalCase` or follow any TypeScript-isms; faithfully reproduce your schema as closely as possible, capitalization
   and all)
1. This library is a TypeScript generator, not a schema validator.

## Contributing

PRs are welcome! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) guide. Opening an issue beforehand to discuss is
encouraged but not required.

[glob]: https://www.npmjs.com/package/glob
[js-yaml]: https://www.npmjs.com/package/js-yaml
[namespace]: https://www.typescriptlang.org/docs/handbook/namespaces.html
[npm-run-all]: https://www.npmjs.com/package/npm-run-all
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
    <td align="center"><a href="https://github.com/henhal"><img src="https://avatars3.githubusercontent.com/u/9608258?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Henrik Hall</b></sub></a><br /><a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Code">💻</a> <a href="https://github.com/drwpow/openapi-typescript/commits?author=henhal" title="Documentation">📖</a></td>
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
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!
