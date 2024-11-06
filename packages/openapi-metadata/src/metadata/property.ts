import type { TypeOptions } from "../types";
import { createMetadataStorage } from "./factory";

export type PropertyMetadata = {
  name: string;
  required: boolean;
} & TypeOptions;

export const PropertyMetadataKey = Symbol("Property");

export const PropertyMetadataStorage =
  createMetadataStorage<Record<string, PropertyMetadata>>(PropertyMetadataKey);
