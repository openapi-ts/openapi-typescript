const { existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const { rollup } = require('rollup');
const typescript = require('rollup-plugin-typescript');
const { terser } = require('rollup-plugin-terser');

// Settings
const OUTPUT_DIR = 'dist';
const PLUGINS = {
  cjs: [typescript(), terser()],
  esm: [typescript()],
};

// Rollup Config
const output = resolve(__dirname, '..', OUTPUT_DIR);
if (!existsSync(output)) {
  mkdirSync(output);
}

// Build JS
const build = format =>
  rollup({
    input: `./src/index.ts`,
    plugins: PLUGINS[format],
  }).then(bundle =>
    bundle.write({
      file: resolve(output, `${format}.js`),
      format,
      name: 'graphqlGen',
    })
  );

// Build Module Types
build('cjs');
build('esm');
