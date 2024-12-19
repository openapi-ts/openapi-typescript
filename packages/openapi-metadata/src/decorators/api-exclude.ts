import { ExcludeMetadataStorage } from "../metadata/exclude.js";

/**
 * Exclude this Controller from the generated schema.
 * Useful when working with framework integrations that autoload controllers.
 */
export function ApiExcludeController(): ClassDecorator {
  return (target) => {
    ExcludeMetadataStorage.defineMetadata(target, true);
  };
}

/**
 * Exclude this Operation from the generated schema.
 * Useful when working with framework integrations that autoload controllers.
 */
export function ApiExcludeOperation(): MethodDecorator {
  return (target, propertyKey) => {
    ExcludeMetadataStorage.defineMetadata(target, true, propertyKey);
  };
}
