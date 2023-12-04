import { escapePointer } from "@redocly/openapi-core/lib/ref-utils.js";
import ts from "typescript";
import { addJSDocComment, tsModifiers, tsPropertyIndex, UNKNOWN, } from "../lib/ts.js";
import { getEntries } from "../lib/utils.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";
export default function transformHeaderObject(headerObject, options) {
    if (headerObject.schema) {
        return transformSchemaObject(headerObject.schema, options);
    }
    if (headerObject.content) {
        const type = [];
        for (const [contentType, mediaTypeObject] of getEntries(headerObject.content, options.ctx)) {
            const nextPath = `${options.path ?? "#"}/${escapePointer(contentType)}`;
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
        return ts.factory.createTypeLiteralNode(type);
    }
    return UNKNOWN;
}
//# sourceMappingURL=header-object.js.map