#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import glob from "fast-glob";
import parser from "yargs-parser";
import openapiTS from "../dist/index.js";
import { c, error } from "../dist/utils.js";

const HELP = `Usage
  $ openapi-typescript [input] [options]

Options
  --help                       Display this
  --version                    Display the version
  --output, -o                 Specify output file (default: stdout)
  --auth                       (optional) Provide an authentication token for private URL
  --headersObject, -h          (optional) Provide a JSON object as string of HTTP headers for remote schema request
  --header, -x                 (optional) Provide an array of or singular headers as an alternative to a JSON object. Each header must follow the key: value pattern
  --httpMethod, -m             (optional) Provide the HTTP Verb/Method for fetching a schema from a remote URL
  --export-type, -t            (optional) Export "type" instead of "interface"
  --immutable-types            (optional) Generates immutable types (readonly properties and readonly array)
  --additional-properties      (optional) Allow arbitrary properties for all schema objects without "additionalProperties: false"
  --empty-objects-unknown      (optional) Allow arbitrary properties for schema objects with no specified properties, and no specified "additionalProperties"
  --default-non-nullable       (optional) If a schema object has a default value set, don’t mark it as nullable
  --support-array-length       (optional) Generate tuples using array minItems / maxItems
  --path-params-as-types       (optional) Substitute path parameter names with their respective types
  --alphabetize                (optional) Sort types alphabetically
  --exclude-deprecated         (optional) Exclude deprecated fields from types
`;

const OUTPUT_FILE = "FILE";
const OUTPUT_STDOUT = "STDOUT";
const CWD = new URL(`file://${process.cwd()}/`);
const EXT_RE = /\.[^.]+$/i;
const HTTP_RE = /^https?:\/\//;

const timeStart = process.hrtime();

const [, , ...args] = process.argv;
if (args.includes("-ap")) errorAndExit(`The -ap alias has been deprecated. Use "--additional-properties" instead.`);
if (args.includes("-it")) errorAndExit(`The -it alias has been deprecated. Use "--immutable-types" instead.`);

const flags = parser(args, {
  array: ["header"],
  boolean: [
    "help",
    "version",
    "defaultNonNullable",
    "emptyObjectsUnknown",
    "immutableTypes",
    "contentNever",
    "exportType",
    "supportArrayLength",
    "pathParamsAsTypes",
    "alphabetize",
    "excludeDeprecated",
  ],
  string: ["auth", "header", "headersObject", "httpMethod"],
  alias: {
    header: ["x"],
    exportType: ["t"],
    headersObject: ["h"],
    httpMethod: ["m"],
    output: ["o"],
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
    emptyObjectsUnknown: flags.emptyObjectsUnknown,
    auth: flags.auth,
    defaultNonNullable: flags.defaultNonNullable,
    immutableTypes: flags.immutableTypes,
    contentNever: flags.contentNever,
    silent: output === OUTPUT_STDOUT,
    version: flags.version,
    httpHeaders,
    httpMethod: flags.httpMethod,
    exportType: flags.exportType,
    supportArrayLength: flags.supportArrayLength,
    pathParamsAsTypes: flags.pathParamsAsTypes,
    alphabetize: flags.alphabetize,
    excludeDeprecated: flags.excludeDeprecated,
  });

  // output
  if (output === OUTPUT_FILE) {
    let outputFilePath = new URL(flags.output, CWD); // note: may be directory
    const isDir = fs.existsSync(outputFilePath) && fs.lstatSync(outputFilePath).isDirectory();
    if (isDir) {
      if (typeof flags.output === "string" && !flags.output.endsWith("/")) {
        outputFilePath = new URL(`${flags.output}/`, CWD);
      }
      const filename = pathToSpec.replace(EXT_RE, ".ts");
      const originalOutputFilePath = outputFilePath;
      outputFilePath = new URL(filename, originalOutputFilePath);
      if (outputFilePath.protocol !== "file:") {
        outputFilePath = new URL(outputFilePath.host.replace(EXT_RE, ".ts"), originalOutputFilePath);
      }
    }

    fs.writeFileSync(outputFilePath, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(`🚀 ${c.green(`${pathToSpec} → ${c.bold(outputFilePath)}`)} ${c.dim(`[${time}ms]`)}`);
  } else {
    process.stdout.write(result);
    // if stdout, (still) don’t log anything to console!
  }

  return result;
}

async function main() {
  if ("help" in flags) {
    console.info(HELP);
    process.exit(0);
  }
  const packageJSON = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  if ("version" in flags) {
    console.info(`v${packageJSON.version}`);
    process.exit(0);
  }

  let output = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT
  let outputFile = new URL(flags.output, CWD);
  let outputDir = new URL(".", outputFile);

  if (output === OUTPUT_FILE) console.info(`✨ ${c.bold(`openapi-typescript ${packageJSON.version}`)}`); // only log if we’re NOT writing to stdout

  const pathToSpec = flags._[0];

  // handle stdin schema, exit
  if (!pathToSpec) {
    if (output !== "." && output === OUTPUT_FILE) fs.mkdirSync(outputDir, { recursive: true });
    await generateSchema(process.stdin);
    return;
  }

  // handle remote schema, exit
  if (HTTP_RE.test(pathToSpec)) {
    if (output !== "." && output === OUTPUT_FILE) fs.mkdirSync(outputDir, { recursive: true });
    await generateSchema(pathToSpec);
    return;
  }

  // handle local schema(s)
  const inputSpecPaths = await glob(pathToSpec);
  const isGlob = inputSpecPaths.length > 1;
  const isDirUrl = outputDir.pathname === outputFile.pathname;
  const isFile = fs.existsSync(outputDir) && fs.lstatSync(outputDir).isFile();

  // error: no matches for glob
  if (inputSpecPaths.length === 0) {
    error(`Could not find any specs matching "${pathToSpec}". Please check that the path is correct.`);
    process.exit(1);
  }

  // error: tried to glob output to single file
  if (isGlob && output === OUTPUT_FILE && (isFile || !isDirUrl)) {
    error(`Expected directory for --output if using glob patterns. Received "${flags.output}".`);
    process.exit(1);
  }

  // generate schema(s) in parallel
  await Promise.all(
    inputSpecPaths.map(async (specPath) => {
      if (flags.output !== "." && output === OUTPUT_FILE) {
        if (isGlob || isDirUrl) {
          fs.mkdirSync(new URL(path.dirname(specPath), outputDir), { recursive: true }); // recursively make parent dirs
        } else {
          fs.mkdirSync(outputDir, { recursive: true }); // recursively make parent dirs
        }
      }
      await generateSchema(specPath);
    }),
  );
}

main();
