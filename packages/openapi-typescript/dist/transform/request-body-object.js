import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";
export default function transformRequestBodyObject(requestBodyObject, options) {
    const type = [];
    for (const [contentType, mediaTypeObject] of getEntries(requestBodyObject.content, options.ctx)) {
        const nextPath = createRef([options.path, contentType]);
        const mediaType = "$ref" in mediaTypeObject
            ? transformSchemaObject(mediaTypeObject, {
                ...options,
                path: nextPath,
            })
            : transformMediaTypeObject(mediaTypeObject, {
                ...options,
                path: nextPath,
            });
        const property = ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex(contentType), undefined, mediaType);
        addJSDocComment(mediaTypeObject, property);
        type.push(property);
    }
    return ts.factory.createTypeLiteralNode([
        ts.factory.createPropertySignature(tsModifiers({ readonly: options.ctx.immutable }), tsPropertyIndex("content"), undefined, ts.factory.createTypeLiteralNode(type.length
            ? type
            :
                [
                    ts.factory.createPropertySignature(undefined, tsPropertyIndex("*/*"), QUESTION_TOKEN, NEVER),
                ])),
    ]);
}
//# sourceMappingURL=request-body-object.js.map