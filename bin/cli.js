#!/usr/bin/env node

import fs from "fs";
import path from "path";
import glob from "tiny-glob";
import parser from "yargs-parser";
import openapiTS from "../dist/index.js";

const GREEN = "\u001b[32m";
const BOLD = "\u001b[1m";
const RESET = "\u001b[0m";

const HELP = `Usage
  $ openapi-typescript [input] [options]

Options
  --help                       display this
  --output, -o                 Specify output file (default: stdout)
  --auth                       (optional) Provide an authentication token for private URL
  --headersObject, -h          (optional) Provide a JSON object as string of HTTP headers for remote schema request
  --header, -x                 (optional) Provide an array of or singular headers as an alternative to a JSON object. Each header must follow the key: value pattern
  --httpMethod, -m             (optional) Provide the HTTP Verb/Method for fetching a schema from a remote URL
  --immutable-types, -it       (optional) Generates immutable types (readonly properties and readonly array)
  --content-never              (optional) If supplied, an omitted reponse \`content\` property will be generated as \`never\` instead of \`unknown\`
  --additional-properties, -ap (optional) Allow arbitrary properties for all schema objects without "additionalProperties: false"
  --default-non-nullable       (optional) If a schema object has a default value set, don’t mark it as nullable
  --prettier-config, -c        (optional) specify path to Prettier config file
  --raw-schema                 (optional) Parse as partial schema (raw components)
  --paths-enum, -pe            (optional) Generate an enum containing all API paths.
  --export-type                (optional) Export type instead of interface
  --support-array-length       (optional) Generate tuples using array minItems / maxItems
  --path-params-as-types       (optional) Substitute path parameter names with their respective types
  --version                    (optional) Force schema parsing version
`;

const OUTPUT_FILE = "FILE";
const OUTPUT_STDOUT = "STDOUT";

const timeStart = process.hrtime();

function errorAndExit(errorMessage) {
  process.exitCode = 1; // needed for async functions
  throw new Error(errorMessage);
}

const [, , input, ...args] = process.argv;
const flags = parser(args, {
  array: ["header"],
  boolean: [
    "defaultNonNullable",
    "immutableTypes",
    "contentNever",
    "rawSchema",
    "exportType",
    "supportArrayLength",
    "makePathsEnum",
    "pathParamsAsTypes",
  ],
  number: ["version"],
  string: ["auth", "header", "headersObject", "httpMethod", "prettierConfig"],
  alias: {
    additionalProperties: ["ap"],
    header: ["x"],
    headersObject: ["h"],
    httpMethod: ["m"],
    immutableTypes: ["it"],
    output: ["o"],
    prettierConfig: ["c"],
    makePathsEnum: ["pe"],
  },
  default: {
    httpMethod: "GET",
  },
});

async function generateSchema(pathToSpec) {
  const output = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT

  // Parse incoming headers from CLI flags
  let httpHeaders = {};

  // prefer --headersObject if specified
  if (flags.headersObject) {
    httpHeaders = JSON.parse(flags.headersObject); // note: this will generate a recognizable error for the user to act on
  }
  // otherwise, parse --header
  else if (Array.isArray(flags.header)) {
    flags.header.forEach((header) => {
      const firstColon = header.indexOf(":");
      const k = header.substring(0, firstColon).trim();
      const v = header.substring(firstColon + 1).trim();
      httpHeaders[k] = v;
    });
  }

  // generate schema
  const result = await openapiTS(pathToSpec, {
    additionalProperties: flags.additionalProperties,
    auth: flags.auth,
    defaultNonNullable: flags.defaultNonNullable,
    immutableTypes: flags.immutableTypes,
    prettierConfig: flags.prettierConfig,
    rawSchema: flags.rawSchema,
    makePathsEnum: flags.makePathsEnum,
    contentNever: flags.contentNever,
    silent: output === OUTPUT_STDOUT,
    version: flags.version,
    httpHeaders,
    httpMethod: flags.httpMethod,
    exportType: flags.exportType,
    supportArrayLength: flags.supportArrayLength,
    pathParamsAsTypes: flags.pathParamsAsTypes,
  });

  // output
  if (output === OUTPUT_FILE) {
    let outputFilePath = path.resolve(process.cwd(), flags.output); // note: may be directory
    const isDir = fs.existsSync(outputFilePath) && fs.lstatSync(outputFilePath).isDirectory();
    if (isDir) {
      const filename = pathToSpec.replace(new RegExp(`${path.extname(pathToSpec)}$`), ".ts");
      outputFilePath = path.join(outputFilePath, filename);
    }

    fs.writeFileSync(outputFilePath, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(`🚀 ${GREEN}${pathToSpec} -> ${BOLD}${outputFilePath}${RESET}${GREEN} [${time}ms]${RESET}`);
  } else {
    process.stdout.write(result);
    // if stdout, (still) don’t log anything to console!
  }

  return result;
}

async function main() {
  if (flags.help) {
    console.info(HELP);
    process.exit(0);
  }

  let output = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT
  const pathToSpec = input;

  if (output === OUTPUT_FILE) {
    const packageJSON = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    console.info(`✨ ${BOLD}openapi-typescript ${packageJSON.version}${RESET}`); // only log if we’re NOT writing to stdout
  }

  // error: --raw-schema
  if (flags.rawSchema && !flags.version) {
    throw new Error(`--raw-schema requires --version flag`);
  }

  // handle remote schema, exit
  if (/^https?:\/\//.test(pathToSpec)) {
    if (output !== "." && output === OUTPUT_FILE) fs.mkdirSync(path.dirname(flags.output), { recursive: true });
    await generateSchema(pathToSpec);
    return;
  }

  // handle stdin schema, exit
  if (pathToSpec === "-") {
    if (output !== "." && output === OUTPUT_FILE) fs.mkdirSync(path.dirname(flags.output), { recursive: true });
    await generateSchema(process.stdin);
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
  if (isGlob && output === OUTPUT_FILE && fs.existsSync(flags.output) && fs.lstatSync(flags.output).isFile()) {
    errorAndExit(`❌ Expected directory for --output if using glob patterns. Received "${flags.output}".`);
  }

  // generate schema(s) in parallel
  await Promise.all(
    inputSpecPaths.map(async (specPath) => {
      if (flags.output !== "." && output === OUTPUT_FILE) {
        let outputDir = path.resolve(process.cwd(), flags.output);
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
