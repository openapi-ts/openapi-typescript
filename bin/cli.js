#!/usr/bin/env node

const { writeFileSync } = require('fs');
const { mkdirpSync } = require('fs-extra');
const chalk = require('chalk');
const { dirname, resolve } = require('path');
const meow = require('meow');
const { default: swaggerToTS } = require('../dist-node');
const { loadSpec } = require('./loaders');

const cli = meow(
  `Usage
  $ swagger-to-ts [input] [options]

Options
  --help                display this
  --output, -o          specify output file
`,
  {
    flags: {
      output: {
        type: 'string',
        alias: 'o',
      },
    },
  }
);

const pathToSpec = cli.input[0];
const timeStart = process.hrtime();

(async () => {
  let spec = '';
  try {
    spec = await loadSpec(pathToSpec);
  } catch (e) {
    console.error(chalk.red(`❌ "${e}"`));
  }

  const result = swaggerToTS(spec);

  // Write to file if specifying output
  if (cli.flags.output) {
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
