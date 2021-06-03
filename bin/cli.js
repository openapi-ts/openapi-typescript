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
    let outputFile = path.resolve(process.cwd(), cli.flags.output); // note: may be directory
    const isDir = fs.existsSync(outputFile) && fs.lstatSync(outputFile).isDirectory();
    if (isDir) {
      const filename = pathToSpec.replace(new RegExp(`${path.extname(pathToSpec)}$`), ".ts");
      outputFile = path.join(outputFile, filename);
    }

    await fs.promises.writeFile(outputFile, result, "utf8");

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

  if (output === OUTPUT_FILE) {
    console.info(bold(`✨ openapi-typescript ${require("../package.json").version}`)); // only log if we’re NOT writing to stdout
  }

  // error: --raw-schema
  if (cli.flags.rawSchema && !cli.flags.version) {
    throw new Error(`--raw-schema requires --version flag`);
  }

  // handle remote schema, exit
  if (/^https?:\/\//.test(pathToSpec)) {
    if (output !== "." && output === OUTPUT_FILE)
      await fs.promises.mkdir(path.dirname(cli.flags.output), { recursive: true });
    await generateSchema(pathToSpec);
    return;
  }

  // handle local schema(s)
  const inputSpecPaths = await glob(pathToSpec, { filesOnly: true });
  const isGlob = inputSpecPaths.length > 1;

  // error: no matches for glob
  if (inputSpecPaths.length === 0) {
    errorAndExit(`❌ Could not find any specs matching "${pathToSpec}". Please check that the path is correct.`);
  }

  // error: tried to glob output to single file
  if (isGlob && output === OUTPUT_FILE && fs.existsSync(cli.flags.output) && fs.lstatSync(cli.flags.output).isFile()) {
    errorAndExit(`❌ Expected directory for --output if using glob patterns. Received "${cli.flags.output}".`);
  }

  // generate schema(s)
  await Promise.all(
    inputSpecPaths.map(async (specPath) => {
      if (cli.flags.output !== "." && output === OUTPUT_FILE) {
        let outputDir = path.join(process.cwd(), cli.flags.output);
        if (!isGlob) outputDir = path.dirname(outputDir); // use output dir for glob; use parent dir for single files
        await fs.promises.mkdir(path.join(outputDir, path.dirname(specPath)), { recursive: true }); // recursively make parent dirs
      }
      await generateSchema(specPath);
    })
  );
}

main();
