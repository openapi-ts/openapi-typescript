import { OperationSecurityMetadataStorage } from "../metadata/operation-security.js";

export function ApiSecurity(name: string, ...scopes: string[]) {
  return (target: Object, propertyKey?: string | symbol) => {
    OperationSecurityMetadataStorage.mergeMetadata(
      target,
      {
        [name]: scopes,
      },
      propertyKey,
    );
  };
}

export function ApiBasicAuth() {
  return ApiSecurity("basic");
}

export function ApiBearerAuth() {
  return ApiSecurity("bearer");
}

export function ApiCookieAuth() {
  return ApiSecurity("cookie");
}

export function ApiOauth2(...scopes: string[]) {
  return ApiSecurity("oauth2", ...scopes);
}
