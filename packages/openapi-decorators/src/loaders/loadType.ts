import type { OpenAPIV3 } from "openapi-types";
import type { DocumentBuilder } from "../builders/document-builder";
import type { SchemaType } from "../types";
import { loadSchema } from "./loadSchema";

export function resolveType(
  document: DocumentBuilder,
  type: SchemaType,
): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
  if (typeof type === "string") {
    return {
      type,
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

  if (typeof type === "object") {
    return type;
  }

  return loadSchema(document, type.prototype);
}
