import type { OpenAPIV3 } from "openapi-types";
import type { MetadataKey, SchemaType } from "../types";

export const ApiParamMetadataKeyPrefix = "__api_param";

export type ApiParamOptions = Omit<OpenAPIV3.ParameterObject, "in" | "schema"> & {
  type?: SchemaType;
};

export function apiParam(options: ApiParamOptions): MethodDecorator {
  return Reflect.metadata(`${ApiParamMetadataKeyPrefix}${options.name}`, options);
}

export function getApiParams(target: any, propertyKey: string): ApiParamOptions[] {
  const keys = Reflect.getMetadataKeys(target, propertyKey) as MetadataKey[];

  return keys
    .filter((k) => typeof k === "string" && k.startsWith(ApiParamMetadataKeyPrefix))
    .map((key) => {
      return Reflect.getMetadata(key.toString(), target, propertyKey);
    });
}
