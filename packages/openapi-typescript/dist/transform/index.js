import ts from "typescript";
import { NEVER, STRING, tsModifiers, tsRecord } from "../lib/ts.js";
import { createRef, debug } from "../lib/utils.js";
import transformComponentsObject from "./components-object.js";
import transformPathsObject from "./paths-object.js";
import transformSchemaObject from "./schema-object.js";
import transformWebhooksObject from "./webhooks-object.js";
const transformers = {
    paths: transformPathsObject,
    webhooks: transformWebhooksObject,
    components: transformComponentsObject,
    $defs: (node, options) => transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options }),
};
export default function transformSchema(schema, ctx) {
    const type = [];
    for (const root of Object.keys(transformers)) {
        const emptyObj = ts.factory.createTypeAliasDeclaration(tsModifiers({ export: true }), root, undefined, tsRecord(STRING, NEVER));
        if (schema[root] && typeof schema[root] === "object") {
            const rootT = performance.now();
            const subType = transformers[root](schema[root], ctx);
            if (subType.members?.length) {
                type.push(ctx.exportType
                    ? ts.factory.createTypeAliasDeclaration(tsModifiers({ export: true }), root, undefined, subType)
                    : ts.factory.createInterfaceDeclaration(tsModifiers({ export: true }), root, undefined, undefined, subType.members));
                debug(`${root} done`, "ts", performance.now() - rootT);
            }
            else {
                type.push(emptyObj);
                debug(`${root} done (skipped)`, "ts", 0);
            }
        }
        else {
            type.push(emptyObj);
            debug(`${root} done (skipped)`, "ts", 0);
        }
    }
    let hasOperations = false;
    for (const injectedType of ctx.injectFooter) {
        if (!hasOperations &&
            injectedType?.name?.escapedText === "operations") {
            hasOperations = true;
        }
        type.push(injectedType);
    }
    if (!hasOperations) {
        type.push(ts.factory.createTypeAliasDeclaration(tsModifiers({ export: true }), "operations", undefined, tsRecord(STRING, NEVER)));
    }
    return type;
}
//# sourceMappingURL=index.js.map