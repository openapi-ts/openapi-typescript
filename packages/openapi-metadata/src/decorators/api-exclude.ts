import { ExcludeMetadataStorage } from "../metadata/exclude.js";

export function ApiExcludeController(): ClassDecorator {
  return (target) => {
    ExcludeMetadataStorage.defineMetadata(target, true);
  };
}

export function ApiExcludeOperation(): MethodDecorator {
  return (target, propertyKey) => {
    ExcludeMetadataStorage.defineMetadata(target, true, propertyKey);
  };
}
