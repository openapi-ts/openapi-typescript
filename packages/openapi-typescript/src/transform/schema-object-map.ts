import type { GlobalContext, ParameterObject, SchemaObject } from "../types.js";
import { escObjKey, getEntries, getSchemaObjectComment, indent, tsReadonly } from "../utils.js";
import transformParameterObject from "./parameter-object.js";
import transformPathItemObject, { Method } from "./path-item-object.js";
import transformSchemaObject from "./schema-object.js";

export interface TransformSchemaMapOptions {
  /** The full ID for this object (mostly used in error messages) */
  path: string;
  /** Shared context */
  ctx: GlobalContext;
}

export default function transformSchemaObjectMap(schemaObjMap: Record<string, SchemaObject>, { path, ctx }: TransformSchemaMapOptions): string {
  // test for Schema Object, just in case
  if (
    ("type" in schemaObjMap && typeof schemaObjMap.type === "string") ||
    ("allOf" in schemaObjMap && Array.isArray(schemaObjMap.allOf)) ||
    ("oneOf" in schemaObjMap && Array.isArray(schemaObjMap.oneOf)) ||
    ("anyOf" in schemaObjMap && Array.isArray(schemaObjMap.anyOf))
  ) {
    return transformSchemaObject(schemaObjMap, { path, ctx });
  }

  let { indentLv } = ctx;
  const output: string[] = ["{"];
  indentLv++;
  outer: for (const [name, schemaObject] of getEntries(schemaObjMap, ctx.alphabetize, ctx.excludeDeprecated)) {
    if (!schemaObject || typeof schemaObject !== "object") continue;
    const c = getSchemaObjectComment(schemaObject as SchemaObject, indentLv);
    if (c) output.push(indent(c, indentLv));
    let key = escObjKey(name);
    if (ctx.immutableTypes || schemaObject.readOnly) key = tsReadonly(key);

    // Test for Path Item Object
    if (!("type" in schemaObject) && !("$ref" in schemaObject)) {
      for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as Method[]) {
        if (method in schemaObject) {
          output.push(indent(`${key}: ${transformPathItemObject(schemaObject, { path: `${path}${name}`, ctx: { ...ctx, indentLv } })};`, indentLv));
          continue outer;
        }
      }
    }

    // Test for Parameter
    if ("in" in schemaObject) {
      output.push(indent(`${key}: ${transformParameterObject(schemaObject as ParameterObject, { path: `${path}${name}`, ctx: { ...ctx, indentLv } })};`, indentLv));
      continue;
    }

    // Otherwise, this is a Schema Object
    output.push(indent(`${key}: ${transformSchemaObject(schemaObject, { path: `${path}${name}`, ctx: { ...ctx, indentLv } })};`, indentLv));
  }
  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
