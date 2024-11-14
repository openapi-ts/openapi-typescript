import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata/operation-parameter.js";

export type ApiCookieOptions = Omit<OperationParameterMetadata, "in">;

/**
 * Configures a cookie parameter.
 * Can be applied to Operations and Controllers.
 *
 * @see https://swagger.io/specification/#parameter-object
 */
export function ApiCookie(options: ApiCookieOptions) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "cookie", ...options }], propertyKey);
  };
}
