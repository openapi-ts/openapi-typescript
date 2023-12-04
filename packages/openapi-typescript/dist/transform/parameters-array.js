import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import transformParameterObject from "./parameter-object.js";
export function transformParametersArray(parametersArray, options) {
    const type = [];
    const paramType = [];
    for (const paramIn of [
        "query",
        "header",
        "path",
        "cookie",
    ]) {
        const paramLocType = [];
        const operationParameters = parametersArray.map((param) => ({
            original: param,
            resolved: "$ref" in param
                ? options.ctx.resolve(param.$ref)
                : param,
        }));
        if (options.ctx.alphabetize) {
            operationParameters.sort((a, b) => (a.resolved?.name ?? "").localeCompare(b.resolved?.name ?? ""));
        }
        for (const { original, resolved } of operationParameters) {
            if (resolved?.in !== paramIn) {
                continue;
            }
            let optional = undefined;
            if (paramIn !== "path" && !resolved.required) {
                optional = QUESTION_TOKEN;
            }
            const subType = "$ref" in original
                ? oapiRef(original.$ref)
                : transformParameterObject(resolved, {
                    ...options,
                    path: createRef([
                        options.path ?? "",
                        "parameters",
                        resolved.in,
                        resolved.name,
                    ]),
                });
            const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(resolved?.name), optional, subType);
            addJSDocComment(resolved, property);
            paramLocType.push(property);
        }
        const allOptional = paramLocType.every((node) => !!node.questionToken);
        paramType.push(ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(paramIn), allOptional || !paramLocType.length
            ? QUESTION_TOKEN
            : undefined, paramLocType.length
            ? ts.factory.createTypeLiteralNode(paramLocType)
            : NEVER));
    }
    type.push(ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex("parameters"), !paramType.length ? QUESTION_TOKEN : undefined, paramType.length
        ? ts.factory.createTypeLiteralNode(paramType)
        : NEVER));
    return type;
}
//# sourceMappingURL=parameters-array.js.map