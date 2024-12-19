import type { Context } from "../context.js";
import { SymbolKeysNotSupportedError } from "../errors/symbol-keys-not-supported.js";
import { type PropertyMetadata, PropertyMetadataStorage } from "../metadata/property.js";
import { findType } from "../utils/metadata.js";

export type ApiPropertyOptions = Partial<PropertyMetadata>;

/**
 * Configures this class member as a property of the schema.
 * Can be applied to properties, getters and methods.
 *
 * @see https://swagger.io/specification/#schema-object
 */
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

    if (!metadata.type && !metadata.schema && !metadata.enum) {
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

/**
 * Configures this class member as an optional property of the schema.
 * Can be applied to properties, getters and methods.
 *
 * @see https://swagger.io/specification/#schema-object
 */
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
