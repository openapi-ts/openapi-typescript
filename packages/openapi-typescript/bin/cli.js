#!/usr/bin/env node

import { loadConfig } from "@redocly/openapi-core";
import glob from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import parser from "yargs-parser";
import openapiTS, { astToString, COMMENT_HEADER } from "../dist/index.js";
import { c, error } from "../dist/utils.js";

const HELP = `Usage
  $ openapi-typescript [input] [options]

Options
  --help                       Display this
  --version                    Display the version
  --redoc [path]               Specify path to Redocly config (default: redocly.yaml)
  --output, -o                 Specify output file (default: stdout)
  --enum                       (optional) Export true TS enums instead of unions
  --export-type, -t            (optional) Export top-level \`type\` instead of \`interface\`
  --immutable-types            (optional) Generate readonly types
  --additional-properties      (optional) Treat schema objects as if \`additionalProperties: true\` is set
  --empty-objects-unknown      (optional) Generate \`unknown\` instead of \`Record<string, never>\` for empty objects
  --default-non-nullable       (optional) Set to \`false\` to ignore default values when generating non-nullable types
  --array-length               (optional) Generate tuples using array minItems / maxItems
  --path-params-as-types       (optional) Convert paths to template literal types
  --alphabetize                (optional) Sort object keys alphabetically
  --exclude-deprecated         (optional) Exclude deprecated types
`;

const OUTPUT_FILE = "FILE";
const OUTPUT_STDOUT = "STDOUT";
const CWD = new URL(`file://${process.cwd()}/`);
const EXT_RE = /\.[^.]+$/i;
const HTTP_RE = /^https?:\/\//;

const timeStart = process.hrtime();

const [, , ...args] = process.argv;
if (args.includes("-ap")) {
  error(
    `The -ap alias has been deprecated. Use "--additional-properties" instead.`,
  );
  process.exit(1);
}
if (args.includes("--support-array-length")) {
  error(
    `The --support-array-length flag has been renamed to "--array-length".`,
  );
  process.exit(1);
}
if (args.includes("-it")) {
  error(`The -it alias has been deprecated. Use "--immutable-types" instead.`);
  process.exit(1);
}

const flags = parser(args, {
  boolean: [
    "additionalProperties",
    "alphabetize",
    "arrayLength",
    "contentNever",
    "defaultNonNullable",
    "emptyObjectsUnknown",
    "enum",
    "excludeDeprecated",
    "exportType",
    "help",
    "immutableTypes",
    "pathParamsAsTypes",
  ],
  string: ["output", "redoc"],
  alias: {
    exportType: ["t"],
    output: ["o"],
  },
});

async function generateSchema(pathToSpec) {
  const output = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT

  const redoclyConfig = await loadConfig(flags.redoc);

  // generate schema
  const result = `${COMMENT_HEADER}${astToString(
    await openapiTS(pathToSpec, {
      additionalProperties: flags.additionalProperties,
      alphabetize: flags.alphabetize,
      contentNever: flags.contentNever,
      defaultNonNullable: flags.defaultNonNullable,
      emptyObjectsUnknown: flags.emptyObjectsUnknown,
      enum: flags.enum,
      excludeDeprecated: flags.excludeDeprecated,
      exportType: flags.exportType,
      immutableTypes: flags.immutableTypes,
      pathParamsAsTypes: flags.pathParamsAsTypes,
      redocly: redoclyConfig,
      silent: output === OUTPUT_STDOUT,
      supportArrayLength: flags.supportArrayLength,
    }),
  )}`;

  // output
  if (output === OUTPUT_FILE) {
    let outputFilePath = new URL(flags.output, CWD); // note: may be directory
    const isDir =
      fs.existsSync(outputFilePath) &&
      fs.lstatSync(outputFilePath).isDirectory();
    if (isDir) {
      if (typeof flags.output === "string" && !flags.output.endsWith("/")) {
        outputFilePath = new URL(`${flags.output}/`, CWD);
      }
      const filename = pathToSpec.replace(EXT_RE, ".ts");
      const originalOutputFilePath = outputFilePath;
      outputFilePath = new URL(filename, originalOutputFilePath);
      if (outputFilePath.protocol !== "file:") {
        outputFilePath = new URL(
          outputFilePath.host.replace(EXT_RE, ".ts"),
          originalOutputFilePath,
        );
      }
    }

    fs.writeFileSync(outputFilePath, result, "utf8");

    const timeEnd = process.hrtime(timeStart);
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6);
    console.log(
      `🚀 ${c.green(`${pathToSpec} → ${c.bold(outputFilePath)}`)} ${c.dim(
        `[${time}ms]`,
      )}`,
    );
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
  const packageJSON = JSON.parse(
    fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  if ("version" in flags) {
    console.info(`v${packageJSON.version}`);
    process.exit(0);
  }

  let output = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOUT
  let outputFile = new URL(flags.output, CWD);
  let outputDir = new URL(".", outputFile);

  if (output === OUTPUT_FILE) {
    console.info(`✨ ${c.bold(`openapi-typescript ${packageJSON.version}`)}`); // only log if we’re NOT writing to stdout
  }

  const pathToSpec = flags._[0];

  // handle stdin schema, exit
  if (!pathToSpec) {
    if (output !== "." && output === OUTPUT_FILE) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    await generateSchema(process.stdin);
    return;
  }

  // handle remote schema, exit
  if (HTTP_RE.test(pathToSpec)) {
    if (output !== "." && output === OUTPUT_FILE) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
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
    error(
      `Could not find any specs matching "${pathToSpec}". Please check that the path is correct.`,
    );
    process.exit(1);
  }

  // error: tried to glob output to single file
  if (isGlob && output === OUTPUT_FILE && (isFile || !isDirUrl)) {
    error(
      `Expected directory for --output if using glob patterns. Received "${flags.output}".`,
    );
    process.exit(1);
  }

  // generate schema(s) in parallel
  await Promise.all(
    inputSpecPaths.map(async (specPath) => {
      if (flags.output !== "." && output === OUTPUT_FILE) {
        if (isGlob || isDirUrl) {
          fs.mkdirSync(new URL(path.dirname(specPath), outputDir), {
            recursive: true,
          }); // recursively make parent dirs
        } else {
          fs.mkdirSync(outputDir, { recursive: true }); // recursively make parent dirs
        }
      }
      await generateSchema(specPath);
    }),
  );
}

main();
