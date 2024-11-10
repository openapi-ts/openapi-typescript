import type { OpenAPIV3 } from "openapi-types";
import type { Logger, TypeLoaderFn } from "./types.js";

export class Context {
  schemas: Record<string, OpenAPIV3.SchemaObject> = {};
  typeLoaders: TypeLoaderFn[];
  logger: Logger;

  constructor(logger?: Logger, typeLoaders?: TypeLoaderFn[]) {
    this.logger = logger ?? console;
    this.typeLoaders = typeLoaders ?? [];
  }
}
