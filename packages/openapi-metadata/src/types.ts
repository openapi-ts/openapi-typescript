import type { OpenAPIV3 } from "openapi-types";
import type { TypeResolver } from "./resolvers";

export interface Type<T = unknown> extends Function {
  new (...args: any[]): T;
}

export type MetadataKey = string | Symbol;

export type SchemaType =
  | Type<unknown>
  | TypeResolver
  | OpenAPIV3.NonArraySchemaObjectType
  | OpenAPIV3.ReferenceObject
  | any
  | {};

export type Resolver = (target: any) => OpenAPIV3.SchemaObject | false;
