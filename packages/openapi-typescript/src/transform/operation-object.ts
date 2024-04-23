import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import type { OperationObject, RequestBodyObject, TransformNodeOptions } from "../types.js";
import { transformParametersArray } from "./parameters-array.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponsesObject from "./responses-object.js";

/**
 * Transform OperationObject nodes (4.8.10)
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export default function transformOperationObject(
  operationObject: OperationObject,
  options: TransformNodeOptions,
): ts.TypeElement[] {
  const type: ts.TypeElement[] = [];

  // parameters
  type.push(...transformParametersArray(operationObject.parameters ?? [], options));

  // requestBody
  if (operationObject.requestBody) {
    const requestBodyType =
      "$ref" in operationObject.requestBody
        ? oapiRef(operationObject.requestBody.$ref)
        : transformRequestBodyObject(operationObject.requestBody, {
            ...options,
            path: createRef([options.path, "requestBody"]),
          });
    const required = !!(
      "$ref" in operationObject.requestBody
        ? options.ctx.resolve<RequestBodyObject>(operationObject.requestBody.$ref)
        : operationObject.requestBody
    )?.required;
    const property = ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex("requestBody"),
      /* questionToken */ required ? undefined : QUESTION_TOKEN,
      /* type          */ requestBodyType,
    );
    addJSDocComment(operationObject.requestBody, property);
    type.push(property);
  } else {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */ tsPropertyIndex("requestBody"),
        /* questionToken */ QUESTION_TOKEN,
        /* type          */ NEVER,
      ),
    );
  }

  // responses
  type.push(
    ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex("responses"),
      /* questionToken */ undefined,
      /* type          */ transformResponsesObject(operationObject.responses ?? {}, options),
    ),
  );

  return type;
}

/** inject an operation at the top level */
export function injectOperationObject(
  operationId: string,
  operationObject: OperationObject,
  options: TransformNodeOptions,
): void {
  // find or create top-level operations interface
  let operations = options.ctx.injectFooter.find(
    (node) => ts.isInterfaceDeclaration(node) && (node as ts.InterfaceDeclaration).name.text === "operations",
  ) as unknown as ts.InterfaceDeclaration;
  if (!operations) {
    operations = ts.factory.createInterfaceDeclaration(
      /* modifiers       */ tsModifiers({
        export: true,
        // important: do NOT make this immutable
      }),
      /* name            */ ts.factory.createIdentifier("operations"),
      /* typeParameters  */ undefined,
      /* heritageClauses */ undefined,
      /* members         */ [],
    );
    options.ctx.injectFooter.push(operations);
  }

  // inject operation object
  const type = transformOperationObject(operationObject, options);
  // @ts-expect-error this is OK to mutate
  operations.members = ts.factory.createNodeArray([
    ...operations.members,
    ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex(operationId),
      /* questionToken */ undefined,
      /* type          */ ts.factory.createTypeLiteralNode(type),
    ),
  ]);
}
