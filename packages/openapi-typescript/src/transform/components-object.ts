import ts from "typescript";
import * as changeCase from "change-case";
import { performance } from "node:perf_hooks";
import { NEVER, QUESTION_TOKEN, addJSDocComment, tsModifiers, tsPropertyIndex } from "../lib/ts.js";
import { createRef, debug, getEntries } from "../lib/utils.js";
import type { ComponentsObject, GlobalContext, SchemaObject, TransformNodeOptions } from "../types.js";
import transformHeaderObject from "./header-object.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject from "./path-item-object.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponseObject from "./response-object.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Determines if a schema object represents an enum type to prevent duplicate exports
 * when using --root-types and --enum flags together.
 *
 * When both flags are enabled:
 * - --enum flag generates TypeScript enums at the bottom of the file
 * - --root-types flag would normally also export these as root type aliases
 * - This results in duplicate exports (both enum and type alias for the same schema)
 *
 * This function identifies enum schemas so they can be excluded from root type generation,
 * allowing only the TypeScript enum to be generated.
 *
 * @param schema The schema object to check
 * @returns true if the schema represents an enum type
 */
export function isEnumSchema(schema: unknown): boolean {
  return (
    typeof schema === "object" &&
    schema !== null &&
    !Array.isArray(schema) &&
    "enum" in schema &&
    Array.isArray((schema as any).enum) &&
    (!("type" in schema) || (schema as any).type !== "object") &&
    !("properties" in schema) &&
    !("additionalProperties" in schema)
  );
}

type ComponentTransforms = keyof Omit<ComponentsObject, "examples" | "securitySchemes" | "links" | "callbacks">;

const transformers: Record<ComponentTransforms, (node: any, options: TransformNodeOptions) => ts.TypeNode> = {
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
export default function transformComponentsObject(componentsObject: ComponentsObject, ctx: GlobalContext): ts.Node[] {
  const type: ts.TypeElement[] = [];
  const rootTypeAliases: { [key: string]: ts.TypeAliasDeclaration } = {};
  for (const key of Object.keys(transformers) as ComponentTransforms[]) {
    const componentT = performance.now();

    const items: ts.TypeElement[] = [];
    if (componentsObject[key]) {
      for (const [name, item] of getEntries<SchemaObject>(componentsObject[key], ctx)) {
        let subType = transformers[key](item, {
          path: createRef(["components", key, name]),
          schema: item,
          ctx,
        });

        let hasQuestionToken = false;
        if (ctx.transform) {
          const result = ctx.transform(item, {
            path: createRef(["components", key, name]),
            schema: item,
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
        addJSDocComment(item as unknown as any, property);
        items.push(property);

        if (ctx.rootTypes) {
          // Skip enum schemas when generating root types to prevent duplication (only when --enum flag is enabled)
          const shouldSkipEnumSchema = ctx.enum && key === "schemas" && isEnumSchema(item);

          if (!shouldSkipEnumSchema) {
            const componentKey = changeCase.pascalCase(singularizeComponentKey(key));
            let aliasName = `${componentKey}${changeCase.pascalCase(name)}`;

            // Add counter suffix (e.g. "_2") if conflict in name
            let conflictCounter = 1;

            while (rootTypeAliases[aliasName] !== undefined) {
              conflictCounter++;
              aliasName = `${componentKey}${changeCase.pascalCase(name)}_${conflictCounter}`;
            }
            const ref = ts.factory.createTypeReferenceNode(`components['${key}']['${name}']`);
            if (ctx.rootTypesNoSchemaPrefix && key === "schemas") {
              aliasName = aliasName.replace(componentKey, "");
            }
            const typeAlias = ts.factory.createTypeAliasDeclaration(
              /* modifiers      */ tsModifiers({ export: true }),
              /* name           */ aliasName,
              /* typeParameters */ undefined,
              /* type           */ ref,
            );
            rootTypeAliases[aliasName] = typeAlias;
          }
        }
      }
    }
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */ undefined,
        /* name          */ tsPropertyIndex(key),
        /* questionToken */ undefined,
        /* type          */ items.length ? ts.factory.createTypeLiteralNode(items) : NEVER,
      ),
    );

    debug(`Transformed components → ${key}`, "ts", performance.now() - componentT);
  }

  // Extract root types
  let rootTypes: ts.TypeAliasDeclaration[] = [];
  if (ctx.rootTypes) {
    rootTypes = Object.keys(rootTypeAliases).map((k) => rootTypeAliases[k]);
  }

  return [ts.factory.createTypeLiteralNode(type), ...rootTypes];
}

export function singularizeComponentKey(
  key: `x-${string}` | "schemas" | "responses" | "parameters" | "requestBodies" | "headers" | "pathItems",
): string {
  switch (key) {
    // Handle special singular case
    case "requestBodies":
      return "requestBody";
    // Default to removing the "s"
    default:
      return key.slice(0, -1);
  }
}
