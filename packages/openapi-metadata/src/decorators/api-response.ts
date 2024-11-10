import type { SetOptional } from "type-fest";
import {
  type OperationResponseMetadata,
  OperationResponseMetadataStorage,
} from "../metadata/operation-response.js";

export type ApiResponseOptions = SetOptional<
  OperationResponseMetadata,
  "status" | "mediaType"
>;

export function ApiResponse(options: ApiResponseOptions) {
  return function (target: Object, propertyKey?: string | symbol) {
    const metadata = {
      status: "default" as const,
      mediaType: "application/json",
      ...options,
    };
    OperationResponseMetadataStorage.mergeMetadata(
      target,
      {
        [metadata.status.toString()]: metadata,
      },
      propertyKey,
    );
  };
}
