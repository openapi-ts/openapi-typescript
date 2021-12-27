#!/usr/bin/env node

const fs = require("fs");
const { bold, green, red } = require("kleur");
const meow = require("meow");
const path = require("path");
const glob = require("tiny-glob");
const { default: openapiTS } = require("../dist/cjs/index.js");

const cli = meow(
  `Usage
  $ openapi-typescript [input] [options]

Options
  --help                       display this
  --output, -o                 Specify output file (default: stdout)
  --auth                       (optional) Provide an authentication token for private URL
  --headersObject, -h          (optional) Provide a JSON object as string of HTTP headers for remote schema request
  --header, -x                 (optional) Provide an array of or singular headers as an alternative to a JSON object. Each header must follow the key: value pattern
  --httpMethod, -m             (optional) Provide the HTTP Verb/Method for fetching a schema from a remote URL
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
      headersObject: {
        type: "string",
        alias: "h",
      },
      header: {
        type: "string",
        alias: "x",
        isMultiple: true,
      },
      httpMethod: {
        type: "string",
        alias: "m",
        default: "GET",
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

  // Parse incoming headers from CLI flags
  let httpHeaders = {};
  // prefer --headersObject if specified
  if (cli.flags.headersObject) {
    httpHeaders = JSON.parse(cli.flags.headersObject); // note: this will generate a recognizable error for the user to act on
  }
  // otherwise, parse --header
  else if (Array.isArray(cli.flags.header)) {
    cli.flags.header.forEach((header) => {
      const firstColon = header.indexOf(":");
      const k = header.substring(0, firstColon).trim();
      const v = header.substring(firstColon + 1).trim();
      httpHeaders[k] = v;
    });
  }

  // generate schema
  const result = await openapiTS(pathToSpec, {
    additionalProperties: cli.flags.additionalProperties,
    auth: cli.flags.auth,
    defaultNonNullable: cli.flags.defaultNonNullable,
    immutableTypes: cli.flags.immutableTypes,
    prettierConfig: cli.flags.prettierConfig,
    rawSchema: cli.flags.rawSchema,
    silent: output === OUTPUT_STDOUT,
    version: cli.flags.version,
    httpHeaders,
    httpMethod: cli.flags.httpMethod,
  });

  // output
  if (output === OUTPUT_FILE) {
    let outputFilePath = path.resolve(process.cwd(), cli.flags.output); // note: may be directory
    const isDir = fs.existsSync(outputFilePath) && fs.lstatSync(outputFilePath).isDirectory();
    if (isDir) {
      const filename = pathToSpec.replace(new RegExp(`${path.extname(pathToSpec)}$`), ".ts");
      outputFilePath = path.join(outputFilePath, filename);
    }

    fs.writeFileSync(outputFilePath, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(green(`🚀 ${pathToSpec} -> ${bold(outputFilePath)} [${time}ms]`));
  } else {
    process.stdout.write(result);
    // if stdout, (still) don’t log anything to console!
  }

  return result;
}

async function main() {
  let output = cli.flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT
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
    if (output !== "." && output === OUTPUT_FILE) fs.mkdirSync(path.dirname(cli.flags.output), { recursive: true });
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

  // generate schema(s) in parallel
  await Promise.all(
    inputSpecPaths.map(async (specPath) => {
      if (cli.flags.output !== "." && output === OUTPUT_FILE) {
        let outputDir = path.resolve(process.cwd(), cli.flags.output);
        if (isGlob) {
          outputDir = path.resolve(outputDir, path.dirname(specPath)); // globs: use output dir + spec dir
        } else {
          outputDir = path.dirname(outputDir); // single files: just use output parent dir
        }
        fs.mkdirSync(outputDir, { recursive: true }); // recursively make parent dirs
      }
      await generateSchema(specPath);
    })
  );
}

main();
