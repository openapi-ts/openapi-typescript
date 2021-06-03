#!/usr/bin/env node

const fs = require("fs");
const { bold, green, red } = require("kleur");
const path = require("path");
const meow = require("meow");
const glob = require("tiny-glob");
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
  --default-non-nullable       (optional) If a schema object has a default value set, don’t mark it as nullable
  --prettier-config, -c        (optional) specify path to Prettier config file
  --raw-schema                 (optional) Parse as partial schema (raw components)
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
      defaultNonNullable: {
        type: "boolean",
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
      version: {
        type: "number",
      },
    },
  }
);

const OUTPUT_FILE = "FILE";
const OUTPUT_STDOUT = "STDOUT";

const timeStart = process.hrtime();

function errorAndExit(errorMessage) {
  process.exitCode = 1; // needed for async functions
  throw new Error(red(errorMessage));
}

async function generateSchema(pathToSpec) {
  const output = cli.flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT

  // load spec
  let spec = undefined;
  try {
    spec = await loadSpec(pathToSpec, {
      auth: cli.flags.auth,
      log: output !== OUTPUT_STDOUT,
    });
  } catch (err) {
    errorAndExit(`❌ ${err}`);
  }

  // generate schema
  const result = openapiTS(spec, {
    auth: cli.flags.auth,
    additionalProperties: cli.flags.additionalProperties,
    immutableTypes: cli.flags.immutableTypes,
    defaultNonNullable: cli.flags.defaultNonNullable,
    prettierConfig: cli.flags.prettierConfig,
    rawSchema: cli.flags.rawSchema,
    version: cli.flags.version,
  });

  // output
  if (output === OUTPUT_FILE) {
    let outputFile = path.resolve(process.cwd(), cli.flags.output);

    // decide filename if outputFile is a directory
    if (fs.existsSync(outputFile) && fs.lstatSync(outputFile).isDirectory()) {
      const basename = path.basename(pathToSpec).split(".").slice(0, -1).join(".") + ".ts";
      outputFile = path.resolve(outputFile, basename);
    }

    fs.writeFileSync(outputFile, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(green(`🚀 ${pathToSpec} -> ${bold(outputFile)} [${time}ms]`));
  } else {
    process.stdout.write(result);
  }

  return result;
}

async function main() {
  const output = cli.flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT
  const pathToSpec = cli.input[0];
  const inputSpecPaths = await glob(pathToSpec, { filesOnly: true });

  if (output === OUTPUT_FILE) {
    console.info(bold(`✨ openapi-typescript ${require("../package.json").version}`)); // only log if we’re NOT writing to stdout
  }

  if (cli.flags.rawSchema && !cli.flags.version) {
    throw new Error(`--raw-schema requires --version flag`);
  }

  if (/^https?:\/\//.test(pathToSpec)) {
    // handle remote resource input and exit
    return await generateSchema(pathToSpec);
  }

  //  no matches for glob
  if (inputSpecPaths.length === 0) {
    errorAndExit(
      `❌ Could not find any spec files matching the provided input path glob. Please check that the path is correct.`
    );
  }

  if (output === OUTPUT_FILE) {
    // recursively create parent directories if they don’t exist
    const parentDirs = cli.flags.output.split(path.sep);
    for (var i = 1; i < parentDirs.length; i++) {
      const dir = path.resolve(process.cwd(), ...parentDirs.slice(0, i));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    }
  }

  // if there are multiple specs, ensure that output is a directory
  if (inputSpecPaths.length > 1 && output === OUTPUT_FILE && !fs.lstatSync(cli.flags.output).isDirectory()) {
    errorAndExit(
      `❌ When specifying a glob matching multiple input specs, you must specify a directory for generated type definitions.`
    );
  }

  let result = "";
  for (const specPath of inputSpecPaths) {
    // append result returned for each spec
    result += await generateSchema(specPath);
  }

  return result;
}

main();
