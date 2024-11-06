import type { OpenAPIV3 } from "openapi-types";
import { createMetadataStorage } from "./factory";

export type OperationSecurityMetadata = OpenAPIV3.SecurityRequirementObject;

export const OperationSecurityMetadataKey = Symbol("OperationSecurity");

export const OperationSecurityMetadataStorage =
  createMetadataStorage<OpenAPIV3.SecurityRequirementObject>(
    OperationSecurityMetadataKey,
  );
