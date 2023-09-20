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
import { error } from "./utils.js";

export interface ValidateAndBundleOptions {
  redocly?: RedoclyConfig;
  cwd: string;
}

export async function parseSchema(
  schema: unknown,
  cwd: string,
  resolver: BaseResolver,
): Promise<Document> {
  if (!schema) {
    throw new Error(`Can’t parse empty schema`);
  }
  if (typeof schema === "string") {
    return makeDocumentFromString(schema, cwd);
  }
  if (schema instanceof URL) {
    return resolver.parseDocument(
      await resolver.loadExternalRef(
        schema.protocol === "file:" ? fileURLToPath(schema) : schema.href,
      ),
      true,
    );
  }
  if (schema instanceof Buffer) {
    return makeDocumentFromString(schema.toString("utf8"), cwd);
  }
  if (typeof schema === "object" && !Array.isArray(schema)) {
    return {
      source: new Source(cwd, JSON.stringify(schema), "application/json"),
      parsed: schema,
    };
  }
  throw new Error(
    `Expected string, object, or Buffer. Got ${
      Array.isArray(schema) ? "Array" : typeof schema
    }`,
  );
}

export async function validateAndBundle(
  source: string | URL | OpenAPI3 | Readable,
  options?: ValidateAndBundleOptions,
) {
  const redocConfig = await createConfig(options?.redocly ?? {});
  const resolver = new BaseResolver(redocConfig.resolve);
  const document = await parseSchema(
    source,
    options?.cwd ?? process.cwd(),
    resolver,
  );

  // 1. lint
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
    }
  }

  // 2. bundle
  const bundled = await bundle({
    config: redocConfig,
    dereference: true,
    doc: document,
  });
  if (bundled.problems.length) {
    let hasError = false;
    for (const problem of bundled.problems) {
      if (problem.severity === "error") {
        error(problem.message);
        hasError = true;
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  return bundled.bundle.parsed;
}
