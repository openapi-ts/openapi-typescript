import ts from "typescript";
import { performance } from "node:perf_hooks";
import { addJSDocComment, oapiRef, stringToAST, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef, debug, getEntries } from "../lib/utils.js";
import type {
  GlobalContext,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
  ReferenceObject,
} from "../types.js";
import transformPathItemObject, { type Method } from "./path-item-object.js";

const PATH_PARAM_RE = /\{[^}]+\}/g;

/**
 * Transform the PathsObject node (4.8.8)
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export default function transformPathsObject(pathsObject: PathsObject, ctx: GlobalContext): ts.TypeNode {
  const type: ts.TypeElement[] = [];
  for (const [url, pathItemObject] of getEntries(pathsObject, ctx)) {
    if (!pathItemObject || typeof pathItemObject !== "object") {
      continue;
    }

    const pathT = performance.now();

    // handle $ref
    if ("$ref" in pathItemObject) {
      const property = ts.factory.createPropertySignature(
        /* modifiers     */ tsModifiers({ readonly: ctx.immutable }),
        /* name          */ tsPropertyIndex(url),
        /* questionToken */ undefined,
        /* type          */ oapiRef(pathItemObject.$ref),
      );
      addJSDocComment(pathItemObject, property);
      type.push(property);
    } else {
      const pathItemType = transformPathItemObject(pathItemObject, {
        path: createRef(["paths", url]),
        ctx,
      });

      // pathParamsAsTypes
      if (ctx.pathParamsAsTypes && url.includes("{")) {
        const pathParams = extractPathParams(pathItemObject, ctx);
        const matches = url.match(PATH_PARAM_RE);
        let rawPath = `\`${url}\``;
        if (matches) {
          for (const match of matches) {
            const paramName = match.slice(1, -1);
            const param = pathParams[paramName];
            switch (param?.schema?.type) {
              case "number":
              case "integer":
                rawPath = rawPath.replace(match, "${number}");
                break;
              case "boolean":
                rawPath = rawPath.replace(match, "${boolean}");
                break;
              default:
                rawPath = rawPath.replace(match, "${string}");
                break;
            }
          }
          // note: creating a string template literal’s AST manually is hard!
          // just pass an arbitrary string to TS
          const pathType = (stringToAST(rawPath)[0] as any)?.expression;
          if (pathType) {
            type.push(
              ts.factory.createIndexSignature(
                /* modifiers     */ tsModifiers({ readonly: ctx.immutable }),
                /* parameters    */ [
                  ts.factory.createParameterDeclaration(
                    /* modifiers      */ undefined,
                    /* dotDotDotToken */ undefined,
                    /* name           */ "path",
                    /* questionToken  */ undefined,
                    /* type           */ pathType,
                    /* initializer    */ undefined,
                  ),
                ],
                /* type          */ pathItemType,
              ),
            );
            continue;
          }
        }
      }

      type.push(
        ts.factory.createPropertySignature(
          /* modifiers     */ tsModifiers({ readonly: ctx.immutable }),
          /* name          */ tsPropertyIndex(url),
          /* questionToken */ undefined,
          /* type          */ pathItemType,
        ),
      );

      debug(`Transformed path "${url}"`, "ts", performance.now() - pathT);
    }
  }

  return ts.factory.createTypeLiteralNode(type);
}

function extractPathParams(pathItemObject: PathItemObject, ctx: GlobalContext) {
  const params: Record<string, ParameterObject> = {};
  for (const p of pathItemObject.parameters ?? []) {
    const resolved = "$ref" in p && p.$ref ? ctx.resolve<ParameterObject>(p.$ref) : (p as ParameterObject);
    if (resolved && resolved.in === "path") {
      params[resolved.name] = resolved;
    }
  }
  for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as Method[]) {
    if (!(method in pathItemObject)) {
      continue;
    }
    const resolvedMethod = (pathItemObject[method] as ReferenceObject).$ref
      ? ctx.resolve<OperationObject>((pathItemObject[method] as ReferenceObject).$ref)
      : (pathItemObject[method] as OperationObject);
    if (resolvedMethod?.parameters) {
      for (const p of resolvedMethod.parameters) {
        const resolvedParam = "$ref" in p && p.$ref ? ctx.resolve<ParameterObject>(p.$ref) : (p as ParameterObject);
        if (resolvedParam && resolvedParam.in === "path") {
          params[resolvedParam.name] = resolvedParam;
        }
      }
    }
  }
  return params;
}
