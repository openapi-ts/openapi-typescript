#!/usr/bin/env node

import { loadConfig, findConfig, createConfig } from "@redocly/openapi-core";
import fs from "node:fs";
import path from "node:path";
import parser from "yargs-parser";
import openapiTS, {
  astToString,
  c,
  COMMENT_HEADER,
  error,
  formatTime,
  warn,
} from "../dist/index.js";

/* eslint-disable no-console */

const HELP = `Usage
  $ openapi-typescript [input] [options]

Options
  --help                     Display this
  --version                  Display the version
  --redoc [path], -c         Specify path to Redocly config (default: redocly.yaml)
  --output, -o               Specify output file (if not specified in redocly.yaml)
  --enum                     Export true TS enums instead of unions
  --export-type, -t          Export top-level \`type\` instead of \`interface\`
  --immutable                Generate readonly types
  --additional-properties    Treat schema objects as if \`additionalProperties: true\` is set
  --empty-objects-unknown    Generate \`unknown\` instead of \`Record<string, never>\` for empty objects
  --default-non-nullable     Set to \`false\` to ignore default values when generating non-nullable types
  --array-length             Generate tuples using array minItems / maxItems
  --path-params-as-types     Convert paths to template literal types
  --alphabetize              Sort object keys alphabetically
  --exclude-deprecated       Exclude deprecated types
`;

const OUTPUT_FILE = "FILE";
const OUTPUT_STDOUT = "STDOUT";
const CWD = new URL(`file://${process.cwd()}/`);

const timeStart = performance.now();

const [, , ...args] = process.argv;
if (args.includes("-ap")) {
  errorAndExit(
    `The -ap alias has been deprecated. Use "--additional-properties" instead.`,
  );
}
if (args.includes("--immutable-types")) {
  errorAndExit(`The --immutable-types flag has been renamed to "--immutable".`);
}
if (args.includes("--support-array-length")) {
  errorAndExit(
    `The --support-array-length flag has been renamed to "--array-length".`,
  );
}
if (args.includes("-it")) {
  errorAndExit(
    `The -it alias has been deprecated. Use "--immutable-types" instead.`,
  );
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
    "immutable",
    "pathParamsAsTypes",
  ],
  string: ["output", "redoc"],
  alias: {
    redoc: ["c"],
    exportType: ["t"],
    output: ["o"],
  },
});

/**
 * @param {string | URL} schema
 * @param {@type import('@redocly/openapi-core').Config} redoc
 */
async function generateSchema(schema, { redoc, silent = false }) {
  return `${COMMENT_HEADER}${astToString(
    await openapiTS(schema, {
      additionalProperties: flags.additionalProperties,
      alphabetize: flags.alphabetize,
      arrayLength: flags.arrayLength,
      contentNever: flags.contentNever,
      defaultNonNullable: flags.defaultNonNullable,
      emptyObjectsUnknown: flags.emptyObjectsUnknown,
      enum: flags.enum,
      excludeDeprecated: flags.excludeDeprecated,
      exportType: flags.exportType,
      immutable: flags.immutable,
      pathParamsAsTypes: flags.pathParamsAsTypes,
      redoc,
      silent,
    }),
  )}`;
}

/** pretty-format error message but also throw */
function errorAndExit(message) {
  error(message);
  throw new Error(message);
}

function done(input, output, time) {
  // final console output
  console.log(
    `🚀 ${c.green(`${input} → ${c.bold(output)}`)} ${c.dim(
      `[${formatTime(time)}]`,
    )}`,
  );
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

  const outputType = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOU
  if (outputType !== OUTPUT_STDOUT) {
    console.info(`✨ ${c.bold(`openapi-typescript ${packageJSON.version}`)}`);
  }

  const input = flags._[0];

  // load Redocly config
  const maybeRedoc = findConfig(
    flags.redoc ? path.dirname(flags.redoc) : undefined,
  );
  const redoc = maybeRedoc
    ? await loadConfig({ configPath: maybeRedoc })
    : createConfig({}, { extends: ["minimal"] });

  // handle Redoc APIs
  const hasRedoclyApis = Object.keys(redoc?.apis ?? {}).length > 0;
  if (hasRedoclyApis) {
    if (input) {
      warn(
        "APIs are specified both in Redocly Config and CLI argument. Only using Redocly config.",
      );
    }
    await Promise.all(
      Object.entries(redoc.apis).map(async ([name, api]) => {
        const configRoot = redoc?.configFile
          ? new URL(`file://${redoc.configFile}`)
          : CWD;
        if (!api["openapi-ts"]?.output) {
          errorAndExit(
            `API ${name} is missing an \`openapi-ts.output\` key. See https://openapi-ts.pages.dev/cli/#multiple-schemas.`,
          );
        }
        const result = await generateSchema(new URL(api.root, configRoot), {
          redoc, // TODO: merge API overrides better?
        });
        const outFile = new URL(api["openapi-ts"].output, configRoot);
        fs.mkdirSync(new URL(".", outFile), { recursive: true });
        fs.writeFileSync(outFile, result, "utf8");
        done(name, api.root, performance.now() - timeStart);
      }),
    );
  }

  // handle stdin
  else if (!input) {
    const result = await generateSchema(process.stdin, {
      redoc,
      silent: outputType === OUTPUT_STDOUT,
    });
    if (outputType === OUTPUT_STDOUT) {
      // if stdout, (still) don’t log anything to console!
      process.stdout.write(result);
    } else {
      const outFile = new URL(flags.output, CWD);
      fs.mkdirSync(new URL(".", outFile), { recursive: true });
      fs.writeFileSync(outFile, result, "utf8");
      done("stdin", flags.output, performance.now() - timeStart);
    }
  }

  // handle single file
  else {
    // throw error on glob
    if (input.includes("*")) {
      errorAndExit(
        `Globbing has been deprecated in favor of redocly.yaml’s \`apis\` keys. See https://openapi-ts.pages.dev/cli/#multiple-schemas`,
      );
    }
    const result = await generateSchema(new URL(input, CWD), {
      redoc,
      silent: outputType === OUTPUT_STDOUT,
    });
    if (outputType === OUTPUT_STDOUT) {
      // if stdout, (still) don’t log anything to console!
      process.stdout.write(result);
    } else {
      const outFile = new URL(flags.output, CWD);
      fs.mkdirSync(new URL(".", outFile), { recursive: true });
      fs.writeFileSync(outFile, result, "utf8");
      done(input, flags.output, performance.now() - timeStart);
    }
  }
}

main();
