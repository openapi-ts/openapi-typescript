export interface OpenAPI2 {
  definitions?: { [key: string]: OpenAPI2SchemaObject };
  swagger: string;
  [key: string]: any; // handle other properties beyond swagger-to-ts’ concern
}

export type OpenAPI2Type =
  | 'array'
  | 'binary'
  | 'boolean'
  | 'byte'
  | 'date'
  | 'dateTime'
  | 'double'
  | 'float'
  | 'integer'
  | 'long'
  | 'number'
  | 'object'
  | 'password'
  | 'string';

export interface OpenAPI2SchemaObject {
  $ref?: string;
  additionalProperties?: boolean | OpenAPI2SchemaObject;
  allOf?: OpenAPI2SchemaObject[];
  description?: string;
  enum?: string[];
  format?: string;
  items?: OpenAPI2SchemaObject;
  oneOf?: OpenAPI2SchemaObject[];
  properties?: { [index: string]: OpenAPI2SchemaObject };
  required?: string[];
  title?: string;
  type?: OpenAPI2Type;
  [key: string]: any; // use this construct to allow arbitrary x-something properties
}
