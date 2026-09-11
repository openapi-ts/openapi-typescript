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
 *
 * `indent` is the indentation of the produced property lines.
 */
export function transformParametersArray(
  parametersArray: (ParameterObject | ReferenceObject)[],
  options: TransformNodeOptions,
  indent = "",
): TSNode[] {
  const paramInIndent = `${indent}${INDENT}`;
  const paramIndent = `${paramInIndent}${INDENT}`;
  const type: TSNode[] = [];

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
  const paramType: TSNode[] = [];
  for (const paramIn of ["query", "header", "path", "cookie"] as ParameterObject["in"][]) {
    const paramLocType: TSNode[] = [];
    const optionals: boolean[] = [];
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
      const optional = paramIn !== "path" && !(resolved as ParameterObject).required;
      const subType =
        "$ref" in original
          ? oapiRef(original.$ref, resolved, { indent: paramIndent })
          : transformParameterObject(
              resolved as ParameterObject,
              {
                ...options,
                path: createRef([options.path, "parameters", resolved.in, resolved.name]),
              },
              paramIndent,
            );
      optionals.push(optional);
      paramLocType.push(
        propertySignature({
          /* name          */ name: tsPropertyIndex(resolved?.name),
          /* type          */ type: subType,
          /* questionToken */ optional,
          /* modifiers     */ readonly: options.ctx.immutable,
          comment: addJSDocComment(resolved, paramIndent),
          indent: paramIndent,
        }),
      );
    }
    const allOptional = optionals.every(Boolean);
    paramType.push(
      propertySignature({
        /* name          */ name: tsPropertyIndex(paramIn),
        /* type          */ type: paramLocType.length ? typeLiteral(paramLocType, paramInIndent) : NEVER,
        /* questionToken */ optional: allOptional || !paramLocType.length,
        /* modifiers     */ readonly: options.ctx.immutable,
        indent: paramInIndent,
      }),
    );
  }
  type.push(
    propertySignature({
      /* name          */ name: tsPropertyIndex("parameters"),
      /* type          */ type: paramType.length ? typeLiteral(paramType, indent) : NEVER,
      /* questionToken */ optional: !paramType.length,
      /* modifiers     */ readonly: options.ctx.immutable,
      indent,
    }),
  );

  return type;
}
