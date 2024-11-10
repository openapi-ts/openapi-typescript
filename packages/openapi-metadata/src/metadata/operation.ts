import type { OpenAPIV3 } from "openapi-types";
import type { HttpMethods } from "../types.js";
import { createMetadataStorage } from "./factory.js";

export type OperationMetadata = Omit<OpenAPIV3.OperationObject, "responses"> & {
  path?: string;
  methods?: HttpMethods[];
};

export const OperationMetadataKey = Symbol("Operation");

export const OperationMetadataStorage = createMetadataStorage<OperationMetadata>(OperationMetadataKey, {});
