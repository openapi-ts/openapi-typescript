import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata";

export type ApiHeaderOptions = Omit<OperationParameterMetadata, "in">;

export function ApiHeader(options: ApiHeaderOptions) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "header", ...options }], propertyKey);
  };
}
