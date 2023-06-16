import type { GlobalContext, ReferenceObject, SchemaObject } from "../types.js";
import { escObjKey, escStr, getEntries, getSchemaObjectComment, indent, parseRef, tsArrayOf, tsIntersectionOf, tsOmit, tsOneOf, tsOptionalProperty, tsReadonly, tsTupleOf, tsUnionOf, tsWithRequired } from "../utils.js";

export interface TransformSchemaObjectOptions {
  /** The full ID for this object (mostly used in error messages) */
  path: string;
  /** Shared context */
  ctx: GlobalContext;
}

export default function transformSchemaObject(schemaObject: SchemaObject | ReferenceObject, options: TransformSchemaObjectOptions): string {
  const result = defaultSchemaObjectTransform(schemaObject, options);
  if (typeof options.ctx.postTransform === "function") {
    const postResult = options.ctx.postTransform(result, options);
    if (postResult) return postResult;
  }
  return result;
}

export function defaultSchemaObjectTransform(schemaObject: SchemaObject | ReferenceObject, { path, ctx }: TransformSchemaObjectOptions): string {
  let { indentLv } = ctx;

  // const fallback (primitives) return passed value
  if (!schemaObject || typeof schemaObject !== "object") return schemaObject;
  // const fallback (array) return tuple
  if (Array.isArray(schemaObject)) {
    const finalType = tsTupleOf(...schemaObject);
    return ctx.immutableTypes ? tsReadonly(finalType) : finalType;
  }

  // $ref
  if ("$ref" in schemaObject) {
    return schemaObject.$ref;
  }

  // transform()
  if (typeof ctx.transform === "function") {
    const result = ctx.transform(schemaObject, { path, ctx });
    if (result) return result;
  }

  // const (valid for any type)
  if (schemaObject.const !== null && schemaObject.const !== undefined) {
    return transformSchemaObject(escStr(schemaObject.const) as any, {
      path,
      ctx: { ...ctx, immutableTypes: false, indentLv: indentLv + 1 }, // note: guarantee readonly happens once, here
    });
  }

  // enum (valid for any type)
  if (schemaObject.enum) {
    let items = schemaObject.enum as any[];
    if ("type" in schemaObject) {
      if (schemaObject.type === "string" || (Array.isArray(schemaObject.type) && schemaObject.type.includes("string"))) items = items.map((t) => escStr(t || "")); // empty/missing values are empty strings
    }
    // if no type, assume "string"
    else {
      items = items.map((t) => escStr(t || ""));
    }
    return tsUnionOf(...items, ...(schemaObject.nullable || ("type" in schemaObject && Array.isArray(schemaObject.type) && schemaObject.type.includes("null")) ? ["null"] : []));
  }

  // oneOf (no discriminator)
  if ("oneOf" in schemaObject && !schemaObject.oneOf.some((t) => "$ref" in t && ctx.discriminators[t.$ref])) {
    const maybeTypes = schemaObject.oneOf.map((item) => transformSchemaObject(item, { path, ctx }));
    if (maybeTypes.some((t) => typeof t === "string" && t.includes("{"))) return tsOneOf(...maybeTypes); // OneOf<> helper needed if any objects present ("{")
    return tsUnionOf(...maybeTypes); // otherwise, TS union works for primitives
  }

  if ("type" in schemaObject) {
    // array type
    if (Array.isArray(schemaObject.type)) {
      return tsOneOf(...schemaObject.type.map((t) => transformSchemaObject({ ...schemaObject, type: t }, { path, ctx })));
    }

    // "type": "null"
    if (schemaObject.type === "null") return schemaObject.type;

    // "type": "string" / "type": "null"
    if (schemaObject.type === "string" || schemaObject.type === "boolean") {
      return schemaObject.nullable ? tsUnionOf(schemaObject.type, "null") : schemaObject.type;
    }

    // "type": "number" / "type": "integer"
    if (schemaObject.type === "number" || schemaObject.type === "integer") {
      return schemaObject.nullable ? tsUnionOf("number", "null") : "number";
    }

    // "type": "array"
    if (schemaObject.type === "array") {
      indentLv++;
      let itemType = "unknown";
      let isTupleType = false;
      if (schemaObject.items) {
        if (Array.isArray(schemaObject.items)) {
          // tuple type support
          isTupleType = true;
          const result: string[] = [];
          schemaObject.items.forEach((item) => {
            result.push(transformSchemaObject(item, { path, ctx: { ...ctx, indentLv } }));
          });
          itemType = `[${result.join(",")}]`;
        } else {
          itemType = transformSchemaObject(schemaObject.items, { path, ctx: { ...ctx, indentLv } });
        }
      }
      const minItems: number = typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0 ? schemaObject.minItems : 0;
      const maxItems: number | undefined = typeof schemaObject.maxItems === "number" && schemaObject.maxItems >= 0 && minItems <= schemaObject.maxItems ? schemaObject.maxItems : undefined;
      const estimateCodeSize = typeof maxItems !== "number" ? minItems : (maxItems * (maxItems + 1) - minItems * (minItems - 1)) / 2;
      // export types
      if (ctx.supportArrayLength && (minItems !== 0 || maxItems !== undefined) && estimateCodeSize < 30) {
        if (typeof schemaObject.maxItems !== "number") {
          itemType = tsTupleOf(...Array.from({ length: minItems }).map(() => itemType), `...${tsArrayOf(itemType)}`);
          return ctx.immutableTypes || schemaObject.readOnly ? tsReadonly(itemType) : itemType;
        } else {
          return tsUnionOf(
            ...Array.from({ length: (maxItems ?? 0) - minItems + 1 })
              .map((_, i) => i + minItems)
              .map((n) => {
                const t = tsTupleOf(...Array.from({ length: n }).map(() => itemType));
                return ctx.immutableTypes || schemaObject.readOnly ? tsReadonly(t) : t;
              })
          );
        }
      }
      if (!isTupleType) {
        // Do not use tsArrayOf when it is a tuple type
        itemType = tsArrayOf(itemType);
      }
      itemType = ctx.immutableTypes || schemaObject.readOnly ? tsReadonly(itemType) : itemType;
      return schemaObject.nullable ? tsUnionOf(itemType, "null") : itemType;
    }
  }

  // "type": "object" (explicit)
  // "anyOf" / "allOf" (object type implied)

  // core type: properties + additionalProperties
  const coreType: string[] = [];
  if (("properties" in schemaObject && schemaObject.properties && Object.keys(schemaObject.properties).length) || ("additionalProperties" in schemaObject && schemaObject.additionalProperties)) {
    indentLv++;
    for (const [k, v] of getEntries(schemaObject.properties ?? {}, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(v, indentLv);
      if (c) coreType.push(indent(c, indentLv));
      let key = escObjKey(k);
      let isOptional = !Array.isArray(schemaObject.required) || !schemaObject.required.includes(k);
      if (isOptional && ctx.defaultNonNullable && "default" in v) isOptional = false; // if --default-non-nullable specified and this has a default, it’s no longer optional
      if (isOptional) key = tsOptionalProperty(key);
      if (ctx.immutableTypes || schemaObject.readOnly) key = tsReadonly(key);
      coreType.push(indent(`${key}: ${transformSchemaObject(v, { path, ctx: { ...ctx, indentLv } })};`, indentLv));
    }
    if (schemaObject.additionalProperties || ctx.additionalProperties) {
      let addlType = "unknown";
      if (typeof schemaObject.additionalProperties === "object") {
        if (!Object.keys(schemaObject.additionalProperties).length) {
          addlType = "unknown";
        } else {
          addlType = transformSchemaObject(schemaObject.additionalProperties as SchemaObject, {
            path,
            ctx: { ...ctx, indentLv },
          });
        }
      }
      coreType.push(indent(`[key: string]: ${tsUnionOf(addlType ? addlType : "unknown", "undefined")};`, indentLv)); // note: `| undefined` is required to mesh with possibly-undefined keys
    }
    indentLv--;
  }

  // discriminators
  for (const k of ["oneOf", "allOf", "anyOf"] as ("oneOf" | "allOf" | "anyOf")[]) {
    if (!(k in schemaObject)) continue;
    const discriminatorRef: ReferenceObject | undefined = (schemaObject as any)[k].find((t: SchemaObject | ReferenceObject) => "$ref" in t && ctx.discriminators[t.$ref]);
    if (discriminatorRef) {
      const discriminator = ctx.discriminators[discriminatorRef.$ref];
      let value = parseRef(path).path.pop()!;
      if (discriminator.mapping) {
        // Mapping value can either be a fully-qualified ref (#/components/schemas/XYZ) or a schema name (XYZ)
        const matchedValue = Object.entries(discriminator.mapping).find(([_, v]) => (!v.startsWith("#") && v === value) || (v.startsWith("#") && parseRef(v).path.pop() === value));
        if (matchedValue) value = matchedValue[0]; // why was this designed backwards!?
      }
      coreType.unshift(indent(`${escObjKey(discriminator.propertyName)}: ${escStr(value)};`, indentLv + 1));
      break;
    }
  }

  // close coreType
  let finalType = coreType.length ? `{\n${coreType.join("\n")}\n${indent("}", indentLv)}` : "";

  /** collect oneOf/allOf/anyOf with Omit<> for discriminators */
  function collectCompositions(items: (SchemaObject | ReferenceObject)[]): string[] {
    const output: string[] = [];
    for (const item of items) {
      const itemType = transformSchemaObject(item, { path, ctx: { ...ctx, indentLv } });
      if ("$ref" in item && ctx.discriminators[item.$ref]) {
        output.push(tsOmit(itemType, [ctx.discriminators[item.$ref].propertyName]));
        continue;
      }
      output.push(itemType);
    }
    return output;
  }
  // oneOf (discriminator)
  if ("oneOf" in schemaObject && Array.isArray(schemaObject.oneOf)) {
    const oneOfType = tsOneOf(...collectCompositions(schemaObject.oneOf));
    finalType = finalType ? tsIntersectionOf(finalType, oneOfType) : oneOfType;
  } else {
    // allOf
    if ("allOf" in schemaObject && Array.isArray(schemaObject.allOf)) {
      finalType = tsIntersectionOf(...(finalType ? [finalType] : []), ...collectCompositions(schemaObject.allOf));
      if ("required" in schemaObject && Array.isArray(schemaObject.required)) {
        finalType = tsWithRequired(finalType, schemaObject.required);
      }
    }
    // anyOf
    if ("anyOf" in schemaObject && Array.isArray(schemaObject.anyOf)) {
      const anyOfTypes = tsUnionOf(...collectCompositions(schemaObject.anyOf));
      finalType = finalType ? tsIntersectionOf(finalType, anyOfTypes) : anyOfTypes;
    }
  }

  // nullable (3.0)
  if (schemaObject.nullable) finalType = tsUnionOf(finalType || "Record<string, unknown>", "null");

  if (finalType) return finalType;

  // any type
  if (!("type" in schemaObject)) return "unknown";

  // if no type could be generated, fall back to “empty object” type
  return ctx.emptyObjectsUnknown ? "Record<string, unknown>" : "Record<string, never>";
}
