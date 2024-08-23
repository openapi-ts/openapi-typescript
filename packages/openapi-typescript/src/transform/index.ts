import ts, { type InterfaceDeclaration, type TypeLiteralNode } from "typescript";
import { performance } from "node:perf_hooks";
import { NEVER, STRING, stringToAST, tsModifiers, tsRecord } from "../lib/ts.js";
import { createRef, debug } from "../lib/utils.js";
import type { GlobalContext, OpenAPI3 } from "../types.js";
import transformComponentsObject from "./components-object.js";
import transformPathsObject from "./paths-object.js";
import transformSchemaObject from "./schema-object.js";
import transformWebhooksObject from "./webhooks-object.js";

type SchemaTransforms = keyof Pick<OpenAPI3, "paths" | "webhooks" | "components" | "$defs">;

const transformers: Record<SchemaTransforms, (node: any, options: GlobalContext) => ts.Node | ts.Node[]> = {
  paths: transformPathsObject,
  webhooks: transformWebhooksObject,
  components: transformComponentsObject,
  $defs: (node, options) => transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options }),
};

export default function transformSchema(schema: OpenAPI3, ctx: GlobalContext) {
  const type: ts.Node[] = [];

  if (ctx.inject) {
    const injectNodes = stringToAST(ctx.inject) as ts.Node[];
    type.push(...injectNodes);
  }

  for (const root of Object.keys(transformers) as SchemaTransforms[]) {
    const emptyObj = ts.factory.createTypeAliasDeclaration(
      /* modifiers      */ tsModifiers({ export: true }),
      /* name           */ root,
      /* typeParameters */ undefined,
      /* type           */ tsRecord(STRING, NEVER),
    );

    if (schema[root] && typeof schema[root] === "object") {
      const rootT = performance.now();
      const subTypes = ([] as ts.Node[]).concat(transformers[root](schema[root], ctx));
      for (const subType of subTypes) {
        if (ts.isTypeNode(subType)) {
          if ((subType as ts.TypeLiteralNode).members?.length) {
            type.push(
              ctx.exportType
                ? ts.factory.createTypeAliasDeclaration(
                    /* modifiers      */ tsModifiers({ export: true }),
                    /* name           */ root,
                    /* typeParameters */ undefined,
                    /* type           */ subType,
                  )
                : ts.factory.createInterfaceDeclaration(
                    /* modifiers       */ tsModifiers({ export: true }),
                    /* name            */ root,
                    /* typeParameters  */ undefined,
                    /* heritageClauses */ undefined,
                    /* members         */ (subType as TypeLiteralNode).members,
                  ),
            );
            debug(`${root} done`, "ts", performance.now() - rootT);
          } else {
            type.push(emptyObj);
            debug(`${root} done (skipped)`, "ts", 0);
          }
        } else if (ts.isTypeAliasDeclaration(subType)) {
          type.push(subType);
        } else {
          type.push(emptyObj);
          debug(`${root} done (skipped)`, "ts", 0);
        }
      }
    } else {
      type.push(emptyObj);
      debug(`${root} done (skipped)`, "ts", 0);
    }
  }

  // inject
  let hasOperations = false;
  for (const injectedType of ctx.injectFooter) {
    if (!hasOperations && (injectedType as InterfaceDeclaration)?.name?.escapedText === "operations") {
      hasOperations = true;
    }
    type.push(injectedType);
  }
  if (!hasOperations) {
    // if no operations created, inject empty operations type
    type.push(
      ts.factory.createTypeAliasDeclaration(
        /* modifiers      */ tsModifiers({ export: true }),
        /* name           */ "operations",
        /* typeParameters */ undefined,
        /* type           */ tsRecord(STRING, NEVER),
      ),
    );
  }

  return type;
}
