import type { URL } from "url";

export interface OpenAPI2 {
  swagger: string; // required
  paths?: Record<string, PathItemObject>;
  definitions?: Record<string, SchemaObject>;
  parameters?: ParameterObject[];
  responses?: Record<string, ResponseObject>; // required
}

export interface OpenAPI3 {
  openapi: string; // required
  paths?: Record<string, PathItemObject>; // required
  components?: {
    schemas?: Record<string, ReferenceObject | SchemaObject>;
    responses?: Record<string, ReferenceObject | ResponseObject>;
    parameters?: Record<string, ReferenceObject | ParameterObject>;
    requestBodies?: Record<string, ReferenceObject | RequestBody>;
    headers?: Record<string, ReferenceObject | HeaderObject>;
    links?: Record<string, ReferenceObject | LinkObject>;
  };
}

export type Headers = Record<string, string>;

export interface HeaderObject {
  // note: this extends ParameterObject, minus "name" & "in"
  type?: string; // required
  description?: string;
  required?: boolean;
  schema: ReferenceObject | SchemaObject;
}

export interface PathItemObject {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject; // V3 ONLY
  parameters?: (ReferenceObject | ParameterObject)[];
}

export interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: (ReferenceObject | ParameterObject)[];
  requestBody?: RequestBody;
  description?: string;
}

export interface OperationObject {
  description?: string;
  tags?: string[]; // unused
  summary?: string; // unused
  operationId?: string;
  parameters?: (ReferenceObject | ParameterObject)[];
  requestBody?: ReferenceObject | RequestBody;
  responses?: Record<string, ReferenceObject | ResponseObject>; // required
}

export interface ParameterObject {
  name?: string; // required
  in?: "query" | "header" | "path" | /* V3 */ "cookie" | /* V2 */ "formData" | /* V2 */ "body"; // required
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: ReferenceObject | SchemaObject; // required
  type?: "string" | "number" | "integer" | "boolean" | "array" | "file"; // V2 ONLY
  items?: ReferenceObject | SchemaObject; // V2 ONLY
  enum?: string[]; // V2 ONLY
}

export type ReferenceObject = { $ref: string };

export interface ResponseObject {
  description?: string;
  headers?: Record<string, ReferenceObject | HeaderObject>;
  schema?: ReferenceObject | SchemaObject; // V2 ONLY
  links?: Record<string, ReferenceObject | LinkObject>; // V3 ONLY
  content?: {
    // V3 ONLY
    [contentType: string]: { schema: ReferenceObject | SchemaObject };
  };
}

export interface RequestBody {
  description?: string;
  content?: {
    [contentType: string]: { schema: ReferenceObject | SchemaObject };
  };
}

export interface SchemaObject {
  title?: string; // ignored
  description?: string;
  required?: string[];
  enum?: string[];
  type?: string; // assumed "object" if missing
  items?: ReferenceObject | SchemaObject;
  allOf?: SchemaObject;
  properties?: Record<string, ReferenceObject | SchemaObject>;
  default?: any;
  additionalProperties?: boolean | ReferenceObject | SchemaObject;
  nullable?: boolean; // V3 ONLY
  oneOf?: (ReferenceObject | SchemaObject)[]; // V3 ONLY
  anyOf?: (ReferenceObject | SchemaObject)[]; // V3 ONLY
  format?: string; // V3 ONLY
}

export type SchemaFormatter = (schemaObj: SchemaObject) => string | undefined;

export interface SwaggerToTSOptions {
  /** Allow arbitrary properties on schemas (default: false) */
  additionalProperties?: boolean;
  /** (optional) Specify auth if using openapi-typescript to fetch URL */
  auth?: string;
  /** (optional) Specify current working directory (cwd) to resolve remote schemas on disk (not needed for remote URL schemas) */
  cwd?: URL;
  /** Specify a formatter */
  formatter?: SchemaFormatter;
  /** Generates immutable types (readonly properties and readonly array) */
  immutableTypes?: boolean;
  /** (optional) If supplied, an omitted reponse \`content\` property will be generated as \`never\` instead of \`unknown\` */
  contentNever?: boolean;
  /** (optional) Treat schema objects with default values as non-nullable */
  defaultNonNullable?: boolean;
  /** (optional) Path to Prettier config */
  prettierConfig?: string;
  /** (optional) Parsing input document as raw schema rather than OpenAPI document */
  rawSchema?: boolean;
  /** (optional) Generate an enum containing all API paths. **/
  makePathsEnum?: boolean;
  /** (optional) Should logging be suppressed? (necessary for STDOUT) */
  silent?: boolean;
  /** (optional) OpenAPI version. Must be present if parsing raw schema */
  version?: number;
  /**
   * (optional) List of HTTP headers that will be sent with the fetch request to a remote schema. This is
   * in addition to the authorization header. In some cases, servers require headers such as Accept: application/json
   * or Accept: text/yaml to be sent in order to figure out how to properly fetch the OpenAPI/Swagger document as code.
   * These headers will only be sent in the case that the schema URL protocol is of type http or https.
   */
  httpHeaders?: Headers;
  /**
   * HTTP verb used to fetch the schema from a remote server. This is only applied
   * when the schema is a string and has the http or https protocol present. By default,
   * the request will use the HTTP GET method to fetch the schema from the server.
   *
   * @default {string} GET
   */
  httpMethod?: string;
  /**
   * (optional) Export type instead of interface
   */
  exportType?: boolean;
  /**
   * (optional) Generate tuples using array minItems / maxItems
   */
  supportArrayLength?: boolean;
  /**
   * (optional) Substitute path parameter names with their respective types.
   */
  pathParamsAsTypes?: boolean;
  /**
   * (optional) Provide your own comment header that prefixes the generated file.
   * Note this isn’t validated, so any string entered will be accepted as-is.
   */
  commentHeader?: string;
}

/** Context passed to all submodules */
export interface GlobalContext {
  additionalProperties: boolean;
  auth?: string;
  commentHeader: string;
  defaultNonNullable: boolean;
  formatter?: SchemaFormatter;
  immutableTypes: boolean;
  contentNever: boolean;
  makePathsEnum: boolean;
  namespace?: string;
  pathParamsAsTypes?: boolean;
  rawSchema: boolean;
  silent?: boolean;
  supportArrayLength?: boolean;
  version: number;
}
