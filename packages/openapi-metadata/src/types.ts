import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "./context.js";

export type HttpMethods = `${OpenAPIV3.HttpMethods}`;

export type PrimitiveType = OpenAPIV3.NonArraySchemaObjectType;

export type TypeValue = Function | PrimitiveType;
export type Thunk<T> = (context: Context) => T;
export type EnumTypeValue = string[] | number[] | Record<number, string>;

export type Logger = {
  warn: (typeof console)["warn"];
};

export type TypeOptions = {
  type?: Thunk<TypeValue> | TypeValue;
  schema?: OpenAPIV3.SchemaObject;
  enum?: EnumTypeValue;
};

export type TypeLoaderFn = (
  context: Context,
  value: TypeValue,
  original?: Thunk<TypeValue> | TypeValue,
) => Promise<OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined>;
