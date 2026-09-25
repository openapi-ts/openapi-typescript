import {
  addJSDocComment,
  INDENT,
  NEVER,
  OperationsDeclaration,
  oapiRef,
  propertySignature,
  type TSNode,
  tsPropertyIndex,
  typeLiteral,
} from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import type { OperationObject, RequestBodyObject, TransformNodeOptions } from "../types.js";
import { transformParametersArray } from "./parameters-array.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponsesObject from "./responses-object.js";

/**
 * Transform OperationObject nodes (4.8.10)
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 *
 * Returns the *members* of the operation object type, already indented at
 * `indent` (the indentation of the produced member lines).
 */
export default function transformOperationObject(
  operationObject: OperationObject,
  options: TransformNodeOptions,
  indent = "",
): TSNode[] {
  const memberIndent = indent;
  const type: TSNode[] = [];

  // parameters
  type.push(...transformParametersArray(operationObject.parameters ?? [], options, memberIndent));

  // requestBody
  if (operationObject.requestBody) {
    const requestBodyType =
      "$ref" in operationObject.requestBody
        ? oapiRef(operationObject.requestBody.$ref, undefined, { indent: memberIndent })
        : transformRequestBodyObject(
            operationObject.requestBody,
            {
              ...options,
              path: createRef([options.path, "requestBody"]),
            },
            memberIndent,
          );
    const required = !!(
      "$ref" in operationObject.requestBody
        ? options.ctx.resolve<RequestBodyObject>(operationObject.requestBody.$ref)
        : operationObject.requestBody
    )?.required;
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex("requestBody"),
        /* type          */ type: requestBodyType,
        /* questionToken */ optional: !required,
        /* modifiers     */ readonly: options.ctx.immutable,
        comment: addJSDocComment(operationObject.requestBody, memberIndent),
        indent: memberIndent,
      }),
    );
  } else {
    type.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex("requestBody"),
        /* questionToken */ optional: true,
        /* type          */ type: NEVER,
        /* modifiers     */ readonly: options.ctx.immutable,
        indent: memberIndent,
      }),
    );
  }

  // responses
  type.push(
    propertySignature({
      /* name          */ name: tsPropertyIndex("responses"),
      /* type          */ type: transformResponsesObject(operationObject.responses ?? {}, options, memberIndent),
      /* modifiers     */ readonly: options.ctx.immutable,
      indent: memberIndent,
    }),
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
    (declaration): declaration is OperationsDeclaration => declaration instanceof OperationsDeclaration,
  );
  if (!operations) {
    operations = new OperationsDeclaration();
    options.ctx.injectFooter.push(operations);
  }

  // inject operation object
  const type = transformOperationObject(operationObject, options, `${INDENT}${INDENT}`);
  operations.add(
    propertySignature({
      /* modifiers     */ readonly: options.ctx.immutable,
      /* name          */ name: tsPropertyIndex(operationId),
      /* type          */ type: typeLiteral(type, INDENT),
      indent: INDENT,
    }),
  );
}
