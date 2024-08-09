import type { OpenAPIV3 } from "openapi-types";

export interface Type<T = unknown> extends Function {
  new (...args: any[]): T;
}

export type MetadataKey = string | Symbol;

export type SchemaType = Type<unknown> | OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3.ReferenceObject;
