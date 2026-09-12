import { performance } from "node:perf_hooks";
import {
  addJSDocComment,
  INDENT,
  indexSignature,
  oapiRef,
  propertySignature,
  type TSNode,
  tsPropertyIndex,
  typeLiteral,
} from "../lib/ts.js";
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
 * Escape a URL for use inside a template literal type (`` `…` ``).
 *
 * A backtick would terminate the literal, and a backslash would either introduce
 * an escape sequence or (when trailing) escape the closing backtick or the `$`
 * of a `${…}` substitution, silently turning the type into a plain string.
 */
function escapeTemplateLiteral(text: string): string {
  return text.replace(/[`\\]/g, (match) => `\\${match}`);
}

/**
 * Transform the PathsObject node (4.8.8)
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export default function transformPathsObject(pathsObject: PathsObject, ctx: GlobalContext, indent = ""): TSNode {
  const memberIndent = `${indent}${INDENT}`;
  const type: TSNode[] = [];
  for (const [url, pathItemObject] of getEntries(pathsObject, ctx)) {
    if (!pathItemObject || typeof pathItemObject !== "object") {
      continue;
    }

    const pathT = performance.now();

    // handle $ref
    if ("$ref" in pathItemObject) {
      type.push(
        propertySignature({
          /* modifiers     */ readonly: ctx.immutable,
          /* name          */ name: tsPropertyIndex(url),
          /* type          */ type: oapiRef(pathItemObject.$ref, undefined, { indent: memberIndent }),
          comment: addJSDocComment(pathItemObject, memberIndent),
          indent: memberIndent,
        }),
      );
    } else {
      const pathItemType = transformPathItemObject(
        pathItemObject,
        {
          path: createRef(["paths", url]),
          ctx,
        },
        memberIndent,
      );

      // pathParamsAsTypes
      if (ctx.pathParamsAsTypes && url.includes("{")) {
        const pathParams = extractPathParams(pathItemObject, ctx);
        const matches = url.match(PATH_PARAM_RE);
        // the URL becomes the body of a template literal type, so anything that
        // could break out of it (a backtick, a backslash, or a `${`) is escaped
        let rawPath = `\`${escapeTemplateLiteral(url)}\``;
        if (matches) {
          for (const match of matches) {
            const paramName = match.slice(1, -1);
            const param = pathParams[paramName];
            // rawPath is already escaped, including characters inside the
            // placeholder name. Match that representation when replacing it.
            const escapedMatch = escapeTemplateLiteral(match);
            switch (param?.schema?.type) {
              case "number":
              case "integer":
                rawPath = rawPath.replace(escapedMatch, `\${number}`);
                break;
              case "boolean":
                rawPath = rawPath.replace(escapedMatch, `\${boolean}`);
                break;
              default:
                rawPath = rawPath.replace(escapedMatch, `\${string}`);
                break;
            }
          }
          // note: the template literal type is emitted verbatim — it used to be
          // round-tripped through the TypeScript parser for exactly this reason
          type.push(
            indexSignature({
              /* modifiers     */ readonly: ctx.immutable,
              /* parameters    */ keyName: "path",
              /* type          */ keyType: rawPath,
              /* type          */ valueType: pathItemType,
              indent: memberIndent,
            }),
          );
          continue;
        }
      }

      type.push(
        propertySignature({
          /* modifiers     */ readonly: ctx.immutable,
          /* name          */ name: tsPropertyIndex(url),
          /* type          */ type: pathItemType,
          indent: memberIndent,
        }),
      );

      debug(`Transformed path "${url}"`, "ts", performance.now() - pathT);
    }
  }

  return typeLiteral(type, indent);
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
