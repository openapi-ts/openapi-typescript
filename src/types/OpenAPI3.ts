export interface OpenAPI3 {
  openapi: string;
  components: { schemas: { [key: string]: OpenAPI3SchemaObject | OpenAPI3Reference } };
}

export type OpenAPI3Type = 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';

export type OpenAPI3Reference = { $ref: string };

export interface OpenAPI3SchemaObject {
  additionalProperties?: OpenAPI3SchemaObject | OpenAPI3Reference | boolean;
  allOf?: (OpenAPI3SchemaObject | OpenAPI3Reference)[];
  anyOf?: (OpenAPI3SchemaObject | OpenAPI3Reference)[];
  description?: string;
  enum?: string[];
  items?: OpenAPI3SchemaObject | OpenAPI3Reference;
  nullable?: boolean;
  oneOf?: (OpenAPI3SchemaObject | OpenAPI3Reference)[];
  properties?: { [key: string]: OpenAPI3SchemaObject | OpenAPI3Reference };
  required?: string[];
  title?: string;
  type: OpenAPI3Type;
}
