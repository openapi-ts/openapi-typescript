import type { OpenAPIV3 } from "openapi-types";
import type { TypeOptions } from "../types";
import { createMetadataStorage } from "./factory";

export type OperationParameterMetadata = Omit<OpenAPIV3.ParameterObject, "in" | "schema"> & {
  name: string;
  in: "path" | "query" | "header" | "cookie";
} & Partial<TypeOptions>;

export const OperationParameterMetadataKey = Symbol("OperationParameter");

export const OperationParameterMetadataStorage = createMetadataStorage<OperationParameterMetadata[]>(
  OperationParameterMetadataKey,
  [],
);
