import deepmerge from "deepmerge";

export function createMetadataStorage<T extends Object>(
  key: Symbol | string,
  defaultMetadata?: T,
) {
  function defineMetadata(
    object: Object,
    metadata: T,
    propertyKey?: string | symbol,
  ) {
    if (propertyKey) {
      Reflect.defineMetadata(key, metadata, object, propertyKey);
    } else {
      Reflect.defineMetadata(key, metadata, object);
    }
  }

  function getMetadata(
    object: Object,
    propertyKey?: string | symbol,
    withParent = false,
  ): T {
    if (propertyKey) {
      let metadata =
        Reflect.getMetadata(key, object, propertyKey) ?? defaultMetadata;

      if (withParent) {
        metadata = deepmerge(getMetadata(object.constructor), metadata);
      }

      return metadata;
    } else {
      return Reflect.getMetadata(key, object) ?? defaultMetadata;
    }
  }

  function mergeMetadata(
    object: Object,
    metadata: T,
    propertyKey?: string | symbol,
  ): T {
    const existing = getMetadata(object, propertyKey);
    const merged = deepmerge(existing, metadata) as T;
    defineMetadata(object, merged, propertyKey);
    return merged;
  }

  return {
    defineMetadata,
    getMetadata,
    mergeMetadata,
  };
}
