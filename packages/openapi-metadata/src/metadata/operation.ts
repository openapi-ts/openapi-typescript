import type { OpenAPIV3 } from "openapi-types";
import type { HttpMethods } from "../types";
import { createMetadataStorage } from "./factory";

export type OperationMetadata = Omit<OpenAPIV3.OperationObject, "responses"> & {
  path?: string;
  methods?: HttpMethods[];
};

export const OperationMetadataKey = Symbol("Operation");

export const OperationMetadataStorage = createMetadataStorage<OperationMetadata>(OperationMetadataKey, {});
