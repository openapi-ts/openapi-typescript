import ts from "typescript";
import { NEVER, addJSDocComment, tsModifiers, oapiRef, tsPropertyIndex } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import type { ResponsesObject, TransformNodeOptions } from "../types.js";
import transformResponseObject from "./response-object.js";

/**
 * Transform ResponsesObject nodes (4.8.16)
 * @see https://spec.openapis.org/oas/v3.1.0#responses-object
 */
export default function transformResponsesObject(
  responsesObject: ResponsesObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  const type: ts.TypeElement[] = [];

  for (const [responseCode, responseObject] of getEntries(responsesObject, options.ctx)) {
    const responseType =
      "$ref" in responseObject
        ? oapiRef(responseObject.$ref)
        : transformResponseObject(responseObject, {
            ...options,
            path: createRef([options.path, "responses", responseCode]),
          });
    const property = ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex(responseCode),
      /* questionToken */ undefined,
      /* type          */ responseType,
    );
    addJSDocComment(responseObject, property);
    type.push(property);
  }

  return type.length ? ts.factory.createTypeLiteralNode(type) : NEVER;
}
