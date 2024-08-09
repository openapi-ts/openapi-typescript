import type { OpenAPIV3 } from "openapi-types";
import type { MetadataKey, SchemaType } from "../types";

const ApiResponseMetadataKeyPrefix = "__api_response_";

export type ApiResponseMetadata = {
  status?: number;
  type?: SchemaType;
} & Omit<OpenAPIV3.ResponseObject, "description">;

export type ApiResponseOptions = ApiResponseMetadata;

export function apiResponse(options: ApiResponseOptions): MethodDecorator {
  const status = options.status ?? "default";
  return Reflect.metadata(`${ApiResponseMetadataKeyPrefix}${status}`, options);
}

export function getApiResponses(target: any, propertyKey: string): ApiResponseOptions[] {
  const keys = Reflect.getMetadataKeys(target, propertyKey) as MetadataKey[];

  return keys
    .filter((k) => typeof k === "string" && k.startsWith(ApiResponseMetadataKeyPrefix))
    .map((key) => {
      return Reflect.getMetadata(key.toString(), target, propertyKey);
    });
}
