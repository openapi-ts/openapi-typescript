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
export default function transformPathItemObject(
  pathItem: PathItemObject,
  options: TransformNodeOptions,
  indent = "",
): TSNode {
  const memberIndent = `${indent}${INDENT}`;
  const type: TSNode[] = [];

  // parameters
  type.push(
    ...transformParametersArray(
      pathItem.parameters ?? [],
      {
        ...options,
        path: createRef([options.path, "parameters"]),
      },
      memberIndent,
    ),
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
        propertySignature({
          /* modifiers     */ readonly: options.ctx.immutable,
          /* name          */ name: tsPropertyIndex(method),
          /* questionToken */ optional: true,
          /* type          */ type: NEVER,
          indent: memberIndent,
        }),
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

    let operationType: TSNode;
    if ("$ref" in operationObject) {
      operationType = oapiRef(operationObject.$ref, undefined, { indent: memberIndent });
    }
    // if operationId exists, move into an `operations` export and pass the reference in here
    else if (operationObject.operationId) {
      // workaround for issue caused by redocly ref parsing: https://github.com/openapi-ts/openapi-typescript/issues/1542
      const operationId = operationObject.operationId.replace(HASH_RE, "/");
      operationType = oapiRef(createRef(["operations", operationId]), undefined, { indent: memberIndent });
      injectOperationObject(
        operationId,
        { ...operationObject, parameters: Object.values(keyedParameters) },
        { ...options, path: createRef([options.path, method]) },
      );
    } else {
      operationType = typeLiteral(
        transformOperationObject(
          { ...operationObject, parameters: Object.values(keyedParameters) },
          { ...options, path: createRef([options.path, method]) },
          `${memberIndent}${INDENT}`,
        ),
        memberIndent,
      );
    }
    type.push(
      propertySignature({
        /* modifiers     */ readonly: options.ctx.immutable,
        /* name          */ name: tsPropertyIndex(method),
        /* type          */ type: operationType,
        comment: addJSDocComment(operationObject, memberIndent),
        indent: memberIndent,
      }),
    );
  }

  return typeLiteral(type, indent);
}

const HASH_RE = /#/g;
