import { escapePointer } from "@redocly/openapi-core/lib/ref-utils.js";
import ts from "typescript";
import { addJSDocComment, tsModifiers, tsPropertyIndex, UNKNOWN } from "../lib/ts.js";
import { getEntries } from "../lib/utils.js";
import type { HeaderObject, TransformNodeOptions } from "../types.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform HeaderObject nodes (4.8.21)
 * @see https://spec.openapis.org/oas/v3.1.0#header-object
 */
export default function transformHeaderObject(headerObject: HeaderObject, options: TransformNodeOptions): ts.TypeNode {
  if (headerObject.schema) {
    return transformSchemaObject(headerObject.schema, options);
  }

  if (headerObject.content) {
    const type: ts.TypeElement[] = [];
    for (const [contentType, mediaTypeObject] of getEntries(headerObject.content ?? {}, options.ctx)) {
      const nextPath = `${options.path ?? "#"}/${escapePointer(contentType)}`;
      const mediaType =
        "$ref" in mediaTypeObject
          ? transformSchemaObject(mediaTypeObject, {
              ...options,
              path: nextPath,
            })
          : transformMediaTypeObject(mediaTypeObject, {
              ...options,
              path: nextPath,
            });
      const property = ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */ tsPropertyIndex(contentType),
        /* questionToken */ undefined,
        /* type          */ mediaType,
      );
      addJSDocComment(mediaTypeObject, property);
      type.push(property);
    }
    return ts.factory.createTypeLiteralNode(type);
  }

  return UNKNOWN;
}
