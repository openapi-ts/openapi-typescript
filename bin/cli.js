#!/usr/bin/env node

const { readFileSync, existsSync, writeFileSync } = require('fs');
const { mkdirpSync } = require('fs-extra');
const chalk = require('chalk');
const { dirname, resolve } = require('path');
const meow = require('meow');
const yaml = require('js-yaml');
const { default: swaggerToTS } = require('../dist-node');

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

let spec = cli.input[0];

const timeStart = process.hrtime();

// If input is a file, load it
const pathname = resolve(process.cwd(), spec);
if (existsSync(pathname)) {
  spec = readFileSync(pathname, 'UTF-8');
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
