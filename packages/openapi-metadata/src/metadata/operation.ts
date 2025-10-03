import type { OpenAPIV3 } from "openapi-types";
import type { HttpMethods } from "../types.js";
import { createMetadataStorage } from "./factory.js";
import type { OperationParameterMetadata } from "./operation-parameter.js";

export type OperationMetadata = Omit<OpenAPIV3.OperationObject, "responses" | "parameters"> & {
  /**
   * Operation path.
   * Can include parameters.
   */
  path?: string;

  /**
   * Available methods for this operation.
   */
  methods?: HttpMethods[];

  /**
   * Represents metadata about an operation parameter.
   */
  parameters?: OperationParameterMetadata[];
};

export const OperationMetadataKey = Symbol("Operation");

export const OperationMetadataStorage = createMetadataStorage<OperationMetadata>(OperationMetadataKey, {});
