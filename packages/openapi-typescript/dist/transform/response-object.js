import ts from "typescript";
import { NEVER, QUESTION_TOKEN, STRING, UNKNOWN, addJSDocComment, oapiRef, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import transformHeaderObject from "./header-object.js";
import transformMediaTypeObject from "./media-type-object.js";
export default function transformResponseObject(responseObject, options) {
    const type = [];
    const headersObject = [];
    if (responseObject.headers) {
        for (const [name, headerObject] of getEntries(responseObject.headers, options.ctx)) {
            const optional = "$ref" in headerObject || headerObject.required
                ? undefined
                : QUESTION_TOKEN;
            const subType = "$ref" in headerObject
                ? oapiRef(headerObject.$ref)
                : transformHeaderObject(headerObject, {
                    ...options,
                    path: createRef([options.path ?? "", "headers", name]),
                });
            const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(name), optional, subType);
            addJSDocComment(headerObject, property);
            headersObject.push(property);
        }
    }
    headersObject.push(ts.factory.createIndexSignature(tsModifiers({ readonly: options.ctx.immutable }), [
        ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier("name"), undefined, STRING),
    ], UNKNOWN));
    type.push(ts.factory.createPropertySignature(undefined, tsPropertyIndex("headers"), undefined, ts.factory.createTypeLiteralNode(headersObject)));
    const contentObject = [];
    if (responseObject.content) {
        for (const [contentType, mediaTypeObject] of getEntries(responseObject.content, options.ctx)) {
            const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(contentType), undefined, transformMediaTypeObject(mediaTypeObject, {
                ...options,
                path: createRef([options.path ?? "", "content", contentType]),
            }));
            contentObject.push(property);
        }
    }
    if (contentObject.length) {
        type.push(ts.factory.createPropertySignature(undefined, tsPropertyIndex("content"), undefined, ts.factory.createTypeLiteralNode(contentObject)));
    }
    else {
        type.push(ts.factory.createPropertySignature(undefined, tsPropertyIndex("content"), QUESTION_TOKEN, NEVER));
    }
    return ts.factory.createTypeLiteralNode(type);
}
//# sourceMappingURL=response-object.js.map