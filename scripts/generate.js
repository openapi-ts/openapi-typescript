const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { resolve, sep } = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const swaggerToGQL = require('../dist'); // replace with: require('@manifoldco/swagger-to-graphql')

// 1. Load all YAML files from a certain directory
glob(
  './spec/**/*.yaml',
  { root: resolve(__dirname, '..') },
  (error, matches) => {
    if (error) {
      console.error('No files found');
      return;
    }

    if (typeof matches === 'string') {
      generate(matches);
      return;
    }

    matches.forEach(file => generate(file));
  }
);

// 2. Convert to GraphQL types, write to `./types` folder.
function generate(file) {
  const source = resolve(__dirname, '..', file);
  const segments = source.split(sep);
  const dirname = segments[segments.length - 2];
  const basename = segments[segments.length - 1].replace(/\.yaml$/i, '.ts');

  const output = resolve(__dirname, '..', 'types', dirname);
  if (!existsSync(output)) {
    mkdirSync(output);
  }

  const schema = swaggerToGQL(
    yaml.safeLoad(readFileSync(source, 'UTF-8')),
    dirname
  );
  writeFileSync(resolve(output, basename), schema);
}
