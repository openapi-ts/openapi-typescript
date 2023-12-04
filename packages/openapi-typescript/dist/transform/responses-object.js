import ts from "typescript";
import { NEVER, addJSDocComment, tsModifiers, oapiRef, tsPropertyIndex, } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import transformResponseObject from "./response-object.js";
export default function transformResponsesObject(responsesObject, options) {
    const type = [];
    for (const [responseCode, responseObject] of getEntries(responsesObject, options.ctx)) {
        const responseType = "$ref" in responseObject
            ? oapiRef(responseObject.$ref)
            : transformResponseObject(responseObject, {
                ...options,
                path: createRef([options.path ?? "", "responses", responseCode]),
            });
        const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(responseCode), undefined, responseType);
        addJSDocComment(responseObject, property);
        type.push(property);
    }
    return type.length ? ts.factory.createTypeLiteralNode(type) : NEVER;
}
//# sourceMappingURL=responses-object.js.map