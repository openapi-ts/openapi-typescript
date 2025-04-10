import ts from "typescript";
import {
  NEVER,
  QUESTION_TOKEN,
  STRING,
  UNKNOWN,
  addJSDocComment,
  oapiRef,
  tsModifiers,
  tsPropertyIndex,
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
): ts.TypeNode {
  const type: ts.TypeElement[] = [];

  // headers
  const headersObject: ts.TypeElement[] = [];
  if (responseObject.headers) {
    for (const [name, headerObject] of getEntries(responseObject.headers, options.ctx)) {
      const optional = "$ref" in headerObject || headerObject.required ? undefined : QUESTION_TOKEN;
      const subType =
        "$ref" in headerObject
          ? oapiRef(headerObject.$ref)
          : transformHeaderObject(headerObject, {
              ...options,
              path: createRef([options.path, "headers", name]),
            });
      const property = ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */ tsPropertyIndex(name),
        /* questionToken */ optional,
        /* type          */ subType,
      );
      addJSDocComment(headerObject, property);
      headersObject.push(property);
    }
  }
  // allow additional unknown headers
  headersObject.push(
    ts.factory.createIndexSignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* parameters */ [
        ts.factory.createParameterDeclaration(
          /* modifiers      */ undefined,
          /* dotDotDotToken */ undefined,
          /* name           */ ts.factory.createIdentifier("name"),
          /* questionToken  */ undefined,
          /* type           */ STRING,
        ),
      ],
      /* type          */ UNKNOWN,
    ),
  );
  type.push(
    ts.factory.createPropertySignature(
      /* modifiers     */ undefined,
      /* name          */ tsPropertyIndex("headers"),
      /* questionToken */ undefined,
      /* type          */ ts.factory.createTypeLiteralNode(headersObject),
    ),
  );

  // content
  const contentObject: ts.TypeElement[] = [];
  if (responseObject.content) {
    for (const [contentType, mediaTypeObject] of getEntries(responseObject.content ?? {}, options.ctx)) {
      const property = ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */ tsPropertyIndex(contentType),
        /* questionToken */ undefined,
        /* type          */ transformMediaTypeObject(mediaTypeObject, {
          ...options,
          path: createRef([options.path, "content", contentType]),
        }),
      );
      contentObject.push(property);
    }
  }
  if (contentObject.length) {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ undefined,
        /* name          */ tsPropertyIndex("content"),
        /* questionToken */ undefined,
        /* type          */ ts.factory.createTypeLiteralNode(contentObject),
      ),
    );
  } else {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ undefined,
        /* name          */ tsPropertyIndex("content"),
        /* questionToken */ QUESTION_TOKEN,
        /* type          */ NEVER,
      ),
    );
  }

  return ts.factory.createTypeLiteralNode(type);
}
