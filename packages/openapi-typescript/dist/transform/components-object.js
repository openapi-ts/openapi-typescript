import ts from "typescript";
import { NEVER, QUESTION_TOKEN, addJSDocComment, tsModifiers, tsPropertyIndex, } from "../lib/ts.js";
import { createRef, debug, getEntries } from "../lib/utils.js";
import transformHeaderObject from "./header-object.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject from "./path-item-object.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponseObject from "./response-object.js";
import transformSchemaObject from "./schema-object.js";
const transformers = {
    schemas: transformSchemaObject,
    responses: transformResponseObject,
    parameters: transformParameterObject,
    requestBodies: transformRequestBodyObject,
    headers: transformHeaderObject,
    pathItems: transformPathItemObject,
};
export default function transformComponentsObject(componentsObject, ctx) {
    const type = [];
    for (const key of Object.keys(transformers)) {
        const componentT = performance.now();
        const items = [];
        if (componentsObject[key]) {
            for (const [name, item] of getEntries(componentsObject[key], ctx)) {
                let subType = transformers[key](item, {
                    path: createRef(["components", key, name]),
                    ctx,
                });
                let hasQuestionToken = false;
                if (ctx.transform) {
                    const result = ctx.transform(item, {
                        path: createRef(["components", key, name]),
                        ctx,
                    });
                    if (result) {
                        if ("schema" in result) {
                            subType = result.schema;
                            hasQuestionToken = result.questionToken;
                        }
                        else {
                            subType = result;
                        }
                    }
                }
                const property = ts.factory.createPropertySignature(tsModifiers({ readonly: ctx.immutable }), tsPropertyIndex(name), hasQuestionToken ? QUESTION_TOKEN : undefined, subType);
                addJSDocComment(item, property);
                items.push(property);
            }
        }
        type.push(ts.factory.createPropertySignature(undefined, tsPropertyIndex(key), undefined, items.length
            ? ts.factory.createTypeLiteralNode(items)
            : NEVER));
        debug(`Transformed components → ${key}`, "ts", performance.now() - componentT);
    }
    return ts.factory.createTypeLiteralNode(type);
}
//# sourceMappingURL=components-object.js.map