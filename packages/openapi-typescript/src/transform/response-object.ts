import {
  addJSDocComment,
  INDENT,
  indexSignature,
  NEVER,
  oapiRef,
  propertySignature,
  type TSNode,
  tsPropertyIndex,
  typeLiteral,
  UNKNOWN,
} from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import type { ResponseObject, TransformNodeOptions } from "../types.js";
import transformHeaderObject from "./header-object.js";
import transformMediaTypeObject from "./media-type-object.js";

/**
 * Transform ResponseObject nodes (4.8.17)
 * @see https://spec.openapis.org/oas/v3.1.0#response-object
 */
export default function transformResponseObject(
  responseObject: ResponseObject,
  options: TransformNodeOptions,
  indent = "",
): TSNode {
  const memberIndent = `${indent}${INDENT}`;
  const type: TSNode[] = [];

  // headers
  const headerIndent = `${memberIndent}${INDENT}`;
  const headersObject: TSNode[] = [];
  if (responseObject.headers) {
    for (const [name, headerObject] of getEntries(responseObject.headers, options.ctx)) {
      const optional = !("$ref" in headerObject) && !headerObject.required;
      const subType =
        "$ref" in headerObject
          ? oapiRef(headerObject.$ref, undefined, { indent: headerIndent })
          : transformHeaderObject(
              headerObject,
              {
                ...options,
                path: createRef([options.path, "headers", name]),
              },
              headerIndent,
            );
      headersObject.push(
        propertySignature({
          /* name          */ name: tsPropertyIndex(name),
          /* type          */ type: subType,
          /* questionToken */ optional,
          /* modifiers     */ readonly: options.ctx.immutable,
          comment: addJSDocComment(headerObject, headerIndent),
          indent: headerIndent,
        }),
      );
    }
  }
  // allow additional unknown headers
  headersObject.push(
    indexSignature({
      /* parameters */ keyName: "name",
      /* type       */ valueType: UNKNOWN,
      /* modifiers  */ readonly: options.ctx.immutable,
      indent: headerIndent,
    }),
  );
  type.push(
    propertySignature({
      /* name          */ name: tsPropertyIndex("headers"),
      /* type          */ type: typeLiteral(headersObject, memberIndent),
      indent: memberIndent,
    }),
  );

  // content
  const contentIndent = `${memberIndent}${INDENT}`;
  const contentObject: TSNode[] = [];
  if (responseObject.content) {
    for (const [contentType, mediaTypeObject] of getEntries(responseObject.content ?? {}, options.ctx)) {
      contentObject.push(
        propertySignature({
          /* name          */ name: tsPropertyIndex(contentType),
          /* type          */ type: transformMediaTypeObject(
            mediaTypeObject,
            {
              ...options,
              path: createRef([options.path, "content", contentType]),
            },
            contentIndent,
          ),
          /* modifiers     */ readonly: options.ctx.immutable,
          comment: addJSDocComment(mediaTypeObject, contentIndent),
          indent: contentIndent,
        }),
      );
    }
  }
  if (contentObject.length) {
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex("content"),
        /* type          */ type: typeLiteral(contentObject, memberIndent),
        indent: memberIndent,
      }),
    );
  } else {
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex("content"),
        /* questionToken */ optional: true,
        /* type          */ type: NEVER,
        indent: memberIndent,
      }),
    );
  }

  return typeLiteral(type, indent);
}
