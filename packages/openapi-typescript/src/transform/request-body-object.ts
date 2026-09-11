import {
  addJSDocComment,
  INDENT,
  NEVER,
  propertySignature,
  type TSNode,
  tsPropertyIndex,
  typeLiteral,
} from "../lib/ts.js";
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
  indent = "",
): TSNode {
  const memberIndent = `${indent}${INDENT}`;
  const contentIndent = `${memberIndent}${INDENT}`;
  const type: TSNode[] = [];
  for (const [contentType, mediaTypeObject] of getEntries(requestBodyObject.content ?? {}, options.ctx)) {
    const nextPath = createRef([options.path, "content", contentType]);
    const mediaType =
      "$ref" in mediaTypeObject
        ? transformSchemaObject(
            mediaTypeObject,
            {
              ...options,
              path: nextPath,
            },
            false,
            contentIndent,
          )
        : transformMediaTypeObject(
            mediaTypeObject,
            {
              ...options,
              path: nextPath,
            },
            contentIndent,
          );
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex(contentType),
        /* type          */ type: mediaType,
        /* modifiers     */ readonly: options.ctx.immutable,
        comment: addJSDocComment(mediaTypeObject, contentIndent),
        indent: contentIndent,
      }),
    );
  }

  const contentMembers = type.length
    ? type
    : [
        // add `"*/*": never` if no media types are defined
        propertySignature({
          /* name          */ name: tsPropertyIndex("*/*"),
          /* questionToken */ optional: true,
          /* type          */ type: NEVER,
          indent: contentIndent,
        }),
      ];

  return typeLiteral(
    [
      propertySignature({
        /* name          */ name: tsPropertyIndex("content"),
        /* type          */ type: typeLiteral(contentMembers, memberIndent),
        /* modifiers     */ readonly: options.ctx.immutable,
        indent: memberIndent,
      }),
    ],
    indent,
  );
}
