import {
  type OperationParameterMetadata,
  OperationParameterMetadataStorage,
} from "../metadata/operation-parameter.js";

export type ApiHeaderOptions = Omit<OperationParameterMetadata, "in">;

export function ApiHeader(options: ApiHeaderOptions) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationParameterMetadataStorage.mergeMetadata(
      target,
      [{ in: "header", ...options }],
      propertyKey,
    );
  };
}
