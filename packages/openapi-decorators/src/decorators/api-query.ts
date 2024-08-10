import type { OpenAPIV3 } from "openapi-types";
import type { MetadataKey, SchemaType } from "../types";

export const ApiQueryMetadataKeyPrefix = "__api_query";

export type ApiQueryOptions = Omit<OpenAPIV3.ParameterObject, "in" | "schema"> & {
  type?: SchemaType;
};

export function apiQuery(options: ApiQueryOptions): MethodDecorator {
  return Reflect.metadata(`${ApiQueryMetadataKeyPrefix}${options.name}`, options);
}

export function getApiQueries(target: any, propertyKey: string): ApiQueryOptions[] {
  const keys = Reflect.getMetadataKeys(target, propertyKey) as MetadataKey[];

  return keys
    .filter((k) => typeof k === "string" && k.startsWith(ApiQueryMetadataKeyPrefix))
    .map((key) => {
      return Reflect.getMetadata(key.toString(), target, propertyKey);
    });
}
