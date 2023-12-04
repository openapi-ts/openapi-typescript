import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import transformOperationObject, { injectOperationObject, } from "./operation-object.js";
import { transformParametersArray } from "./parameters-array.js";
export default function transformPathItemObject(pathItem, options) {
    const type = [];
    type.push(...transformParametersArray(pathItem.parameters ?? [], {
        ...options,
        path: createRef([options.path, "parameters"]),
    }));
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
        const operationObject = pathItem[method];
        if (!operationObject ||
            (options.ctx.excludeDeprecated &&
                ("$ref" in operationObject
                    ? options.ctx.resolve(operationObject.$ref)
                    : operationObject)?.deprecated)) {
            type.push(ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(method), QUESTION_TOKEN, NEVER));
            continue;
        }
        const keyedParameters = {};
        if (!("$ref" in operationObject)) {
            for (const parameter of [
                ...(pathItem.parameters ?? []),
                ...(operationObject.parameters ?? []),
            ]) {
                const name = "$ref" in parameter
                    ? options.ctx.resolve(parameter.$ref)?.name
                    : parameter.name;
                if (name) {
                    keyedParameters[name] = parameter;
                }
            }
        }
        let operationType;
        if ("$ref" in operationObject) {
            operationType = oapiRef(operationObject.$ref);
        }
        else if (operationObject.operationId) {
            operationType = oapiRef(createRef(["operations", operationObject.operationId]));
            injectOperationObject(operationObject.operationId, { ...operationObject, parameters: Object.values(keyedParameters) }, { ...options, path: createRef([options.path, method]) });
        }
        else {
            operationType = ts.factory.createTypeLiteralNode(transformOperationObject({ ...operationObject, parameters: Object.values(keyedParameters) }, { ...options, path: createRef([options.path, method]) }));
        }
        const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(method), undefined, operationType);
        addJSDocComment(operationObject, property);
        type.push(property);
    }
    return ts.factory.createTypeLiteralNode(type);
}
//# sourceMappingURL=path-item-object.js.map