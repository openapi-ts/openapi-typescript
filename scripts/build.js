const { existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const { rollup } = require('rollup');
const babel = require('rollup-plugin-babel');
const { terser } = require('rollup-plugin-terser');

if (!existsSync('dist')) {
  mkdirSync(resolve(__dirname, 'dist'));
}

rollup({
  input: './src/swaggerToTS.js',
  plugins: [babel(), terser()],
}).then(bundle =>
  bundle.write({
    file: `./dist/swaggerToTS.js`,
    format: 'cjs',
    name: 'SwaggerToTS',
  })
);
