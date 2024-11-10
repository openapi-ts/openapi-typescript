import {
  type OperationMetadata,
  OperationMetadataStorage,
} from "../metadata/operation.js";

export type ApiOperationOptions = OperationMetadata;

export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (target, propertyKey) => {
    OperationMetadataStorage.defineMetadata(target, options, propertyKey);
  };
}
