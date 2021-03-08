declare interface OpenAPI2 {
  swagger: string; // required
  paths?: Record<string, PathItemObject>;
  definitions?: Record<string, SchemaObject>;
  parameters?: ParameterObject[];
  responses?: Record<string, ResponseObject>; // required
}

declare interface OpenAPI3 {
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

declare interface HeaderObject {
  // note: this extends ParameterObject, minus "name" & "in"
  type?: string; // required
  description?: string;
  required?: boolean;
  schema: ReferenceObject | SchemaObject;
}

declare interface PathItemObject {
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

declare interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: (ReferenceObject | ParameterObject)[];
  requestBody?: RequestBody;
  description?: string;
}

declare interface OperationObject {
  description?: string;
  tags?: string[]; // unused
  summary?: string; // unused
  operationId?: string;
  parameters?: (ReferenceObject | ParameterObject)[];
  requestBody?: ReferenceObject | RequestBody;
  responses?: Record<string, ReferenceObject | ResponseObject>; // required
}

declare interface ParameterObject {
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

declare type ReferenceObject = { $ref: string };

declare interface ResponseObject {
  description?: string;
  headers?: Record<string, ReferenceObject | HeaderObject>;
  schema?: ReferenceObject | SchemaObject; // V2 ONLY
  links?: Record<string, ReferenceObject | LinkObject>; // V3 ONLY
  content?: {
    // V3 ONLY
    [contentType: string]: { schema: ReferenceObject | SchemaObject };
  };
}

declare interface RequestBody {
  description?: string;
  content?: {
    [contentType: string]: { schema: ReferenceObject | SchemaObject };
  };
}

declare interface SchemaObject {
  title?: string; // ignored
  description?: string;
  required?: string[];
  enum?: string[];
  type?: string; // assumed "object" if missing
  items?: ReferenceObject | SchemaObject;
  allOf?: SchemaObject;
  properties?: Record<string, ReferenceObject | SchemaObject>;
  additionalProperties?: boolean | ReferenceObject | SchemaObject;
  nullable?: boolean; // V3 ONLY
  oneOf?: (ReferenceObject | SchemaObject)[]; // V3 ONLY
  anyOf?: (ReferenceObject | SchemaObject)[]; // V3 ONLY
}

declare interface SwaggerToTSOptions {
  /** (optional) Path to Prettier config */
  prettierConfig?: string;
  /** (optional) Parsing input document as raw schema rather than OpenAPI document */
  rawSchema?: boolean;
  /** (optional) OpenAPI version. Must be present if parsing raw schema */
  version?: number;
}
