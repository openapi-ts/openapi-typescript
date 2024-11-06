import type { Context } from "../context";
import { SymbolKeysNotSupportedError } from "../errors/symbol-keys-not-supported";
import { type PropertyMetadata, PropertyMetadataStorage } from "../metadata/property";
import { findType } from "../utils/metadata";

export type ApiPropertyOptions = Partial<PropertyMetadata>;

export function ApiProperty(options?: ApiPropertyOptions): PropertyDecorator;
export function ApiProperty(options?: ApiPropertyOptions): MethodDecorator;
export function ApiProperty(options?: ApiPropertyOptions): PropertyDecorator | MethodDecorator {
  return (prototype, propertyKey, descriptor) => {
    const isMethod = Boolean(descriptor?.value);

    if (typeof propertyKey === "symbol") {
      throw new SymbolKeysNotSupportedError();
    }

    const metadata = {
      name: options?.name ?? propertyKey,
      required: true,
      ...options,
    } as PropertyMetadata;

    if (!("type" in metadata) && !("schema" in metadata) && !("enum" in metadata)) {
      (metadata as any).type = (context: Context) =>
        findType({
          context,
          metadataKey: isMethod ? "design:returntype" : "design:type",
          prototype,
          propertyKey,
        });
    }

    PropertyMetadataStorage.mergeMetadata(prototype, {
      [metadata.name]: metadata as PropertyMetadata,
    });
  };
}

export function ApiPropertyOptional(options?: Omit<ApiPropertyOptions, "required">): PropertyDecorator;
export function ApiPropertyOptional(options?: Omit<ApiPropertyOptions, "required">): MethodDecorator;
export function ApiPropertyOptional(
  options?: Omit<ApiPropertyOptions, "required">,
): PropertyDecorator | MethodDecorator {
  return ApiProperty({
    ...options,
    required: false,
  });
}
