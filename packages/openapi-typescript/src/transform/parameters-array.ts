import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import type { ParameterObject, ReferenceObject, TransformNodeOptions } from "../types.js";
import transformParameterObject from "./parameter-object.js";

/**
 * Synthetic type. Array of (ParameterObject | ReferenceObject)s found in OperationObject and PathItemObject.
 */
export function transformParametersArray(
  parametersArray: (ParameterObject | ReferenceObject)[],
  options: TransformNodeOptions,
): ts.TypeElement[] {
  const type: ts.TypeElement[] = [];

  // parameters
  const paramType: ts.TypeElement[] = [];
  for (const paramIn of ["query", "header", "path", "cookie"] as ParameterObject["in"][]) {
    const paramLocType: ts.TypeElement[] = [];
    let operationParameters = parametersArray.map((param) => ({
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
