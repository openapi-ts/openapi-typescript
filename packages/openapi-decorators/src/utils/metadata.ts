import type { Type } from "../types";

export function getMetadataPropertyType(
  target: any,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor,
): Type | undefined {
  if (descriptor?.get || descriptor?.value) {
    return Reflect.getMetadata("design:returntype", target, propertyKey);
  }

  return Reflect.getMetadata("design:type", target, propertyKey);
}
