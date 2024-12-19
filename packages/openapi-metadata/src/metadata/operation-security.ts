import type { OpenAPIV3 } from "openapi-types";
import { createMetadataStorage } from "./factory.js";

export type OperationSecurityMetadata = OpenAPIV3.SecurityRequirementObject;

export const OperationSecurityMetadataKey = Symbol("OperationSecurity");

export const OperationSecurityMetadataStorage = createMetadataStorage<OperationSecurityMetadata>(
  OperationSecurityMetadataKey,
  {},
);
