import {
  BaseResolver,
  bundle,
  createConfig,
  makeDocumentFromString,
  type RawConfig as RedoclyConfig,
  Source,
  type Document,
  lintDocument,
} from "@redocly/openapi-core";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { OpenAPI3 } from "../types.js";
import { debug, error } from "./utils.js";

export interface ValidateAndBundleOptions {
  redocly?: RedoclyConfig;
  cwd?: URL;
}

interface ParseSchemaOptions {
  absoluteRef: string;
  resolver: BaseResolver;
}

export async function parseSchema(
  schema: unknown,
  { absoluteRef, resolver }: ParseSchemaOptions,
): Promise<Document> {
  if (!schema) {
    throw new Error(`Can’t parse empty schema`);
  }
  if (typeof schema === "string") {
    // URL
    if (
      schema.startsWith("http://") ||
      schema.startsWith("https://") ||
      schema.startsWith("file://")
    ) {
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
        parsed: JSON.parse(schema),
      };
    }
    // YAML
    return makeDocumentFromString(schema, absoluteRef);
  }
  if (schema instanceof URL) {
    const result = await resolver.resolveDocument(null, absoluteRef, true);
    if ("parsed" in result) {
      return result;
    }
    throw new Error(result as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  if (schema instanceof Buffer) {
    const source = schema.toString("utf8");
    // JSON
    if (source[0] === "{") {
      return {
        source: new Source(absoluteRef, source, "application/json"),
        parsed: JSON.parse(source),
      };
    }
    // YAML
    return makeDocumentFromString(source, absoluteRef);
  }
  if (typeof schema === "object" && !Array.isArray(schema)) {
    return {
      source: new Source(
        absoluteRef,
        JSON.stringify(schema),
        "application/json",
      ),
      parsed: schema,
    };
  }
  throw new Error(
    `Expected string, object, or Buffer. Got ${
      Array.isArray(schema) ? "Array" : typeof schema
    }`,
  );
}

/**
 * Validate an OpenAPI schema and flatten into a single schema using Redocly CLI
 */
export async function validateAndBundle(
  source: string | URL | OpenAPI3 | Readable,
  options?: ValidateAndBundleOptions,
) {
  const redocConfigT = performance.now();
  const redocConfig = await createConfig(options?.redocly ?? {});
  debug("Loaded Redoc config", "redoc", performance.now() - redocConfigT);
  const redocParseT = performance.now();
  const resolver = new BaseResolver(redocConfig.resolve);
  let absoluteRef = new URL(
    "openapi-ts.yaml",
    options?.cwd ?? `file://${process.cwd()}/`,
  );
  if (source instanceof URL) {
    absoluteRef = source;
  }
  const document = await parseSchema(source, {
    absoluteRef:
      absoluteRef.protocol === "file:"
        ? fileURLToPath(absoluteRef)
        : absoluteRef.href,
    resolver,
  });
  debug("Parsed schema", "redoc", performance.now() - redocParseT);

  // 1. check for OpenAPI 3 or greater
  const openapiVersion = parseFloat(document.parsed.openapi);
  if (
    document.parsed.swagger ||
    !document.parsed.openapi ||
    Number.isNaN(openapiVersion) ||
    openapiVersion < 3 ||
    openapiVersion >= 4
  ) {
    if (document.parsed.swagger) {
      error("Unsupported Swagger version: 2.x. Use OpenAPI 3.x instead.");
    } else if (
      document.parsed.openapi ||
      openapiVersion < 3 ||
      openapiVersion >= 4
    ) {
      error(`Unsupported OpenAPI version: ${document.parsed.openapi}`);
    } else {
      error("Unsupported schema format, expected `openapi: 3.x`");
    }
    process.exit(1);
    return; // hack for tests/mocking
  }

  // 2. lint
  const redocLintT = performance.now();
  const problems = await lintDocument({
    document,
    config: redocConfig.styleguide,
    externalRefResolver: resolver,
  });
  if (problems.length) {
    let hasError = false;
    for (const problem of problems) {
      if (problem.severity === "error") {
        error(problem.message);
        hasError = true;
      }
    }
    if (hasError) {
      process.exit(1);
      return;
    }
  }
  debug("Linted schema", "lint", performance.now() - redocLintT);

  // 3. bundle
  const redocBundleT = performance.now();
  const bundled = await bundle({
    config: { ...redocConfig },
    dereference: false,
    doc: document,
  });
  if (bundled.problems.length) {
    let hasError = false;
    for (const problem of bundled.problems) {
      error(problem.message);
      if (problem.severity === "error") {
        hasError = true;
      }
    }
    if (hasError) {
      process.exit(1);
      return;
    }
  }
  debug("Bundled schema", "bundle", performance.now() - redocBundleT);

  return bundled.bundle.parsed;
}
