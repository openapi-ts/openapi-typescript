[![version (scoped)](https://img.shields.io/npm/v/@manifoldco/swagger-to-ts.svg)](https://www.npmjs.com/package/@manifoldco/swagger-to-ts)

# 📘️ swagger-to-ts

Convert Swagger files to TypeScript interfaces using Node.js.

💅 Prettifies output with [Prettier][prettier].

## Usage

### CLI

```bash
npx @manifoldco/swagger-to-ts schema.yaml --output schema.ts --namespace OpenAPI

# 🚀 schema.yaml -> schema.ts [2ms]
```

This will save a `schema.ts` file in the current folder under the TypeScript
[namespace][namespace] `OpenAPI`. The CLI can accept YAML or JSON for the
input file.

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
| `swagger`   | `2`        | Which Swagger version to use. Currently only supports `2`.                                           |

[namespace]: https://www.typescriptlang.org/docs/handbook/namespaces.html
[prettier]: https://npmjs.com/prettier
