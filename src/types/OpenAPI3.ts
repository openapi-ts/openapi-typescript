/**
 * OpenAPI3 types
 * These aren’t exhaustive or complete by any means; they simply provide only
 * the parts that swagger-to-ts needs to know about.
 */

export interface OpenAPI3Schemas {
  [key: string]: OpenAPI3SchemaObject | OpenAPI3Reference;
}

export interface OpenAPI3 {
  openapi: string;
  components: {
    schemas: OpenAPI3Schemas;
  };
  [key: string]: any; // handle other properties beyond swagger-to-ts’ concern
}

export type OpenAPI3Type =
  | "array"
  | "boolean"
  | "integer"
  | "number"
  | "object"
  | "string";

export type OpenAPI3Reference =
  | { $ref: string }
  | { anyOf: (OpenAPI3SchemaObject | OpenAPI3Reference)[] }
  | { oneOf: (OpenAPI3SchemaObject | OpenAPI3Reference)[] };

export interface OpenAPI3SchemaObject {
  additionalProperties?: OpenAPI3SchemaObject | OpenAPI3Reference | boolean;
  allOf?: (OpenAPI3SchemaObject | OpenAPI3Reference)[];
  description?: string;
  enum?: string[];
  items?: OpenAPI3SchemaObject | OpenAPI3Reference;
  nullable?: boolean;
  oneOf?: (OpenAPI3SchemaObject | OpenAPI3Reference)[];
  properties?: { [key: string]: OpenAPI3SchemaObject | OpenAPI3Reference };
  required?: string[];
  title?: string;
  type?: OpenAPI3Type; // allow this to be optional to cover cases when this is missing
  [key: string]: any; // allow arbitrary x-something properties
}
