import type { SetOptional } from "type-fest";
import { type OperationBodyMetadata, OperationBodyMetadataStorage } from "../metadata/operation-body";

export type ApiBodyOptions = SetOptional<OperationBodyMetadata, "mediaType">;

export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  return (target, propertyKey) => {
    OperationBodyMetadataStorage.defineMetadata(
      target,
      {
        mediaType: "application/json",
        ...options,
      },
      propertyKey,
    );
  };
}
