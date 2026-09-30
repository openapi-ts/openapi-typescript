import { escapePointer } from "@redocly/openapi-core/lib/ref-utils.js";
import type ts from "typescript";
import { STRING } from "../lib/ts.js";
import type { ParameterObject, TransformNodeOptions } from "../types.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform ParameterObject nodes (4.8.12)
 * @see https://spec.openapis.org/oas/v3.1.0#parameter-object
 */
export default function transformParameterObject(
  parameterObject: ParameterObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  if (parameterObject.schema) {
    return transformSchemaObject(parameterObject.schema, options);
  }

  // Per OAS 3.x spec, a parameter with `content` MUST have exactly one entry.
  // Extract the schema from that single media type object.
  if (parameterObject.content) {
    const contentEntries = Object.entries(parameterObject.content);
    if (contentEntries.length > 0) {
      const [contentType, mediaTypeObject] = contentEntries[0];
      const nextPath = `${options.path ?? "#"}/content/${escapePointer(contentType)}`;
      if ("$ref" in mediaTypeObject) {
        return transformSchemaObject(mediaTypeObject, { ...options, path: nextPath });
      }
      return transformMediaTypeObject(mediaTypeObject, { ...options, path: nextPath });
    }
  }

  return STRING; // assume a parameter is a string by default rather than "unknown"
}
