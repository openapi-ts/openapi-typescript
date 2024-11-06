import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata";

export type ApiCookieOptions = Omit<OperationParameterMetadata, "in">;

export function ApiCookie(options: ApiCookieOptions) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "cookie", ...options }], propertyKey);
  };
}
