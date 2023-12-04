import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import { transformParametersArray } from "./parameters-array.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponsesObject from "./responses-object.js";
export default function transformOperationObject(operationObject, options) {
    const type = [];
    type.push(...transformParametersArray(operationObject.parameters ?? [], options));
    if (operationObject.requestBody) {
        const requestBodyType = "$ref" in operationObject.requestBody
            ? oapiRef(operationObject.requestBody.$ref)
            : transformRequestBodyObject(operationObject.requestBody, {
                ...options,
                path: createRef([options.path, "requestBody"]),
            });
        const required = !!("$ref" in operationObject.requestBody
            ? options.ctx.resolve(operationObject.requestBody.$ref)
            : operationObject.requestBody)?.required;
        const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex("requestBody"), required ? undefined : QUESTION_TOKEN, requestBodyType);
        addJSDocComment(operationObject.requestBody, property);
        type.push(property);
    }
    else {
        type.push(ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex("requestBody"), QUESTION_TOKEN, NEVER));
    }
    type.push(ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex("responses"), undefined, transformResponsesObject(operationObject.responses ?? {}, options)));
    return type;
}
export function injectOperationObject(operationId, operationObject, options) {
    let operations = options.ctx.injectFooter.find((node) => ts.isInterfaceDeclaration(node) &&
        node.name.text === "operations");
    if (!operations) {
        operations = ts.factory.createInterfaceDeclaration(tsModifiers({
            export: true,
        }), ts.factory.createIdentifier("operations"), undefined, undefined, []);
        options.ctx.injectFooter.push(operations);
    }
    const type = transformOperationObject(operationObject, options);
    operations.members = ts.factory.createNodeArray([
        ...operations.members,
        ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(operationId), undefined, ts.factory.createTypeLiteralNode(type)),
    ]);
}
//# sourceMappingURL=operation-object.js.map