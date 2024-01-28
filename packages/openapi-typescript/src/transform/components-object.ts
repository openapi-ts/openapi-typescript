import ts from "typescript";
import {
  NEVER,
  QUESTION_TOKEN,
  addJSDocComment,
  tsModifiers,
  tsPropertyIndex,
} from "../lib/ts.js";
import { createRef, debug, getEntries } from "../lib/utils.js";
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
): ts.TypeNode {
  const type: ts.TypeElement[] = [];

  for (const key of Object.keys(transformers) as ComponentTransforms[]) {
    const componentT = performance.now();

    const items: ts.TypeElement[] = [];
    if (componentsObject[key]) {
      for (const [name, item] of getEntries(componentsObject[key], ctx)) {
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

  return ts.factory.createTypeLiteralNode(type);
}
