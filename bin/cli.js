#!/usr/bin/env node

const { readFileSync, existsSync, writeFileSync } = require('fs');
const { mkdirpSync } = require('fs-extra');
const chalk = require('chalk');
const { dirname, resolve } = require('path');
const meow = require('meow');
const yaml = require('js-yaml');
const axios = require('axios');
const { default: swaggerToTS } = require('../dist-node');

const cli = meow(
  `
Usage
  $ swagger-to-ts [input] [options]

Options
  --help            display this
  --wrapper, -w     specify wrapper (default: "declare namespace OpenAPI2")
  --output, -o      specify output file
  --camelcase, -c   convert snake_case properties to camelCase (default: off)
  --swagger, -s     specify Swagger version (default: 2)
  --nowrapper -nw   disables rendering the wrapper
`,
  {
    flags: {
      camelcase: {
        type: 'boolean',
        default: false,
        alias: 'c',
      },
      wrapper: {
        type: 'string',
        default: 'declare namespace OpenAPI2',
        alias: 'w',
      },
      output: {
        type: 'string',
        alias: 'o',
      },
      swagger: {
        type: 'number',
        alias: 's',
      },
      namespace: {
        type: 'string',
        alias: 'n',
      },
      export: {
        type: 'boolean',
        alias: 'e',
      },
      nowrapper: {
        type: 'boolean',
        alias: 'nw',
      },
    },
  }
);
(async () => {
  let spec = cli.input[0];

  if (typeof cli.flags.namespace === 'string' && cli.flags.namespace.length > 0) {
    console.error(chalk.red('--namespace option is deprecated. Please use --wrapper instead.'));
    return;
  }

  if (cli.flags.export === true) {
    console.error(chalk.red('--export option is deprecated. Please use --wrapper instead.'));
    return;
  }

  // input is an url
  if (spec.startsWith('http')) {
    let response = await axios.get(spec, { headers: { 'Content-Type': 'text/plain' } });
    spec = response.data;
  }
  // If input is a file, load it
  else {
    const pathname = resolve(process.cwd(), spec);
    if (existsSync(pathname)) {
      spec = readFileSync(pathname, 'UTF-8');
    }
  }

  // Attempt to parse YAML
  try {
    if (/\.ya?ml$/i.test(spec) || spec[0] !== '{') {
      spec = yaml.safeLoad(spec);
    }
  } catch (e) {
    console.error(
      chalk.red(`❌ "${spec}" seems to be YAML, but it couldn’t be parsed.
  ${e}`)
    );
  }

  // Attempt to parse JSON
  try {
    if (typeof spec === 'string') {
      spec = JSON.parse(spec);
    }
  } catch (e) {
    console.error(
      chalk.red(`❌ Could not parse JSON for "${spec}." Is this a valid Swagger spec?
  ${e}`)
    );
  }

  if (cli.flags.nowrapper) {
    cli.flags.wrapper = false;
  }

  const result = swaggerToTS(spec, cli.flags);

  // Write to file if specifying output
  if (cli.flags.output) {
    const timeStart = process.hrtime();
    const outputFile = resolve(process.cwd(), cli.flags.output);
    const parent = dirname(outputFile);
    mkdirpSync(parent);
    writeFileSync(outputFile, result);

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(chalk.green(`🚀 ${cli.input[0]} -> ${chalk.bold(cli.flags.output)} [${time}ms]`));
    return;
  }

  // Otherwise, return result
  return result;
})();
