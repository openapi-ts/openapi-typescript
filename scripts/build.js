const { existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const { rollup } = require('rollup');
const typescript = require('rollup-plugin-typescript');
const { terser } = require('rollup-plugin-terser');

if (!existsSync('dist')) {
  mkdirSync(resolve(__dirname, 'dist'));
}

rollup({
  input: './src/index.ts',
  plugins: [typescript(), terser()],
}).then(bundle =>
  bundle.write({
    file: './dist/index.js',
    format: 'cjs',
    name: 'SwaggerToTS',
  })
);
