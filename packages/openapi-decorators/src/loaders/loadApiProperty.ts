import type { DocumentBuilder } from "../builders/document-builder";
import type { SchemaBuilder } from "../builders/schema-builder";
import type { ApiPropertyOptions } from "../decorators/api-property";
import { resolveType } from "./loadType";

export function loadApiProperty(
  document: DocumentBuilder,
  schema: SchemaBuilder,
  name: string,
  apiProperty: ApiPropertyOptions,
) {
  const { type, required, ...rest } = apiProperty;

  const resolved = type ? resolveType(document, type) : undefined;

  schema.setProperty(name, { ...resolved, ...rest }, required ?? true);
}
