import type { OpenAPIV3 } from "openapi-types";
import type { TypeOptions } from "../types";
import type { SetOptional } from "type-fest";
import { createMetadataStorage } from "./factory";

export type OperationResponseMetadata = Omit<SetOptional<OpenAPIV3.ResponseObject, "description">, "content"> & {
  status: number | "default";
  mediaType: string;
} & TypeOptions;

export const OperationResponseMetadataKey = Symbol("OperationResponse");

export const OperationResponseMetadataStorage = createMetadataStorage<Record<string, OperationResponseMetadata>>(
  OperationResponseMetadataKey,
  {},
);
