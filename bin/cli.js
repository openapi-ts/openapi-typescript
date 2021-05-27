#!/usr/bin/env node

const fs = require("fs");
const { bold, green, red } = require("kleur");
const path = require("path");
const meow = require("meow");
const { default: openapiTS } = require("../dist/cjs/index.js");
const { loadSpec } = require("./loaders");

const cli = meow(
  `Usage
  $ openapi-typescript [input] [options]

Options
  --help                       display this
  --output, -o                 Specify output file (default: stdout)
  --auth                       (optional) Provide an authentication token for private URL
  --immutable-types, -it       (optional) Generates immutable types (readonly properties and readonly array)
  --additional-properties, -ap (optional) Allow arbitrary properties for all schema objects without "additionalProperties: false"
  --prettier-config, -c        (optional) specify path to Prettier config file
  --raw-schema                 (optional) Parse as partial schema (raw components)
  --split-schema, -s           (optional) Split the schema into requestSchema and responseSchema to support readOnly/writeOnly
  --version                    (optional) Force schema parsing version
`,
  {
    flags: {
      output: {
        type: "string",
        alias: "o",
      },
      auth: {
        type: "string",
      },
      immutableTypes: {
        type: "boolean",
        alias: "it",
      },
      additionalProperties: {
        type: "boolean",
        alias: "ap",
      },
      prettierConfig: {
        type: "string",
        alias: "c",
      },
      rawSchema: {
        type: "boolean",
      },
      splitSchema: {
        type: "boolean",
        alias: "s",
      },
      version: {
        type: "number",
      },
    },
  }
);

const timeStart = process.hrtime();

async function main() {
  let output = "FILE"; // FILE or STDOUT
  const pathToSpec = cli.input[0];

  // 0. setup
  if (!cli.flags.output) {
    output = "STDOUT"; // if --output not specified, fall back to stdout
  }
  if (output === "FILE") {
    console.info(bold(`✨ openapi-typescript ${require("../package.json").version}`)); // only log if we’re NOT writing to stdout
  }
  if (cli.flags.rawSchema && !cli.flags.version) {
    throw new Error(`--raw-schema requires --version flag`);
  }

  // 1. input
  let spec = undefined;
  try {
    spec = await loadSpec(pathToSpec, {
      auth: cli.flags.auth,
      log: output !== "STDOUT",
    });
  } catch (err) {
    process.exitCode = 1; // needed for async functions
    throw new Error(red(`❌ ${err}`));
  }

  // 2. generate schema (the main part!)
  const result = openapiTS(spec, {
    auth: cli.flags.auth,
    additionalProperties: cli.flags.additionalProperties,
    immutableTypes: cli.flags.immutableTypes,
    prettierConfig: cli.flags.prettierConfig,
    rawSchema: cli.flags.rawSchema,
    splitSchema: cli.flags.splitSchema,
    version: cli.flags.version,
  });

  // 3. output
  if (output === "FILE") {
    // output option 1: file
    const outputFile = path.resolve(process.cwd(), cli.flags.output);

    // recursively create parent directories if they don’t exist
    const parentDirs = cli.flags.output.split(path.sep);
    for (var i = 1; i < parentDirs.length; i++) {
      const dir = path.resolve(process.cwd(), ...parentDirs.slice(0, i));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    }

    fs.writeFileSync(outputFile, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(green(`🚀 ${pathToSpec} -> ${bold(cli.flags.output)} [${time}ms]`));
  } else {
    // output option 2: stdout
    process.stdout.write(result);
  }

  return result;
}

main();
