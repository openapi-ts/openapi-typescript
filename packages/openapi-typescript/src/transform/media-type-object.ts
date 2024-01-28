import type ts from "typescript";
import { UNKNOWN } from "../lib/ts.js";
import type { MediaTypeObject, TransformNodeOptions } from "../types.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform MediaTypeObject nodes (4.8.14)
 * @see https://spec.openapis.org/oas/v3.1.0#media-type-object
 */
export default function transformMediaTypeObject(
  mediaTypeObject: MediaTypeObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  if (!mediaTypeObject.schema) {
    return UNKNOWN;
  }
  return transformSchemaObject(mediaTypeObject.schema, options);
}
