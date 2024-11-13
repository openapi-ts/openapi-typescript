import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context.js";
import type { TypeLoaderFn, TypeOptions } from "../types.js";
import type { SetRequired } from "type-fest";
import { getEnumType, getEnumValues } from "../utils/enum.js";
import { PropertyMetadataStorage } from "../metadata/property.js";
import { schemaPath } from "../utils/schema.js";
import { isThunk } from "../utils/metadata.js";

export const PrimitiveTypeLoader: TypeLoaderFn = async (_context, value) => {
  if (typeof value === "string") {
    return { type: value };
  }

  // biome-ignore lint/suspicious/noDoubleEquals: strict comparaison might fail to catch it
  if (value == String) {
    return { type: "string" };
  }

  // biome-ignore lint/suspicious/noDoubleEquals: strict comparaison might fail to catch it
  if (value == Boolean) {
    return { type: "boolean" };
  }

  // biome-ignore lint/suspicious/noDoubleEquals: strict comparaison might fail to catch it
  if (value == Number) {
    return { type: "number" };
  }
};

export const ArrayTypeLoader: TypeLoaderFn = async (context, value) => {
  if (!Array.isArray(value)) {
    return;
  }

  if (value.length <= 0) {
    context.logger.warn("You tried to specify an array type without any item");
    return;
  }

  if (value.length > 1) {
    context.logger.warn(
      "You tried to specify an array type with multiple items. Please use the 'enum' option if you want to specify an enum.",
    );
    return;
  }

  const itemsSchema = await loadType(context, { type: value[0] });

  // TODO: Better warn stack trace
  if (!itemsSchema) {
    context.logger.warn("You tried to specify an array type with an item that resolves to undefined.");
    return;
  }

  return {
    type: "array",
    items: itemsSchema,
  };
};

export const ClassTypeLoader: TypeLoaderFn = async (context, value) => {
  if (typeof value !== "function" || !value.prototype) {
    return;
  }

  const model = value.name;

  if (context.schemas[model]) {
    return { $ref: schemaPath(model) };
  }

  const schema: SetRequired<OpenAPIV3.SchemaObject, "properties" | "required"> = {
    type: "object",
    properties: {},
    required: [],
  };

  const properties = PropertyMetadataStorage.getMetadata(value.prototype);

  if (!properties) {
    context.logger.warn(`You tried to use '${model}' as a type but it does not contain any ApiProperty.`);
  }

  context.schemas[model] = schema;

  for (const [key, property] of Object.entries(properties)) {
    const { required, type, name, enum: e, schema: s, ...metadata } = property as any;
    schema.properties[key] = {
      ...(await loadType(context, property)),
      ...metadata,
    };

    if (property.required) {
      schema.required.push(key);
    }
  }

  return { $ref: schemaPath(model) };
};

export async function loadType(
  context: Context,
  options: TypeOptions,
): Promise<OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined> {
  if (options.schema) {
    return options.schema;
  }

  if (options.enum) {
    const enumValues = getEnumValues(options.enum);
    const enumType = getEnumType(enumValues);

    return {
      type: enumType,
      enum: enumValues,
    };
  }

  if (!options.type) {
    context.logger.warn("Failed to infer type from property");
    return;
  }

  const thunk = isThunk(options.type);
  const value = thunk ? (options.type as Function)(context) : options.type;

  for (const loader of [PrimitiveTypeLoader, ...context.typeLoaders, ClassTypeLoader]) {
    const result = await loader(context, value, options.type);
    if (result) {
      return result;
    }
  }

  context.logger.warn(`You tried to use '${options.type.toString()}' as a type but no loader supports it ${thunk}`);
}
