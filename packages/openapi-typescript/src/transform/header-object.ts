import { escapePointer } from "@redocly/openapi-core/lib/ref-utils.js";
import {
  addJSDocComment,
  INDENT,
  propertySignature,
  type TSNode,
  tsPropertyIndex,
  typeLiteral,
  UNKNOWN,
} from "../lib/ts.js";
import { getEntries } from "../lib/utils.js";
import type { HeaderObject, TransformNodeOptions } from "../types.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform HeaderObject nodes (4.8.21)
 * @see https://spec.openapis.org/oas/v3.1.0#header-object
 */
export default function transformHeaderObject(
  headerObject: HeaderObject,
  options: TransformNodeOptions,
  indent = "",
): TSNode {
  if (headerObject.schema) {
    return transformSchemaObject(headerObject.schema, options, false, indent);
  }

  if (headerObject.content) {
    const memberIndent = `${indent}${INDENT}`;
    const type: TSNode[] = [];
    for (const [contentType, mediaTypeObject] of getEntries(headerObject.content ?? {}, options.ctx)) {
      const nextPath = `${options.path ?? "#"}/${escapePointer(contentType)}`;
      const mediaType =
        "$ref" in mediaTypeObject
          ? transformSchemaObject(mediaTypeObject, { ...options, path: nextPath }, false, memberIndent)
          : transformMediaTypeObject(mediaTypeObject, { ...options, path: nextPath }, memberIndent);
      type.push(
        propertySignature({
          /* name          */ name: tsPropertyIndex(contentType),
          /* type          */ type: mediaType,
          /* modifiers     */ readonly: options.ctx.immutable,
          comment: addJSDocComment(mediaTypeObject, memberIndent),
          indent: memberIndent,
        }),
      );
    }
    return typeLiteral(type, indent);
  }

  return UNKNOWN;
}
