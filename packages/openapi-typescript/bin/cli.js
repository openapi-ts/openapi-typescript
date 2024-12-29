#!/usr/bin/env node

import { createConfig, findConfig, loadConfig } from "@redocly/openapi-core";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import parser from "yargs-parser";
import openapiTS, { COMMENT_HEADER, astToString, c, error, formatTime, warn } from "../dist/index.js";

const HELP = `Usage
  $ openapi-typescript [input] [options]

Options
  --help                     Display this
  --version                  Display the version
  --redocly [path], -c       Specify path to Redocly config (default: redocly.yaml)
  --output, -o               Specify output file (if not specified in redocly.yaml)
  --enum                     Export true TS enums instead of unions
  --enum-values              Export enum values as arrays
  --dedupe-enums             Dedupe enum types when \`--enum=true\` is set
  --check                    Check that the generated types are up-to-date. (default: false)
  --export-type, -t          Export top-level \`type\` instead of \`interface\`
  --immutable                Generate readonly types
  --additional-properties    Treat schema objects as if \`additionalProperties: true\` is set
  --empty-objects-unknown    Generate \`unknown\` instead of \`Record<string, never>\` for empty objects
  --default-non-nullable     Set to \`false\` to ignore default values when generating non-nullable types
  --properties-required-by-default
                             Treat schema objects as if \`required\` is set to all properties by default
  --array-length             Generate tuples using array minItems / maxItems
  --path-params-as-types     Convert paths to template literal types
  --alphabetize              Sort object keys alphabetically
  --exclude-deprecated       Exclude deprecated types
  --root-types (optional)    Export schemas types at root level
  --root-types-no-schema-prefix (optional)
                             Do not add "Schema" prefix to types at the root level (should only be used with --root-types)
  --make-paths-enum          Generate ApiPaths enum for all paths
`;

const OUTPUT_FILE = "FILE";
const OUTPUT_STDOUT = "STDOUT";
const CWD = new URL(`file://${process.cwd()}/`);
const REDOC_CONFIG_KEY = "x-openapi-ts";

const timeStart = performance.now();

const [, , ...args] = process.argv;
if (args.includes("-ap")) {
  errorAndExit(`The -ap alias has been deprecated. Use "--additional-properties" instead.`);
}
if (args.includes("--immutable-types")) {
  errorAndExit(`The --immutable-types flag has been renamed to "--immutable".`);
}
if (args.includes("--support-array-length")) {
  errorAndExit(`The --support-array-length flag has been renamed to "--array-length".`);
}
if (args.includes("-it")) {
  errorAndExit(`The -it alias has been deprecated. Use "--immutable-types" instead.`);
}
if (args.includes("--redoc")) {
  errorAndExit(`The --redoc config flag has been renamed to "--redocly" (or -c as shorthand).`);
}
if (args.includes("--root-types-no-schema-prefix") && !args.includes("--root-types")) {
  console.warn("--root-types-no-schema-prefix has no effect without --root-types flag");
}

const flags = parser(args, {
  boolean: [
    "additionalProperties",
    "alphabetize",
    "arrayLength",
    "contentNever",
    "defaultNonNullable",
    "propertiesRequiredByDefault",
    "emptyObjectsUnknown",
    "enum",
    "enumValues",
    "dedupeEnums",
    "check",
    "excludeDeprecated",
    "exportType",
    "help",
    "immutable",
    "pathParamsAsTypes",
    "rootTypes",
    "rootTypesNoSchemaPrefix",
    "makePathsEnum",
  ],
  string: ["output", "redocly"],
  alias: {
    redocly: ["c"],
    exportType: ["t"],
    output: ["o"],
  },
});

/**
 * Normalize the output path into a file URL.
 * @param {string} output - The output path to be transformed.
 * @returns {URL} The transformed file URL.
 */
function normalizeOutput(output) {
  if (path.isAbsolute(output)) {
    return new URL(`file://${output}`);
  }
  return new URL(output, CWD);
}

/**
 * Check if the generated types are up-to-date.
 * @param {string} current - The current generated types.
 * @param {URL} outputPath - The path to the output file.
 */
function checkStaleOutput(current, outputPath) {
  if (flags.check) {
    const previous = fs.readFileSync(outputPath, "utf8");
    if (current === previous) {
      process.exit(0);
    } else {
      error("Generated types are not up-to-date!");
      process.exit(1);
    }
  }
}

/**
 * @param {string | URL} schema
 * @param {@type import('@redocly/openapi-core').Config} redocly
 */
async function generateSchema(schema, { redocly, silent = false }) {
  return `${COMMENT_HEADER}${astToString(
    await openapiTS(schema, {
      additionalProperties: flags.additionalProperties,
      alphabetize: flags.alphabetize,
      arrayLength: flags.arrayLength,
      contentNever: flags.contentNever,
      propertiesRequiredByDefault: flags.propertiesRequiredByDefault,
      defaultNonNullable: flags.defaultNonNullable,
      emptyObjectsUnknown: flags.emptyObjectsUnknown,
      enum: flags.enum,
      enumValues: flags.enumValues,
      dedupeEnums: flags.dedupeEnums,
      excludeDeprecated: flags.excludeDeprecated,
      exportType: flags.exportType,
      immutable: flags.immutable,
      pathParamsAsTypes: flags.pathParamsAsTypes,
      rootTypes: flags.rootTypes,
      rootTypesNoSchemaPrefix: flags.rootTypesNoSchemaPrefix,
      makePathsEnum: flags.makePathsEnum,
      redocly,
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
  // biome-ignore lint/suspicious/noConsoleLog: this is a CLI and is expected to show output
  console.log(`🚀 ${c.green(`${input} → ${c.bold(output)}`)} ${c.dim(`[${formatTime(time)}]`)}`);
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

  const outputType = flags.output ? OUTPUT_FILE : OUTPUT_STDOUT; // FILE or STDOU
  if (outputType !== OUTPUT_STDOUT) {
    console.info(`✨ ${c.bold(`openapi-typescript ${packageJSON.version}`)}`);
  }

  const input = flags._[0];

  // load Redocly config
  const maybeRedoc = findConfig(flags.redocly ? path.dirname(flags.redocly) : undefined);
  const redocly = maybeRedoc
    ? await loadConfig({ configPath: maybeRedoc })
    : await createConfig({}, { extends: ["minimal"] });

  // handle Redoc APIs
  const hasRedoclyApis = Object.keys(redocly?.apis ?? {}).length > 0;
  if (hasRedoclyApis) {
    if (input) {
      warn("APIs are specified both in Redocly Config and CLI argument. Only using Redocly config.");
    }
    await Promise.all(
      Object.entries(redocly.apis).map(async ([name, api]) => {
        let configRoot = CWD;
        if (redocly.configFile) {
          // note: this will be absolute if --redoc is passed; otherwise, relative
          configRoot = path.isAbsolute(redocly.configFile)
            ? new URL(`file://${redocly.configFile}`)
            : new URL(redocly.configFile, `file://${process.cwd()}/`);
        }
        if (!api[REDOC_CONFIG_KEY]?.output) {
          errorAndExit(
            `API ${name} is missing an \`${REDOC_CONFIG_KEY}.output\` key. See https://openapi-ts.dev/cli/#multiple-schemas.`,
          );
        }
        const result = await generateSchema(new URL(api.root, configRoot), { redocly });
        const outFile = new URL(api[REDOC_CONFIG_KEY].output, configRoot);
        checkStaleOutput(result, outFile);
        fs.mkdirSync(new URL(".", outFile), { recursive: true });
        fs.writeFileSync(outFile, result, "utf8");
        done(name, api[REDOC_CONFIG_KEY].output, performance.now() - timeStart);
      }),
    );
  }

  // handle stdin
  else if (!input) {
    const result = await generateSchema(process.stdin, {
      redocly,
      silent: outputType === OUTPUT_STDOUT,
    });
    if (outputType === OUTPUT_STDOUT) {
      // if stdout, (still) don’t log anything to console!
      process.stdout.write(result);
    } else {
      const outFile = normalizeOutput(flags.output);
      checkStaleOutput(result, outFile);
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
        "Globbing has been deprecated in favor of redocly.yaml’s `apis` keys. See https://openapi-ts.dev/cli/#multiple-schemas",
      );
    }
    const result = await generateSchema(new URL(input, CWD), {
      redocly,
      silent: outputType === OUTPUT_STDOUT,
    });
    if (outputType === OUTPUT_STDOUT) {
      // if stdout, (still) don’t log anything to console!
      process.stdout.write(result);
    } else {
      const outFile = normalizeOutput(flags.output);
      checkStaleOutput(result, outFile);
      fs.mkdirSync(new URL(".", outFile), { recursive: true });
      fs.writeFileSync(outFile, result, "utf8");
      done(input, flags.output, performance.now() - timeStart);
    }
  }
}

main();
