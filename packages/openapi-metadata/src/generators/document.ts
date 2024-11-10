import type { OpenAPIV3 } from "openapi-types";
import type { OpenAPIDocument, TypeLoaderFn } from "../index.js";
import type { Logger } from "../types.js";
import type { SetOptional } from "type-fest";
import { Context } from "../context.js";
import { generatePaths } from "./paths.js";
import deepmerge from "deepmerge";

export type GenerateDocumentOptions = {
  /**
   * List of Controller constructors that will be loaded into the document.
   *
   * @example [UsersController, PostsController]
   */
  controllers: Function[];

  /**
   * Base document that will be deep merged with the result.
   *
   * @example { info: { name: "My Api", version: "1.0.0" } }
   */
  document: SetOptional<OpenAPIV3.Document, "openapi" | "paths">;

  /**
   * Custom logger.
   *
   * @example { warn: (message) => myLogger.warn(mesage) }
   * @default console
   */
  customLogger?: Logger;

  /**
   * Additional type loaders.
   *
   * @example [VineTypeLoader, LuxonTypeLoader]
   */
  loaders?: TypeLoaderFn[];
};

/**
 * Generates a compliant OpenAPIV3 schema.
 */
export async function generateDocument(
  options: GenerateDocumentOptions,
): Promise<OpenAPIDocument> {
  const context = new Context(options.customLogger, options.loaders);

  return deepmerge(options.document, {
    openapi: "3.0.0",
    paths: await generatePaths(context, options.controllers),
    components: {
      schemas: context.schemas,
    },
  });
}
