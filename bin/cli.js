#!/usr/bin/env node

const fs = require("fs");
const { bold, green, red } = require("kleur");
const path = require("path");
const meow = require("meow");
const { default: swaggerToTS } = require("../dist-node");
const { loadSpec } = require("./loaders");

const cli = meow(
  `Usage
  $ openapi-typescript [input] [options]

Options
  --help                display this
  --output, -o          (optional) specify output file (default: stdout)
  --prettier-config     (optional) specify path to Prettier config file
  --raw-schema          (optional) Read from raw schema instead of document
  --version             (optional) Schema version (must be present for raw schemas)
`,
  {
    flags: {
      output: {
        type: "string",
        alias: "o",
      },
      prettierConfig: {
        type: "string",
      },
      rawSchema: {
        type: "boolean",
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

  // 1. input
  let spec = undefined;
  try {
    spec = await loadSpec(pathToSpec, { log: output !== "STDOUT" });
  } catch (err) {
    process.exitCode = 1; // needed for async functions
    throw new Error(red(`❌ ${err}`));
  }

  // 2. generate schema (the main part!)
  const result = swaggerToTS(spec, {
    prettierConfig: cli.flags.prettierConfig,
    rawSchema: cli.flags.rawSchema,
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
