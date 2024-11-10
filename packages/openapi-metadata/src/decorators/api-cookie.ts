import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata/operation-parameter.js";

export type ApiCookieOptions = Omit<OperationParameterMetadata, "in">;

export function ApiCookie(options: ApiCookieOptions) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "cookie", ...options }], propertyKey);
  };
}
