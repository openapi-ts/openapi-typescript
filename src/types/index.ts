import { OpenAPI2SchemaObject } from "./OpenAPI2";
import { OpenAPI3SchemaObject } from "./OpenAPI3";

export * from "./OpenAPI2";
export * from "./OpenAPI3";

export interface Property {
  interfaceType: string;
  optional: boolean;
  description?: string;
}

export interface SwaggerToTSOptions {
  /** (optional) Path to Prettier config */
  prettierConfig?: string;
  /** (optional) Function to iterate over every schema object before transforming to TypeScript */
  propertyMapper?: (
    schemaObject: OpenAPI2SchemaObject | OpenAPI3SchemaObject,
    property: Property
  ) => Property;
  /** (optional) Parsing input document as raw schema rather than OpenAPI document */
  rawSchema?: boolean;
  /** (optional) OpenAPI version. Must be present if parsing raw schema */
  version?: number;
}
