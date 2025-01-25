import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata/operation-parameter.js";

export type ApiHeaderOptions = Omit<OperationParameterMetadata, "in">;

/**
 * Configures a header parameter.
 * Can be applied to Operations and Controllers.
 *
 * @see https://swagger.io/specification/#parameter-object
 */
export function ApiHeader(options: ApiHeaderOptions) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "header", ...options }], propertyKey);
  };
}
