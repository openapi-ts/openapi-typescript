import { OperationMetadataStorage } from "../metadata/operation.js";

export function ApiTags(...tags: string[]) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationMetadataStorage.mergeMetadata(target, { tags }, propertyKey);
  };
}
