import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata/operation-parameter";

export type ApiQueryOptions = Omit<OperationParameterMetadata, "in">;

export function ApiQuery(options: ApiQueryOptions) {
  return function (target: Object, propertyKey?: string | symbol) {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "query", ...options }], propertyKey);
  };
}
