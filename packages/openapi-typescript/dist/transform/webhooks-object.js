import ts from "typescript";
import { tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef, getEntries } from "../lib/utils.js";
import transformPathItemObject from "./path-item-object.js";
export default function transformWebhooksObject(webhooksObject, options) {
    const type = [];
    for (const [name, pathItemObject] of getEntries(webhooksObject, options)) {
        type.push(ts.factory.createPropertySignature(tsModifiers({
            readonly: options.immutable,
        }), tsPropertyIndex(name), undefined, transformPathItemObject(pathItemObject, {
            path: createRef(["webhooks", name]),
            ctx: options,
        })));
    }
    return ts.factory.createTypeLiteralNode(type);
}
//# sourceMappingURL=webhooks-object.js.map