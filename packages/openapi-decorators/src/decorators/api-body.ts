import type { OpenAPIV3 } from "openapi-types";
import type { SchemaType } from "../types";

export const ApiBodyMetadataKey = Symbol("apiBodyKey");

export type ApiBodyMetadata = Omit<OpenAPIV3.RequestBodyObject, "content"> & {
  type?: SchemaType;
  isArray?: boolean;
};

export type ApiBodyOptions = ApiBodyMetadata;

export function apiBody(options: ApiBodyMetadata): MethodDecorator {
  return Reflect.metadata(ApiBodyMetadataKey, options);
}

export function getApiBody(target: any, propertyKey: string): ApiBodyMetadata | undefined {
  return Reflect.getMetadata(ApiBodyMetadataKey, target, propertyKey);
}
