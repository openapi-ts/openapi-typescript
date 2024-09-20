import type { MetadataKey, SchemaType } from "../types";
import type { OpenAPIV3 } from "openapi-types";
import { getMetadataPropertyType } from "../utils/metadata";

export type ApiPropertyOptions = Omit<OpenAPIV3.SchemaObject, "name" | "required" | "type"> & {
  type?: SchemaType;
  required?: boolean;
};

const ApiPropertyMetadataKeyPrefix = "__api_property_";

export function apiProperty(options: ApiPropertyOptions = {}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => {
    if (!options.type) {
      options.type = getMetadataPropertyType(target, propertyKey, descriptor);
    }

    Reflect.defineMetadata(`${ApiPropertyMetadataKeyPrefix}${propertyKey.toString()}`, options, target);
  };
}

export function getApiProperties(target: any) {
  const keys = Reflect.getMetadataKeys(target) as MetadataKey[];
  const properties: Record<string, ApiPropertyOptions> = {};

  for (const key of keys.filter(
    (k) => typeof k === "string" && k.startsWith(ApiPropertyMetadataKeyPrefix),
  ) as string[]) {
    const propertyKey = key.replace(ApiPropertyMetadataKeyPrefix, "");
    properties[propertyKey] = Reflect.getMetadata(key, target);
  }

  return properties;
}
