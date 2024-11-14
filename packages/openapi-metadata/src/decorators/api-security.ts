import { OperationSecurityMetadataStorage } from "../metadata/operation-security.js";

/**
 * Configures security requirements.
 * Can be applied to Controllers and Operations.
 *
 * @see https://swagger.io/specification/#security-requirement-object
 */
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

/**
 * Configures Basic auth security requirement.
 * Can be applied to Controllers and Operations.
 *
 * @see https://swagger.io/specification/#security-requirement-object
 */
export function ApiBasicAuth() {
  return ApiSecurity("basic");
}

/**
 * Configures Bearer auth security requirement.
 * Can be applied to Controllers and Operations.
 *
 * @see https://swagger.io/specification/#security-requirement-object
 */
export function ApiBearerAuth() {
  return ApiSecurity("bearer");
}

/**
 * Configures Cookie auth security requirement.
 * Can be applied to Controllers and Operations.
 *
 * @see https://swagger.io/specification/#security-requirement-object
 */
export function ApiCookieAuth() {
  return ApiSecurity("cookie");
}

/**
 * Configures OAuth2 auth security requirement.
 * Can be applied to Controllers and Operations.
 *
 * @see https://swagger.io/specification/#security-requirement-object
 */
export function ApiOauth2(...scopes: string[]) {
  return ApiSecurity("oauth2", ...scopes);
}
