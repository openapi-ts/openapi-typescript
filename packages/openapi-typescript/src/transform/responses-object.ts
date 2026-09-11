import {
  addJSDocComment,
  INDENT,
  NEVER,
  oapiRef,
  propertySignature,
  type TSNode,
  tsPropertyIndex,
  typeLiteral,
} from "../lib/ts.js";
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
  indent = "",
): TSNode {
  const memberIndent = `${indent}${INDENT}`;
  const type: TSNode[] = [];

  for (const [responseCode, responseObject] of getEntries(responsesObject, options.ctx)) {
    const responseType =
      "$ref" in responseObject
        ? oapiRef(responseObject.$ref, undefined, { indent: memberIndent })
        : transformResponseObject(
            responseObject,
            {
              ...options,
              path: createRef([options.path, "responses", responseCode]),
            },
            memberIndent,
          );
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex(responseCode),
        /* type          */ type: responseType,
        /* modifiers     */ readonly: options.ctx.immutable,
        comment: addJSDocComment(responseObject, memberIndent),
        indent: memberIndent,
      }),
    );
  }

  return type.length ? typeLiteral(type, indent) : NEVER;
}
