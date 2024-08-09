export const ApiTagsMetadataKey = Symbol("ApiTags");

export function apiTags(...tags: string[]): ClassDecorator & MethodDecorator {
  return Reflect.metadata(ApiTagsMetadataKey, tags);
}

export function getApiTags(target: any, propertyKey?: string): string[] | undefined {
  if (propertyKey) {
    return Reflect.getMetadata(ApiTagsMetadataKey, target, propertyKey);
  }
  return Reflect.getMetadata(ApiTagsMetadataKey, target);
}
