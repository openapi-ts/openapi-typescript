[![version (scoped)](https://img.shields.io/npm/v/@manifoldco/swagger-to-ts.svg)](https://www.npmjs.com/package/@manifoldco/swagger-to-ts)

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

To compare actual generated output, see the [example](./example) folder.

## Usage

#### Basic example (CLI)

```bash
npx @manifoldco/swagger-to-ts schema.yaml --namespace OpenAPI --output schema.ts

# 🚀 schema.yaml -> schema.ts [2ms]
```

This will save a `schema.ts` file in the current folder under the TypeScript
[namespace][namespace] `OpenAPI` (namespaces are required because chances of
collision among specs is highly likely). The CLI can accept YAML or JSON for
the input file.

#### CamelCasing properties

You can also convert `snake_case` keys to `camelCase` by adding the
`--camelcase` flag:

```bash
npx @manifoldco/swagger-to-ts schema.yaml --camelcase --namespace OpenAPI --output schema.ts

# 🚀 schema.yaml -> schema.ts [2ms]
```

#### Generating multiple schemas

Say you have multiple schemas you need to parse. I’ve found the simplest way
to do that is just to use npm scripts. In your `package.json`, you can do
something like the following:

```json
"scripts": {
  "generate:specs": "npm run generate:specs:one && npm run generate:specs:two",
  "generate:specs:one": "npx @manifoldco/swagger-to-ts one.yaml -o one.ts",
  "generate:specs:two": "npx @manifoldco/swagger-to-ts two.yaml -o two.ts"
}
```

Rinse and repeat for more specs.

For anything more complicated or for generating specs more dynamically, you
can also use the Node API (below).

### Node

```bash
npm i --save-dev @manifoldco/swagger-to-ts
```

```js
const swaggerToTS = require('@manifoldco/swagger-to-ts');

swaggerToTS(spec, [options]);
```

`spec` must be in JSON format. For an example of converting YAML to JSON, see
the [generate.js](./scripts/generate.js) script.

### Options

| Name        | Default    | Description                                                                                          |
| :---------- | :--------- | :--------------------------------------------------------------------------------------------------- |
| `output`    | (stdout)   | Where should the output file be saved?                                                               |
| `namespace` | `OpenAPI2` | How should the output be namespaced? (namespacing is enforced as there’s a high chance of collision) |
| `camelcase` | `false`    | Convert `snake_case` properties to `camelCase`                                                       |
| `swagger`   | `2`        | Which Swagger version to use. Currently only supports `2`.                                           |

[namespace]: https://www.typescriptlang.org/docs/handbook/namespaces.html
[prettier]: https://npmjs.com/prettier
