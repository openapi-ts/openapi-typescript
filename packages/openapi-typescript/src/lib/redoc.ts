import {
  BaseResolver,
  bundle,
  makeDocumentFromString,
  type Config as RedoclyConfig,
  Source,
  type Document,
  lintDocument,
  type NormalizedProblem,
} from "@redocly/openapi-core";
import { performance } from "node:perf_hooks";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import parseJson from "parse-json";
import type { OpenAPI3 } from "../types.js";
import { debug, error, warn } from "./utils.js";

export interface ValidateAndBundleOptions {
  redoc: RedoclyConfig;
  silent: boolean;
  cwd?: URL;
}

interface ParseSchemaOptions {
  absoluteRef: string;
  resolver: BaseResolver;
}

export async function parseSchema(schema: unknown, { absoluteRef, resolver }: ParseSchemaOptions): Promise<Document> {
  if (!schema) {
    throw new Error("Can’t parse empty schema");
  }
  if (schema instanceof URL) {
    const result = await resolver.resolveDocument(null, absoluteRef, true);
    if ("parsed" in result) {
      return result;
    }
    throw result.originalError;
  }
  if (schema instanceof Readable) {
    const contents = await new Promise<string>((resolve) => {
      schema.resume();
      schema.setEncoding("utf8");
      let content = "";
      schema.on("data", (chunk: string) => {
        content += chunk;
      });
      schema.on("end", () => {
        resolve(content.trim());
      });
    });
    return parseSchema(contents, { absoluteRef, resolver });
  }
  if (schema instanceof Buffer) {
    return parseSchema(schema.toString("utf8"), { absoluteRef, resolver });
  }
  if (typeof schema === "string") {
    // URL
    if (schema.startsWith("http://") || schema.startsWith("https://") || schema.startsWith("file://")) {
      const url = new URL(schema);
      return parseSchema(url, {
        absoluteRef: url.protocol === "file:" ? fileURLToPath(url) : url.href,
        resolver,
      });
    }
    // JSON
    if (schema[0] === "{") {
      return {
        source: new Source(absoluteRef, schema, "application/json"),
        parsed: parseJson(schema),
      };
    }
    // YAML
    return makeDocumentFromString(schema, absoluteRef);
  }
  if (typeof schema === "object" && !Array.isArray(schema)) {
    return {
      source: new Source(absoluteRef, JSON.stringify(schema), "application/json"),
      parsed: schema,
    };
  }
  throw new Error(`Expected string, object, or Buffer. Got ${Array.isArray(schema) ? "Array" : typeof schema}`);
}

function _processProblems(problems: NormalizedProblem[], options: { silent: boolean }) {
  if (problems.length) {
    let errorMessage: string | undefined = undefined;
    for (const problem of problems) {
      const problemLocation = problem.location?.[0].pointer;
      const problemMessage = problemLocation ? `${problem.message} at ${problemLocation}` : problem.message;
      if (problem.severity === "error") {
        errorMessage = problemMessage;
        error(problemMessage);
      } else {
        warn(problemMessage, options.silent);
      }
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Validate an OpenAPI schema and flatten into a single schema using Redocly CLI
 */
export async function validateAndBundle(
  source: string | URL | OpenAPI3 | Readable | Buffer,
  options: ValidateAndBundleOptions,
) {
  const redocConfigT = performance.now();
  debug("Loaded Redoc config", "redoc", performance.now() - redocConfigT);
  const redocParseT = performance.now();
  let absoluteRef = fileURLToPath(new URL(options?.cwd ?? `file://${process.cwd()}/`));
  if (source instanceof URL) {
    absoluteRef = source.protocol === "file:" ? fileURLToPath(source) : source.href;
  }
  const resolver = new BaseResolver(options.redoc.resolve);
  const document = await parseSchema(source, {
    absoluteRef,
    resolver,
  });
  debug("Parsed schema", "redoc", performance.now() - redocParseT);

  // 1. check for OpenAPI 3 or greater
  const openapiVersion = Number.parseFloat(document.parsed.openapi);
  if (
    document.parsed.swagger ||
    !document.parsed.openapi ||
    Number.isNaN(openapiVersion) ||
    openapiVersion < 3 ||
    openapiVersion >= 4
  ) {
    if (document.parsed.swagger) {
      throw new Error("Unsupported Swagger version: 2.x. Use OpenAPI 3.x instead.");
    }
    if (document.parsed.openapi || openapiVersion < 3 || openapiVersion >= 4) {
      throw new Error(`Unsupported OpenAPI version: ${document.parsed.openapi}`);
    }
    throw new Error("Unsupported schema format, expected `openapi: 3.x`");
  }

  // 2. lint
  const redocLintT = performance.now();
  const problems = await lintDocument({
    document,
    config: options.redoc.styleguide,
    externalRefResolver: resolver,
  });
  _processProblems(problems, options);
  debug("Linted schema", "lint", performance.now() - redocLintT);

  // 3. bundle
  const redocBundleT = performance.now();
  const bundled = await bundle({
    config: options.redoc,
    dereference: false,
    doc: document,
  });
  _processProblems(bundled.problems, options);
  debug("Bundled schema", "bundle", performance.now() - redocBundleT);

  return bundled.bundle.parsed;
}
