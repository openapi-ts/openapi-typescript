import type { OpenAPIV3 } from "openapi-types";
import type { DocumentBuilder } from "../builders/document-builder";
import type { ApiPropertyOptions } from "../decorators/api-property";
import { resolveType } from "./loadType";

export async function loadApiProperty(
  document: DocumentBuilder,
  schema: OpenAPIV3.SchemaObject,
  name: string,
  apiProperty: ApiPropertyOptions,
) {
  const { type, required, ...rest } = apiProperty;

  const resolved = type ? await resolveType(document, type) : undefined;

  schema.properties = {
    ...schema.properties,
    [name]: {
      ...resolved,
      ...rest,
    },
  };

  if (required !== false) {
    schema.required = [...(schema.required ?? []), name];
  }
}
