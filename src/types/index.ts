import { OpenAPI2SchemaObject } from './OpenAPI2';

export * from './OpenAPI2';
export * from './OpenAPI3';

export interface Property {
  interfaceType: string;
  optional: boolean;
  description?: string;
}

export type PropertyMapper = (schemaObject: OpenAPI2SchemaObject, property: Property) => Property;
