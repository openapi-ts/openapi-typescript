import { OperationMetadataStorage } from "../metadata/operation.js";

/**
 * Configures tags used to grouping operations.
 * Can be applied to Controllers and Operations.
 */
export function ApiTags(...tags: string[]) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationMetadataStorage.mergeMetadata(target, { tags }, propertyKey);
  };
}
