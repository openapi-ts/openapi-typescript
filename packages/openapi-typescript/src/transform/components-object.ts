import { pascalCase } from "scule";
import ts from "typescript";
import {
  NEVER,
  QUESTION_TOKEN,
  addJSDocComment,
  tsModifiers,
  tsPropertyIndex,
  oapiRef,
} from "../lib/ts.js";
import {
  createRef,
  debug,
  getEntries,
  renameDuplicates,
} from "../lib/utils.js";
import type {
  ComponentsObject,
  GlobalContext,
  SchemaObject,
  TransformNodeOptions,
} from "../types.js";
import transformHeaderObject from "./header-object.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject from "./path-item-object.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponseObject from "./response-object.js";
import transformSchemaObject from "./schema-object.js";

type ComponentTransforms = keyof Omit<
  ComponentsObject,
  "examples" | "securitySchemes" | "links" | "callbacks"
>;

const transformers: Record<
  ComponentTransforms,
  (node: any, options: TransformNodeOptions) => ts.TypeNode // eslint-disable-line @typescript-eslint/no-explicit-any
> = {
  schemas: transformSchemaObject,
  responses: transformResponseObject,
  parameters: transformParameterObject,
  requestBodies: transformRequestBodyObject,
  headers: transformHeaderObject,
  pathItems: transformPathItemObject,
};

/**
 * Transform the ComponentsObject (4.8.7)
 * @see https://spec.openapis.org/oas/latest.html#components-object
 */
export default function transformComponentsObject(
  componentsObject: ComponentsObject,
  ctx: GlobalContext,
): [ts.TypeNode, ts.TypeAliasDeclaration[]] {
  const type: ts.TypeElement[] = [];
  const refs: ts.TypeAliasDeclaration[] = [];

  for (const key of Object.keys(transformers) as ComponentTransforms[]) {
    const componentT = performance.now();

    const items: ts.TypeElement[] = [];
    if (componentsObject[key]) {
      const entries = getEntries(componentsObject[key], ctx);
      for (const [name, item] of entries) {
        let subType = transformers[key](item, {
          path: createRef(["components", key, name]),
          ctx,
        });

        let hasQuestionToken = false;
        if (ctx.transform) {
          const result = ctx.transform(item as SchemaObject, {
            path: createRef(["components", key, name]),
            ctx,
          });
          if (result) {
            if ("schema" in result) {
              subType = result.schema;
              hasQuestionToken = result.questionToken;
            } else {
              subType = result;
            }
          }
        }

        const property = ts.factory.createPropertySignature(
          /* modifiers     */ tsModifiers({ readonly: ctx.immutable }),
          /* name          */ tsPropertyIndex(name),
          /* questionToken */ hasQuestionToken ? QUESTION_TOKEN : undefined,
          /* type          */ subType,
        );
        addJSDocComment(item as unknown as any, property); // eslint-disable-line @typescript-eslint/no-explicit-any
        items.push(property);
      }

      if (ctx.rootTypes) {
        const keySingular = key.slice(0, -1);
        const pascalNames = renameDuplicates(
          entries.map(([name]) => pascalCase(`${keySingular}-${name}`)),
        );
        for (let i = 0; i < entries.length; i++) {
          refs.push(
            ts.factory.createTypeAliasDeclaration(
              /* modifiers      */ tsModifiers({ export: true }),
              /* name           */ pascalNames[i],
              /* typeParameters */ undefined,
              /* type           */ oapiRef(
                createRef(["components", key, entries[i][0]]),
              ),
            ),
          );
        }
      }
    }
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ undefined,
        /* name          */ tsPropertyIndex(key),
        /* questionToken */ undefined,
        /* type          */ items.length
          ? ts.factory.createTypeLiteralNode(items)
          : NEVER,
      ),
    );

    debug(
      `Transformed components → ${key}`,
      "ts",
      performance.now() - componentT,
    );
  }

  return [ts.factory.createTypeLiteralNode(type), refs];
}
