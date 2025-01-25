import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import type { ParameterObject, ReferenceObject, TransformNodeOptions } from "../types.js";
import transformParameterObject from "./parameter-object.js";

// Regex to match path parameters in URL
const PATH_PARAM_RE = /\{([^}]+)\}/g;

/**
 * Create a synthetic path parameter object from a parameter name
 */
function createPathParameter(paramName: string): ParameterObject {
  return {
    name: paramName,
    in: "path",
    required: true,
    schema: { type: "string" },
  };
}

/**
 * Extract path parameters from a URL
 */
function extractPathParamsFromUrl(path: string): ParameterObject[] {
  const params: ParameterObject[] = [];
  const matches = path.match(PATH_PARAM_RE);
  if (matches) {
    for (const match of matches) {
      const paramName = match.slice(1, -1);
      params.push(createPathParameter(paramName));
    }
  }
  return params;
}

/**
 * Synthetic type. Array of (ParameterObject | ReferenceObject)s found in OperationObject and PathItemObject.
 */
export function transformParametersArray(
  parametersArray: (ParameterObject | ReferenceObject)[],
  options: TransformNodeOptions,
): ts.TypeElement[] {
  const type: ts.TypeElement[] = [];

  // Create a working copy of parameters array
  const workingParameters = [...parametersArray];

  // Generate path parameters if enabled
  if (options.ctx.generatePathParams && options.path) {
    const pathString = Array.isArray(options.path) ? options.path[0] : options.path;
    if (typeof pathString === "string") {
      const pathParams = extractPathParamsFromUrl(pathString);
      // Only add path parameters that aren't already defined
      for (const param of pathParams) {
        const exists = workingParameters.some((p) => {
          const resolved = "$ref" in p ? options.ctx.resolve<ParameterObject>(p.$ref) : p;
          return resolved?.in === "path" && resolved?.name === param.name;
        });
        if (!exists) {
          workingParameters.push(param);
        }
      }
    }
  }

  // parameters
  const paramType: ts.TypeElement[] = [];
  for (const paramIn of ["query", "header", "path", "cookie"] as ParameterObject["in"][]) {
    const paramLocType: ts.TypeElement[] = [];
    let operationParameters = workingParameters.map((param) => ({
      original: param,
      resolved: "$ref" in param ? options.ctx.resolve<ParameterObject>(param.$ref) : param,
    }));

    // this is the only array type in the spec, so we have to one-off sort here
    if (options.ctx.alphabetize) {
      operationParameters.sort((a, b) => (a.resolved?.name ?? "").localeCompare(b.resolved?.name ?? ""));
    }
    if (options.ctx.excludeDeprecated) {
      operationParameters = operationParameters.filter(
        ({ resolved }) => !resolved?.deprecated && !resolved?.schema?.deprecated,
      );
    }
    for (const { original, resolved } of operationParameters) {
      if (resolved?.in !== paramIn) {
        continue;
      }
      let optional: ts.QuestionToken | undefined = undefined;
      if (paramIn !== "path" && !(resolved as ParameterObject).required) {
        optional = QUESTION_TOKEN;
      }
      const subType =
        "$ref" in original
          ? oapiRef(original.$ref)
          : transformParameterObject(resolved as ParameterObject, {
              ...options,
              path: createRef([options.path, "parameters", resolved.in, resolved.name]),
            });
      const property = ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */ tsPropertyIndex(resolved?.name),
        /* questionToken */ optional,
        /* type          */ subType,
      );
      addJSDocComment(resolved, property);
      paramLocType.push(property);
    }
    const allOptional = paramLocType.every((node) => !!node.questionToken);
    paramType.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */ tsPropertyIndex(paramIn),
        /* questionToken */ allOptional || !paramLocType.length ? QUESTION_TOKEN : undefined,
        /* type          */ paramLocType.length ? ts.factory.createTypeLiteralNode(paramLocType) : NEVER,
      ),
    );
  }
  type.push(
    ts.factory.createPropertySignature(
      /* modifiers     */ tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */ tsPropertyIndex("parameters"),
      /* questionToken */ !paramType.length ? QUESTION_TOKEN : undefined,
      /* type          */ paramType.length ? ts.factory.createTypeLiteralNode(paramType) : NEVER,
    ),
  );

  return type;
}
