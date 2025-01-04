import ts, { type TypeLiteralNode } from "typescript";
import { performance } from "node:perf_hooks";
import { NEVER, STRING, stringToAST, tsModifiers, tsRecord } from "../lib/ts.js";
import { createRef, debug } from "../lib/utils.js";
import type { GlobalContext, OpenAPI3 } from "../types.js";
import transformComponentsObject from "./components-object.js";
import transformPathsObject from "./paths-object.js";
import transformSchemaObject from "./schema-object.js";
import transformWebhooksObject from "./webhooks-object.js";
import makeApiPathsEnum from "./paths-enum.js";

type SchemaTransforms = keyof Pick<OpenAPI3, "paths" | "webhooks" | "components" | "$defs">;

const transformers: Record<SchemaTransforms, (node: any, options: GlobalContext) => ts.Node | ts.Node[]> = {
  paths: transformPathsObject,
  webhooks: transformWebhooksObject,
  components: transformComponentsObject,
  $defs: (node, options) => transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options, schema: node }),
};

function isOperationsInterfaceNode(node: ts.Node) {
  const interfaceDeclaration = ts.isInterfaceDeclaration(node) ? node : undefined;
  return interfaceDeclaration?.name.escapedText === "operations";
}

export default function transformSchema(schema: OpenAPI3, ctx: GlobalContext) {
  const schemaNodes: ts.Node[] = [];

  // Traverse the schema root elements, gathering type information and accumulating
  // supporting nodes in `cts.injectNodes`.
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
            schemaNodes.push(
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
            schemaNodes.push(emptyObj);
            debug(`${root} done (skipped)`, "ts", 0);
          }
        } else if (ts.isTypeAliasDeclaration(subType)) {
          schemaNodes.push(subType);
        } else {
          schemaNodes.push(emptyObj);
          debug(`${root} done (skipped)`, "ts", 0);
        }
      }
    } else {
      schemaNodes.push(emptyObj);
      debug(`${root} done (skipped)`, "ts", 0);
    }
  }

  // Identify any operations node that was injected during traversal
  const operationsNodeIndex = ctx.injectNodes.findIndex(isOperationsInterfaceNode);
  const hasOperations = operationsNodeIndex !== -1;
  const operationsNode = hasOperations
    ? ctx.injectNodes.at(operationsNodeIndex)
    : ts.factory.createTypeAliasDeclaration(
        /* modifiers      */ tsModifiers({ export: true }),
        /* name           */ "operations",
        /* typeParameters */ undefined,
        /* type           */ tsRecord(STRING, NEVER),
      );

  return [
    // Inject user-defined header
    ...(ctx.inject ? (stringToAST(ctx.inject) as ts.Node[]) : []),
    // Inject gathered values and types, except operations
    ...ctx.injectNodes.filter((node) => node !== operationsNode),
    // Inject schema
    ...schemaNodes,
    // Inject operations
    ...(operationsNode ? [operationsNode] : []),
    // Inject paths enum
    ...(ctx.makePathsEnum && schema.paths ? [makeApiPathsEnum(schema.paths)] : []),
  ];
}
