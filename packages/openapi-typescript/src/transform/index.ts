import { performance } from "node:perf_hooks";
import {
  interfaceDecl,
  NEVER,
  OperationsDeclaration,
  renderFooterDeclaration,
  STRING,
  stripTypeTrivia,
  type TSNode,
  tsParenthesize,
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
 * Extract lines from a nonempty braced root, excluding outer compositions.
 * Hook-produced $defs bodies use aliases, which also allow mapped types.
 * Empty or nonbraced roots retain the Record<string, never> fallback.
 */
function typeLiteralMembers(expression: TSNode): TSNode[] | undefined {
  const source = stripTypeTrivia(expression);
  if (!source.startsWith("{") || !source.endsWith("}") || tsParenthesize(source) !== source) {
    return undefined;
  }
  const body = source.slice(1, -1);
  // Keep generated member indentation while allowing hooks to supply inline or
  // otherwise formatted object types. Compositions cannot become interfaces.
  return stripTypeTrivia(body)
    ? body
        .replace(/^\r?\n/, "")
        .replace(/\r?\n[ \t]*$/, "")
        .split("\n")
    : undefined;
}

// Inline helper types for readOnly/writeOnly markers (when readWriteMarkers is enabled)
// Fast path for `any` in generic clients.
// Rebuild readonly array methods from resolved elements, keeping their own properties and length.
// Inline the readonly data mapping to avoid reserving another generated root type name.
const READ_WRITE_HELPER_TYPES: TSNode[] = [
  `export type $Read<T> = {
    readonly $read: T;
};`,
  `export type $Write<T> = {
    readonly $write: T;
};`,
  `export type Readable<T> = 0 extends 1 & T ? any : T extends $Write<any> ? never : T extends $Read<infer U> ? Readable<U> : T extends (infer E)[] ? Readable<E>[] : T extends readonly (infer E)[] ? Readable<{
    [K in keyof T as K extends number ? number extends K ? never : K : K extends keyof readonly unknown[] ? never : K]: T[K];
}> & {
    readonly length: T["length"];
} & readonly Readable<E>[] : T extends (...args: never[]) => unknown ? T : T extends object ? {
    [K in keyof T as NonNullable<T[K]> extends $Write<any> ? never : K]: Readable<T[K]>;
} : T;`,
  `export type Writable<T> = 0 extends 1 & T ? any : T extends $Read<any> ? never : T extends $Write<infer U> ? Writable<U> : T extends (infer E)[] ? Writable<E>[] : T extends readonly (infer E)[] ? Writable<{
    [K in keyof T as K extends number ? number extends K ? never : K : K extends keyof readonly unknown[] ? never : K]: T[K];
}> & {
    readonly length: T["length"];
} & readonly Writable<E>[] : T extends (...args: never[]) => unknown ? T : T extends object ? {
    [K in keyof T as NonNullable<T[K]> extends $Read<any> ? never : K]: Writable<T[K]>;
} & {
    [K in keyof T as NonNullable<T[K]> extends $Read<any> ? K : never]?: never;
} : T;`,
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
        const members = typeLiteralMembers(subType);
        if (members?.length) {
          type.push(
            ctx.exportType || (root === "$defs" && ctx.postTransform)
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
