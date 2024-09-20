import type { OpenAPIV3 } from "openapi-types";
import type { DocumentBuilder } from "../builders/document-builder";
import type { SchemaType } from "../types";

export async function resolveType(
  document: DocumentBuilder,
  type: SchemaType,
): Promise<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> {
  if (Array.isArray(type)) {
    return {
      type: "array",
      items: await resolveType(document, type[0]),
    };
  }

  if (typeof type === "string") {
    return {
      type: type as OpenAPIV3.NonArraySchemaObjectType, // TODO: Fix that
    };
  }

  if (type === String) {
    return {
      type: "string",
    };
  }

  if (type === Number) {
    return {
      type: "number",
    };
  }

  if (type === Boolean) {
    return {
      type: "boolean",
    };
  }

  if (typeof type === "object" && "$ref" in type) {
    return type;
  }

  return document.resolve(type);
}
