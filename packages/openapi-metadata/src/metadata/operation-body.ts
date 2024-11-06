import type { OpenAPIV3 } from "openapi-types";
import type { TypeOptions } from "../types";
import { createMetadataStorage } from "./factory";

export type OperationBodyMetadata = Omit<OpenAPIV3.RequestBodyObject, "content"> & { mediaType: string } & TypeOptions;

export const OperationBodyMetadataKey = Symbol("OperationBody");

export const OperationBodyMetadataStorage = createMetadataStorage<OperationBodyMetadata>(OperationBodyMetadataKey);
