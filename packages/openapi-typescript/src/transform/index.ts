import { performance } from "node:perf_hooks";
import {
  interfaceDecl,
  NEVER,
  OperationsDeclaration,
  renderFooterDeclaration,
  STRING,
  type TSNode,
  tsRecord,
  typeAlias,
} from "../lib/ts.js";
import { createRef, debug } from "../lib/utils.js";
import type { GlobalContext, OpenAPI3 } from "../types.js";
import transformComponentsObject from "./components-object.js";
import makeApiPathsEnum from "./paths-enum.js";
import transformPathsObject from "./paths-object.js";
import transformSchemaObject from "./schema-object.js";
import transformWebhooksObject from "./webhooks-object.js";

type SchemaTransforms = keyof Pick<OpenAPI3, "paths" | "webhooks" | "components" | "$defs">;

const transformers: Record<SchemaTransforms, (node: any, options: GlobalContext) => TSNode | TSNode[]> = {
  paths: transformPathsObject,
  webhooks: transformWebhooksObject,
  components: transformComponentsObject,
  $defs: (node, options) => transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options, schema: node }),
};

/**
 * Extract the members of a top-level object type expression.
 * Returns `undefined` when the expression is not an object type (in which case
 * the root falls back to `Record<string, never>`), mirroring the legacy
 * `.members?.length` check on the generated AST node.
 */
function typeLiteralMembers(expression: TSNode, indent: string): TSNode[] | undefined {
  const open = "{\n";
  const close = `\n${indent}}`;
  if (!expression.startsWith(open) || !expression.endsWith(close) || expression.length <= open.length + close.length) {
    return undefined;
  }
  const body = expression.slice(open.length, expression.length - close.length);
  return body.length ? body.split("\n") : undefined;
}

// Inline helper types for readOnly/writeOnly markers (when readWriteMarkers is enabled)
const READ_WRITE_HELPER_TYPES: TSNode[] = [
  "export type $Read<T> = {\n    readonly $read: T;\n};",
  "export type $Write<T> = {\n    readonly $write: T;\n};",
  "export type Readable<T> = T extends $Write<any> ? never : T extends $Read<infer U> ? Readable<U> : T extends (infer E)[] ? Readable<E>[] : T extends object ? {\n    [K in keyof T as NonNullable<T[K]> extends $Write<any> ? never : K]: Readable<T[K]>;\n} : T;",
  "export type Writable<T> = T extends $Read<any> ? never : T extends $Write<infer U> ? Writable<U> : T extends (infer E)[] ? Writable<E>[] : T extends object ? {\n    [K in keyof T as NonNullable<T[K]> extends $Read<any> ? never : K]: Writable<T[K]>;\n} & {\n    [K in keyof T as NonNullable<T[K]> extends $Read<any> ? K : never]?: never;\n} : T;",
];

export default function transformSchema(schema: OpenAPI3, ctx: GlobalContext): TSNode[] {
  const type: TSNode[] = [];

  // Add inline helper types for readOnly/writeOnly markers
  if (ctx.readWriteMarkers) {
    type.push(...READ_WRITE_HELPER_TYPES);
  }

  if (ctx.inject) {
    // emitted verbatim (previously round-tripped through the TypeScript printer)
    type.push(ctx.inject.trim());
  }

  for (const root of Object.keys(transformers) as SchemaTransforms[]) {
    const emptyObj = typeAlias(root, tsRecord(STRING, NEVER), {
      /* modifiers      */ export: true,
      /* indent         */ indent: "",
    });

    if (schema[root] && typeof schema[root] === "object") {
      const rootT = performance.now();
      const subTypes = ([] as TSNode[]).concat(transformers[root](schema[root], ctx));
      for (const [index, subType] of subTypes.entries()) {
        if (index > 0) {
          // extra top-level declarations (e.g. root types generated from `components`)
          type.push(subType);
          continue;
        }
        const members = typeLiteralMembers(subType, "");
        if (members?.length) {
          type.push(
            ctx.exportType
              ? typeAlias(root, subType, {
                  /* modifiers      */ export: true,
                  /* indent         */ indent: "",
                })
              : interfaceDecl(root, members, {
                  /* modifiers      */ export: true,
                  /* indent         */ indent: "",
                }),
          );
          debug(`${root} done`, "ts", performance.now() - rootT);
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
    if (!hasOperations && injectedType instanceof OperationsDeclaration) {
      hasOperations = true;
    }
    type.push(renderFooterDeclaration(injectedType));
  }
  if (!hasOperations) {
    // if no operations created, inject empty operations type
    type.push(
      typeAlias("operations", tsRecord(STRING, NEVER), {
        /* modifiers      */ export: true,
        /* indent         */ indent: "",
      }),
    );
  }

  if (ctx.makePathsEnum && schema.paths) {
    type.push(makeApiPathsEnum(schema.paths));
  }

  return type;
}
