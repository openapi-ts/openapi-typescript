import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import type {
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  TransformNodeOptions,
} from "../types.js";
import transformOperationObject, { injectOperationObject } from "./operation-object.js";
import { transformParametersArray } from "./parameters-array.js";

export type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

/**
 * Transform PathItem nodes (4.8.9)
 * @see https://spec.openapis.org/oas/v3.1.0#path-item-object
 */
export default function transformPathItemObject(pathItem: PathItemObject, options: TransformNodeOptions): ts.TypeNode {
  const type: ts.TypeElement[] = [];

  // parameters
  type.push(
    ...transformParametersArray(pathItem.parameters ?? [], {
      ...options,
      path: createRef([options.path, "parameters"]),
    }),
  );

  // methods
  for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as Method[]) {
    const operationObject = pathItem[method];
    if (
      !operationObject ||
      (options.ctx.excludeDeprecated &&
        ("$ref" in operationObject ? options.ctx.resolve<OperationObject>(operationObject.$ref) : operationObject)
          ?.deprecated)
    ) {
      type.push(
        ts.factory.createPropertySignature(
          /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
          /* name          */ tsPropertyIndex(method),
          /* questionToken */ QUESTION_TOKEN,
          /* type          */ NEVER,
        ),
      );
      continue;
    }

    // fold top-level PathItem parameters into method-level, with the latter overriding the former
    const keyedParameters: Record<string, ParameterObject | ReferenceObject> = {};
    if (!("$ref" in operationObject)) {
      // important: OperationObject parameters come last, and will override any conflicts with PathItem parameters
      for (const parameter of [...(pathItem.parameters ?? []), ...(operationObject.parameters ?? [])]) {
        // fix: #1798, use unique key
        const name =
          "$ref" in parameter
            ? `${options.ctx.resolve<ParameterObject>(parameter.$ref)?.in}-${options.ctx.resolve<ParameterObject>(parameter.$ref)?.name}`
            : `${parameter.in}-${parameter.name}`;
        if (name) {
          keyedParameters[name] = parameter;
        }
      }
    }

    let operationType: ts.TypeNode;
    if ("$ref" in operationObject) {
      operationType = oapiRef(operationObject.$ref);
    }
    // if operationId exists, move into an `operations` export and pass the reference in here
    else if (operationObject.operationId) {
      // workaround for issue caused by redocly ref parsing: https://github.com/openapi-ts/openapi-typescript/issues/1542
      const operationId = operationObject.operationId.replace(HASH_RE, "/");
      operationType = oapiRef(createRef(["operations", operationId]));
      injectOperationObject(
        operationId,
        { ...operationObject, parameters: Object.values(keyedParameters) },
        { ...options, path: createRef([options.path, method]) },
      );
    } else {
      operationType = ts.factory.createTypeLiteralNode(
        transformOperationObject(
          { ...operationObject, parameters: Object.values(keyedParameters) },
          { ...options, path: createRef([options.path, method]) },
        ),
      );
    }
    const property = ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex(method),
      /* questionToken */ undefined,
      /* type          */ operationType,
    );
    addJSDocComment(operationObject, property);
    type.push(property);
  }

  return ts.factory.createTypeLiteralNode(type);
}

const HASH_RE = /#/g;
