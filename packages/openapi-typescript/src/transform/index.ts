import ts, { TypeAliasDeclaration, TypeLiteralNode } from "typescript";
import { NEVER, STRING, tsModifiers, tsRecord } from "../lib/ts.js";
import { createRef } from "../lib/utils.js";
import { GlobalContext, OpenAPI3 } from "../types.js";
import transformComponentsObject from "./components-object.js";
import transformPathsObject from "./paths-object.js";
import transformSchemaObject from "./schema-object.js";
import transformWebhooksObject from "./webhooks-object.js";

type SchemaTransforms = keyof Pick<
  OpenAPI3,
  "paths" | "webhooks" | "components" | "$defs"
>;

const transformers: Record<
  SchemaTransforms,
  (node: any, options: GlobalContext) => ts.TypeNode // eslint-disable-line @typescript-eslint/no-explicit-any
> = {
  paths: transformPathsObject,
  webhooks: transformWebhooksObject,
  components: transformComponentsObject,
  $defs: (node, options) =>
    transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options }),
};

export default function transformSchema(schema: OpenAPI3, ctx: GlobalContext) {
  const type: ts.Node[] = [];

  for (const root of Object.keys(transformers) as SchemaTransforms[]) {
    if (schema[root]) {
      const subType = transformers[root](schema[root], ctx);
      type.push(
        ctx.exportType
          ? ts.factory.createTypeAliasDeclaration(
              /* modifiers      */ tsModifiers({
                export: true,
                readonly: ctx.immutableTypes,
              }),
              /* name           */ root,
              /* typeParameters */ undefined,
              /* type           */ subType,
            )
          : ts.factory.createInterfaceDeclaration(
              /* modifiers       */ tsModifiers({
                export: true,
                readonly: ctx.immutableTypes,
              }),
              /* name            */ root,
              /* typeParameters  */ undefined,
              /* heritageClauses */ undefined,
              /* members         */ (subType as TypeLiteralNode).members,
            ),
      );
    } else {
      type.push(
        ts.factory.createTypeAliasDeclaration(
          /* modifiers      */ tsModifiers({
            export: true,
            readonly: ctx.immutableTypes,
          }),
          /* name           */ root,
          /* typeParameters */ undefined,
          /* type           */ tsRecord(STRING, NEVER),
        ),
      );
    }
  }

  // inject
  let hasOperations = false;
  for (const injectedType of ctx.injectFooter) {
    if (
      (injectedType as TypeAliasDeclaration).name.escapedText === "operations"
    ) {
      hasOperations = true;
    }
    type.push(injectedType);
  }
  if (!hasOperations) {
    // if no operations created, inject empty operations type
    type.push(
      ts.factory.createTypeAliasDeclaration(
        /* modifiers      */ tsModifiers({
          export: true,
          readonly: ctx.immutableTypes,
        }),
        /* name           */ "operations",
        /* typeParameters */ undefined,
        /* type           */ tsRecord(STRING, NEVER),
      ),
    );
  }

  return type;
}
