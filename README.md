[![version (scoped)](https://img.shields.io/npm/v/@manifoldco/swagger-to-ts.svg)](https://www.npmjs.com/package/@manifoldco/swagger-to-ts)

Convert Swagger files to TypeScript interfaces using Node.js. This uses
[Prettier][prettier] to prettify the interfaces.

### Installation

```shell
npm i --save-dev @manifoldco/swagger-to-ts
```

### Usage

The function takes 2 parameters: a **filepath** to a JSON file, and a
**namespace** for the API. Namespace is required because it’s very likely
entities within the Swagger spec will collide with some other type in your
system, but you still want to access something predictably-named.

```js
const swaggerToTS = require('swagger-to-ts');

const filepath = './path/to/my/file.json';
const namespace = 'MySpec';
const typeData = swaggerToJS(filepath, namespace);
```

#### From Swagger JSON

```js
const { readFileSync, writeFileSync } = require('fs');
const swaggerToTS = require('swagger-to-ts');

const file = './spec/swagger.json';
const typeData = swaggerToTS(readFileSync(file, 'UTF-8'), 'MySpec');
writeFileSync('./types/swagger.ts', typeData);
```

#### From Swagger YAML

Swagger files must be passed to `swaggerToTS()` in a JSON format, so you’ll
have to configure that part yourself using [js-yaml][js-yaml] or something
similar.

```js
const { readFileSync, writeFileSync } = require('fs');
const yaml = require('js-yaml');

const file = './spec/swagger.yaml';
const json = yaml.safeLoad(fs.readFileSync(file, 'UTF-8'));
const typeData = swaggerToTS(json, 'MySpec');
writeFileSync('./types/swagger.ts', typeData);
```

#### Generating multiple files

The [glob][glob] package is helpful in converting entire folders. The
renaming & mapping is up to you!

```js
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const glob = require('glob');
const swaggerToTS = require('swagger-to-ts');

const source1 = glob.sync('./swaggerspec/v1/**/*.yaml');
const source2 = glob.sync('./swaggerspec/v2/**/*.yaml');

[...source1, ...source2].forEach(file => {
  const basename = path.basename(file);
  const filename = basename.replace(/\.ya?ml$/i, '.ts');
  const json = yaml.safeLoad(readFileSync(file, 'UTF-8'));
  const typeData = swaggerToTS(json, basename);
  writeFileSync(path.resolve(__dirname, 'types', filename), typeData);
});
```

#### Fancy Console Messages

Using the [chalk][chalk] package you can spice up the console message a little:

```js
const { readFileSync, writeFileSync } = require('fs');
const chalk = require('chalk');
const swaggerToTS = require('swagger-to-ts');

const file = './spec/swagger.json';

console.log('🏗 Generating types…');
const timeStart = process.hrtime();

const typeData = swaggerToTS(readFileSync(file, 'UTF-8'), 'MySpec');
writeFileSync('./types/swagger.ts'), typeData);

const timeEnd = process.hrtime(timeStart);
console.log(
  chalk.green(
    `Done generating types in ${chalk.bold(timeEnd[0] + Math.round(timeEnd[1] / 1000000))}ms`
  )
);
```

This will output something like the following:

```shell
🏗 Generating types…
Done generating types in 212ms
```

### Using in TypeScript project

It’s recommended to name the file `*.ts` and `import` the definitions. `*.d.ts`
can’t be imported; they’re meant to be shipped alongside modules.

```js
import { Swagger } from '../types/swagger';

const logIn = (user: Swagger.User) => {
  // …
```

TypeScript would much rather have you ship `*.d.ts` files as part of an
existing package, but sometimes that’s not possible when it comes to Swagger
specs. `import`-ing everything like this isn’t ideal, but it’s better than
not using static typing at all!

### Node Scripts

Setting this up to auto-run in a Node script is ideal. For instance, if you
ship Swagger specs as part of a node package, and you want to regenerate the
types on `postinstall`, you can specify that in your `package.json`:

```js
  "scripts": {
    "generate:types": "node scripts/generateTypesFromSwagger",
    "postinstall": "npm run generate:types",
  },
```

In this example, `scripts/generateTypesFromSwagger` is a JS file you’ve manually
created from one of the examples above, customized to fit your needs.

[chalk]: https://www.npmjs.com/package/chalk
[glob]: https://npmjs.com/glob
[js-yaml]: https://npmjs.com/js-yaml
[prettier]: https://npmjs.com/prettier
