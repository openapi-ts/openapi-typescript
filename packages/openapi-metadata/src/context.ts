import type { OpenAPIV3 } from "openapi-types";
import type { Logger, TypeLoaderFn } from "./types";

export class Context {
  schemas: Record<string, OpenAPIV3.SchemaObject> = {};
  typeLoaders: TypeLoaderFn[];
  logger: Logger;

  constructor(logger?: Logger, typeLoaders?: TypeLoaderFn[]) {
    this.logger = logger ?? console;
    this.typeLoaders = typeLoaders ?? [];
  }
}
