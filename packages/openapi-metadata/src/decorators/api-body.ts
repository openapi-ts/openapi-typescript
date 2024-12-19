import type { SetOptional } from "type-fest";
import { type OperationBodyMetadata, OperationBodyMetadataStorage } from "../metadata/operation-body.js";

export type ApiBodyOptions = SetOptional<OperationBodyMetadata, "mediaType">;

/**
 * Configures the request body.
 * Can be applied to Controllers and Operations.
 *
 * @see https://swagger.io/specification/#request-body-object
 */
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
