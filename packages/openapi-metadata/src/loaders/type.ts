import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context";
import type { TypeLoaderFn, TypeOptions } from "../types";
import type { SetRequired } from "type-fest";
import { getEnumType, getEnumValues } from "../utils/enum";
import { PropertyMetadataStorage } from "../metadata/property";
import { schemaPath } from "../utils/schema";
import { isThunk } from "../utils/metadata";

const PrimitiveTypeLoader: TypeLoaderFn = async (_context, value) => {
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

const ClassTypeLoader: TypeLoaderFn = async (context, value) => {
  if (typeof value !== "function" || !value.prototype) {
    return;
  }

  const model = value.name;

  if (context.schemas[model]) {
    return { $ref: schemaPath(model) };
  }

  const schema: SetRequired<OpenAPIV3.SchemaObject, "properties" | "required"> =
    {
      type: "object",
      properties: {},
      required: [],
    };

  const properties = PropertyMetadataStorage.getMetadata(value.prototype);

  if (!properties) {
    context.logger.warn(
      `You tried to use '${model}' as a type but it does not contain any ApiProperty.`,
    );

    return;
  }

  context.schemas[model] = schema;

  for (const [key, property] of Object.entries(properties)) {
    const {
      required,
      type,
      name,
      enum: e,
      schema: s,
      ...metadata
    } = property as any;
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
  if ("schema" in options) {
    return options.schema;
  }

  if ("enum" in options) {
    const enumValues = getEnumValues(options.enum);
    const enumType = getEnumType(enumValues);

    return {
      type: enumType,
      enum: enumValues,
    };
  }

  const thunk = isThunk(options.type);
  const value = thunk ? (options.type as Function)(context) : options.type;

  for (const loader of [
    PrimitiveTypeLoader,
    ...context.typeLoaders,
    ClassTypeLoader,
  ]) {
    const result = await loader(context, value, options.type);
    if (result) {
      return result;
    }
  }

  context.logger.warn(
    `You tried to use '${options.type.toString()}' as a type but no loader supports it ${thunk}`,
  );
}
