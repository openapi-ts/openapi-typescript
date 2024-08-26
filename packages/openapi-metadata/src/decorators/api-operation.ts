import type { OpenAPIV3 } from "openapi-types";

export const ApiOperationMetadataKey = Symbol("ApiOperation");

export type ApiOperationOptions = Partial<
  OpenAPIV3.OperationObject & {
    method: `${OpenAPIV3.HttpMethods}`;
    pattern: string;
  }
>;

export function apiOperation(options: ApiOperationOptions): MethodDecorator {
  return Reflect.metadata(ApiOperationMetadataKey, options);
}

export function getApiOperation(target: any, propertyKey: string) {
  return Reflect.getMetadata(ApiOperationMetadataKey, target, propertyKey) as ApiOperationOptions | undefined;
}
