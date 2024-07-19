import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import type { RequestBodyObject, TransformNodeOptions } from "../types.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform RequestBodyObject nodes (4.8.13)
 * @see https://spec.openapis.org/oas/v3.1.0#request-body-object
 */
export default function transformRequestBodyObject(
  requestBodyObject: RequestBodyObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  const type: ts.TypeElement[] = [];
  for (const [contentType, mediaTypeObject] of getEntries(requestBodyObject.content ?? {}, options.ctx)) {
    const nextPath = createRef([options.path, contentType]);
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

  return ts.factory.createTypeLiteralNode([
    ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex("content"),
      /* questionToken */ undefined,
      /* type          */ ts.factory.createTypeLiteralNode(
        type.length
          ? type
          : // add `"*/*": never` if no media types are defined
            [
              ts.factory.createPropertySignature(
                /* modifiers     */ undefined,
                /* name          */ tsPropertyIndex("*/*"),
                /* questionToken */ QUESTION_TOKEN,
                /* type          */ NEVER,
              ),
            ],
      ),
    ),
  ]);
}
