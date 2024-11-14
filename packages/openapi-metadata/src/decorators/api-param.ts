import {
  type OperationParameterMetadata,
  OperationParameterMetadataStorage,
} from "../metadata/operation-parameter.js";

export type ApiParamOptions = Omit<OperationParameterMetadata, "in">;

/**
 * Configures a path parameter.
 * Can be applied to Operations and Controllers.
 *
 * @see https://swagger.io/specification/#parameter-object
 */
export function ApiParam(options: ApiParamOptions) {
  return function (target: Object, propertyKey?: string | symbol) {
    OperationParameterMetadataStorage.mergeMetadata(
      target,
      [{ in: "path", ...options }],
      propertyKey,
    );
  };
}
