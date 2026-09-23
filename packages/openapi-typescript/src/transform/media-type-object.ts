import type ts from "typescript";
import { UNKNOWN } from "../lib/ts.js";
import type { MediaTypeObject, TransformNodeOptions } from "../types.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform MediaTypeObject nodes (4.8.14)
 * @see https://spec.openapis.org/oas/v3.1.0#media-type-object
 *
 * OpenAPI 3.2 adds `itemSchema` for sequential/streaming media types (e.g. text/event-stream).
 * Both `schema` (complete payload) and `itemSchema` (per-item) can coexist on the same object.
 * For type generation we prefer `itemSchema` when present, as it describes the shape consumers
 * will actually parse per event/chunk.
 */
export default function transformMediaTypeObject(
  mediaTypeObject: MediaTypeObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  const targetSchema = mediaTypeObject.itemSchema ?? mediaTypeObject.schema;
  if (!targetSchema) {
    return UNKNOWN;
  }
  return transformSchemaObject(targetSchema, options);
}
