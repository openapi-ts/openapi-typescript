import ts from "typescript";
import { addJSDocComment, oapiRef, stringToAST, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef, debug, getEntries } from "../lib/utils.js";
import transformPathItemObject from "./path-item-object.js";
const PATH_PARAM_RE = /\{[^}]+\}/g;
export default function transformPathsObject(pathsObject, ctx) {
    const type = [];
    for (const [url, pathItemObject] of getEntries(pathsObject, ctx)) {
        if (!pathItemObject || typeof pathItemObject !== "object") {
            continue;
        }
        const pathT = performance.now();
        if ("$ref" in pathItemObject) {
            const property = ts.factory.createPropertySignature(tsModifiers({ readonly: ctx.immutable }), tsPropertyIndex(url), undefined, oapiRef(pathItemObject.$ref));
            addJSDocComment(pathItemObject, property);
        }
        else {
            const pathItemType = transformPathItemObject(pathItemObject, {
                path: createRef(["paths", url]),
                ctx,
            });
            if (ctx.pathParamsAsTypes && url.includes("{")) {
                const pathParams = extractPathParams(pathItemObject, ctx);
                const matches = url.match(PATH_PARAM_RE);
                let rawPath = `\`${url}\``;
                if (matches) {
                    for (const match of matches) {
                        const paramName = match.slice(1, -1);
                        const param = pathParams[paramName];
                        if (!param) {
                            rawPath = rawPath.replace(match, "${string}");
                        }
                        else {
                            rawPath = rawPath.replace(match, `$\{${param.schema?.type ?? "string"}}`);
                        }
                    }
                    const pathType = stringToAST(rawPath)[0]?.expression;
                    if (pathType) {
                        type.push(ts.factory.createIndexSignature(tsModifiers({ readonly: ctx.immutable }), [
                            ts.factory.createParameterDeclaration(undefined, undefined, "path", undefined, pathType, undefined),
                        ], pathItemType));
                        continue;
                    }
                }
            }
            type.push(ts.factory.createPropertySignature(tsModifiers({ readonly: ctx.immutable }), tsPropertyIndex(url), undefined, pathItemType));
            debug(`Transformed path "${url}"`, "ts", performance.now() - pathT);
        }
    }
    return ts.factory.createTypeLiteralNode(type);
}
function extractPathParams(pathItemObject, ctx) {
    const params = {};
    for (const p of pathItemObject.parameters ?? []) {
        const resolved = "$ref" in p && p.$ref
            ? ctx.resolve(p.$ref)
            : p;
        if (resolved && resolved.in === "path") {
            params[resolved.name] = resolved;
        }
    }
    for (const method of [
        "get",
        "put",
        "post",
        "delete",
        "options",
        "head",
        "patch",
        "trace",
    ]) {
        if (!(method in pathItemObject)) {
            continue;
        }
        const resolvedMethod = pathItemObject[method].$ref
            ? ctx.resolve(pathItemObject[method].$ref)
            : pathItemObject[method];
        if (resolvedMethod?.parameters) {
            for (const p of resolvedMethod.parameters) {
                const resolvedParam = "$ref" in p && p.$ref
                    ? ctx.resolve(p.$ref)
                    : p;
                if (resolvedParam && resolvedParam.in === "path") {
                    params[resolvedParam.name] = resolvedParam;
                }
            }
        }
    }
    return params;
}
//# sourceMappingURL=paths-object.js.map