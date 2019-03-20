[![version
(scoped)](https://img.shields.io/npm/v/@manifoldco/swagger-to-ts.svg)](https://www.npmjs.com/package/@manifoldco/swagger-to-ts)
[![codecov](https://codecov.io/gh/manifoldco/swagger-to-ts/branch/master/graph/badge.svg)](https://codecov.io/gh/manifoldco/swagger-to-ts)

# 📘️ swagger-to-ts

Convert Swagger files to TypeScript interfaces using Node.js.

💅 Prettifies output with [Prettier][prettier].

| OpenAPI Feature   | TypeScript equivalent |
| :---------------- | :-------------------: |
| `type: 'string'`  |       `string`        |
| `type: 'number'`  |       `number`        |
| `type: 'integer'` |       `number`        |
| `allOf`           | `TypeB extends TypeA` |
| `oneOf`           |   `TypeA \| TypeB`    |
| `required`        |    (not optional)     |
| `enum`            |     `'a' \| 'b'`      |

To compare actual generated output, see the [example](./example) folder.

## Usage

### CLI

```bash
npx @manifoldco/swagger-to-ts schema.yaml --namespace OpenAPI --output schema.ts

# 🚀 schema.yaml -> schema.ts [2ms]
```

This will save a `schema.ts` file in the current folder under the TypeScript
[namespace][namespace] `OpenAPI` (namespaces are required because chances of
collision among specs is highly likely). The CLI can accept YAML or JSON for
the input file.

#### CamelCasing properties

Within interfaces, you may want to convert `snake_case` properties to
`camelCase` by adding the `--camelcase` flag:

```bash
npx @manifoldco/swagger-to-ts schema.yaml --camelcase --namespace OpenAPI --output schema.ts

# 🚀 schema.yaml -> schema.ts [2ms]
```

#### Generating multiple schemas

Say you have multiple schemas you need to parse. I’ve found the simplest way
to do that is to use npm scripts. In your `package.json`, you can do
something like the following:

```json
"scripts": {
  "generate:specs": "npm run generate:specs:one && npm run generate:specs:two",
  "generate:specs:one": "npx @manifoldco/swagger-to-ts one.yaml -o one.ts",
  "generate:specs:two": "npx @manifoldco/swagger-to-ts two.yaml -o two.ts"
}
```

Rinse and repeat for more specs.

For anything more complicated, or for generating specs dynamically, you can
also use the Node API (below).

#### CLI Options

| Option                | Alias |  Default   | Description                                                                                          |
| :-------------------- | :---- | :--------: | :--------------------------------------------------------------------------------------------------- |
| `--output [location]` | `-o`  |  (stdout)  | Where should the output file be saved?                                                               |
| `--namespace [name]`  | `-n`  | `OpenAPI2` | How should the output be namespaced? (namespacing is enforced as there’s a high chance of collision) |
| `--swagger [version]` | `-s`  |    `2`     | Which Swagger version to use. Currently only supports `2`.                                           |
| `--camelcase`         | `-c`  |  `false`   | Convert `snake_case` properties to `camelCase`?                                                      |

### Node

```bash
npm i --save-dev @manifoldco/swagger-to-ts
```

```js
const { readFileSync } = require('fs');
const swaggerToTS = require('@manifoldco/swagger-to-ts');

const input = JSON.parse(readFileSync('spec.json', 'utf8')); // Input be any JS object (OpenAPI format)
const output = swaggerToTS(input, { namespace: 'MySpec' }); // Outputs TypeScript defs as a string (to be parsed, or written to a file)
```

The Node API is a bit more flexible: it will only take a JS object as input
(OpenAPI format), and return a string of TS definitions. This lets you pull
from any source (a Swagger server, local files, etc.), and similarly lets put
the output anywhere. It even allows for some post-processing in-between if
desired.

If you are working with local files, you’ll have to read/write files
yourself. Also, if your specs are in YAML, you’ll have to convert them to JS
objects. A library such as [js-yaml][js-yaml] does make this trivial, though!
Lastly, if you’re batching large folders of specs, [glob][glob] may also come
in handy.

#### Node Options

| Name        |   Type    |  Default   | Description                                                                                          |
| :---------- | :-------: | :--------: | :--------------------------------------------------------------------------------------------------- |
| `namespace` | `string`  | `OpenAPI2` | How should the output be namespaced? (namespacing is enforced as there’s a high chance of collision) |
| `swagger`   | `number`  |    `2`     | Which Swagger version to use. Currently only supports `2`.                                           |
| `camelcase` | `boolean` |  `false`   | Convert `snake_case` properties to `camelCase`                                                       |

[glob]: https://www.npmjs.com/package/glob
[js-yaml]: https://www.npmjs.com/package/js-yaml
[namespace]: https://www.typescriptlang.org/docs/handbook/namespaces.html
[prettier]: https://npmjs.com/prettier
