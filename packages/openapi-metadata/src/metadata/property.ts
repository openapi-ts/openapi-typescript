import type { TypeOptions } from "../types.js";
import { createMetadataStorage } from "./factory.js";

export type PropertyMetadata = {
  name: string;
  required: boolean;
} & TypeOptions;

export const PropertyMetadataKey = Symbol("Property");

export const PropertyMetadataStorage =
  createMetadataStorage<Record<string, PropertyMetadata>>(PropertyMetadataKey);
