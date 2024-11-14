import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata/operation-parameter.js";

export type ApiQueryOptions = Omit<OperationParameterMetadata, "in">;

/**
 * Configures a query parameter.
 * Can be applied to Operations and Controllers.
 *
 * @see https://swagger.io/specification/#parameter-object
 */
export function ApiQuery(options: ApiQueryOptions) {
  return function (target: Object, propertyKey?: string | symbol) {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "query", ...options }], propertyKey);
  };
}
