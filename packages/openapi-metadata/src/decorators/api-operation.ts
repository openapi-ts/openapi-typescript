import { type OperationMetadata, OperationMetadataStorage } from "../metadata/operation.js";

export type ApiOperationOptions = OperationMetadata;

/**
 * Configures a new operation.
 * When multiple methods are defined, multiple operations will be added to the document.
 *
 * @see https://swagger.io/specification/#operation-object
 */
export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (target, propertyKey) => {
    OperationMetadataStorage.defineMetadata(target, options, propertyKey);
  };
}
