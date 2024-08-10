import type { OpenAPIV3 } from "openapi-types";
import type { DocumentBuilder } from "../builders/document-builder";
import { getApiProperties } from "../decorators/api-property";
import { loadApiProperty } from "./loadApiProperty";

export function loadSchema(document: DocumentBuilder, target: any): OpenAPIV3.ReferenceObject {
  const name = target.constructor.name;

  const existing = document.hasSchema(name);
  if (existing) {
    return existing;
  }

  const schema = document.createSchema(name);

  schema.setType("object");

  const properties = getApiProperties(target);

  for (const [name, apiProperty] of Object.entries(properties)) {
    loadApiProperty(document, schema, name, apiProperty);
  }

  return schema.ref;
}
