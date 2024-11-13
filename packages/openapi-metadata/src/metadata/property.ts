import type { OpenAPIV3 } from "openapi-types";
import type { TypeOptions } from "../types.js";
import { createMetadataStorage } from "./factory.js";

export type PropertyMetadata = Omit<OpenAPIV3.NonArraySchemaObject, "type" | "enum" | "properties" | "required"> & {
  name: string;
  required: boolean;
} & TypeOptions;

export const PropertyMetadataKey = Symbol("Property");

export const PropertyMetadataStorage = createMetadataStorage<Record<string, PropertyMetadata>>(PropertyMetadataKey);
