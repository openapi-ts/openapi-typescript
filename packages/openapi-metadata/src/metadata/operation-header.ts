import type { OpenAPIV3 } from "openapi-types";
import type { TypeOptions } from "../types.js";
import { createMetadataStorage } from "./factory.js";

export type OperationHeaderMetadata = Omit<OpenAPIV3.HeaderObject, "schema"> & {
  name: string;
} & Partial<TypeOptions>;

export const OperationHeaderSymbol = Symbol("OperationHeader");

export const OperationHeaderMetadataStorage = createMetadataStorage<
  Record<string, OperationHeaderMetadata>
>(OperationHeaderSymbol);
