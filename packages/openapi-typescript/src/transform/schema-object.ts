import type { DiscriminatorObject, GlobalContext, ReferenceObject, SchemaObject } from "../types.js";
import { escObjKey, escStr, getEntries, getSchemaObjectComment, indent, parseRef, tsArrayOf, tsIntersectionOf, tsOmit, tsOneOf, tsOptionalProperty, tsReadonly, tsTupleOf, tsUnionOf, tsWithRequired } from "../utils.js";
import transformSchemaObjectMap from "./schema-object-map.js";

// There’s just no getting around some really complex type intersections that TS
// has trouble following
/* eslint-disable @typescript-eslint/no-explicit-any */

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

  // boolean schemas
  if (typeof schemaObject === "boolean") {
    return schemaObject ? "unknown" : "never";
  }
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

  // enum (valid for any type, but for objects, treat as oneOf below)
  if (typeof schemaObject === "object" && !!schemaObject.enum && (schemaObject as any).type !== "object") {
    let items = schemaObject.enum as string[];
    if ("type" in schemaObject) {
      if (schemaObject.type === "string" || (Array.isArray(schemaObject.type) && (schemaObject.type as string[]).includes("string"))) {
        items = items.map((t) => escStr(t));
      }
    }
    // if no type, assume "string"
    else {
      items = items.map((t) => escStr(t || ""));
    }
    return tsUnionOf(...items, ...(schemaObject.nullable ? ["null"] : []));
  }

  // oneOf (no discriminator)
  const oneOf = ((typeof schemaObject === "object" && !schemaObject.discriminator && schemaObject.oneOf) || schemaObject.enum || undefined) as (SchemaObject | ReferenceObject)[] | undefined; // note: for objects, treat enum as oneOf
  if (oneOf && !oneOf.some((t) => "$ref" in t && ctx.discriminators[t.$ref])) {
    const oneOfNormalized = oneOf.map((item) => transformSchemaObject(item, { path, ctx }));
    if (schemaObject.nullable) oneOfNormalized.push("null");

    // handle oneOf + polymorphic array type
    if ("type" in schemaObject && Array.isArray(schemaObject.type)) {
      const coreTypes = schemaObject.type.map((t) => transformSchemaObject({ ...schemaObject, oneOf: undefined, type: t }, { path, ctx }));
      return tsUnionOf(...oneOfNormalized, ...coreTypes);
    }

    // OneOf<> helper needed if any objects present ("{")
    const oneOfTypes = oneOfNormalized.some((t) => typeof t === "string" && t.includes("{")) ? tsOneOf(...oneOfNormalized) : tsUnionOf(...oneOfNormalized);

    // handle oneOf + object type
    if ("type" in schemaObject && schemaObject.type === "object" && (schemaObject.properties || schemaObject.additionalProperties)) {
      return tsIntersectionOf(transformSchemaObject({ ...schemaObject, oneOf: undefined, enum: undefined } as any, { path, ctx }), oneOfTypes);
    }

    // default
    return oneOfTypes;
  }

  if ("type" in schemaObject) {
    // "type": "null"
    if (schemaObject.type === "null") return "null";

    // "type": "string", "type": "boolean"
    if (schemaObject.type === "string" || schemaObject.type === "boolean") {
      return schemaObject.nullable ? tsUnionOf(schemaObject.type, "null") : schemaObject.type;
    }

    // "type": "number", "type": "integer"
    if (schemaObject.type === "number" || schemaObject.type === "integer") {
      return schemaObject.nullable ? tsUnionOf("number", "null") : "number";
    }

    // "type": "array"
    if (schemaObject.type === "array") {
      indentLv++;
      let itemType = "unknown";
      let isTupleType = false;
      if (schemaObject.prefixItems || Array.isArray(schemaObject.items)) {
        // tuple type support
        isTupleType = true;
        const result: string[] = [];
        for (const item of schemaObject.prefixItems ?? (schemaObject.items as (SchemaObject | ReferenceObject)[])) {
          result.push(transformSchemaObject(item, { path, ctx: { ...ctx, indentLv } }));
        }
        itemType = `[${result.join(", ")}]`;
      } else if (schemaObject.items) {
        itemType = transformSchemaObject(schemaObject.items, { path, ctx: { ...ctx, indentLv } });
      }
      const min: number = typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0 ? schemaObject.minItems : 0;
      const max: number | undefined = typeof schemaObject.maxItems === "number" && schemaObject.maxItems >= 0 && min <= schemaObject.maxItems ? schemaObject.maxItems : undefined;
      const estimateCodeSize = typeof max !== "number" ? min : (max * (max + 1) - min * (min - 1)) / 2;
      // export types
      if (ctx.supportArrayLength && (min !== 0 || max !== undefined) && estimateCodeSize < 30) {
        if (typeof schemaObject.maxItems !== "number") {
          itemType = tsTupleOf(...Array.from({ length: min }).map(() => itemType), `...${tsArrayOf(itemType)}`);
          return ctx.immutableTypes || schemaObject.readOnly ? tsReadonly(itemType) : itemType;
        } else {
          return tsUnionOf(
            ...Array.from({ length: (max ?? 0) - min + 1 })
              .map((_, i) => i + min)
              .map((n) => {
                const t = tsTupleOf(...Array.from({ length: n }).map(() => itemType));
                return ctx.immutableTypes || schemaObject.readOnly ? tsReadonly(t) : t;
              }),
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

    // polymorphic, or 3.1 nullable
    if (Array.isArray(schemaObject.type)) {
      return tsUnionOf(...schemaObject.type.map((t) => transformSchemaObject({ ...schemaObject, type: t }, { path, ctx })));
    }
  }

  // core type: properties + additionalProperties
  const coreType: string[] = [];

  // discriminators: explicit mapping on schema object
  for (const k of ["oneOf", "allOf", "anyOf"] as ("oneOf" | "allOf" | "anyOf")[]) {
    if (!(schemaObject as any)[k]) continue;
    const discriminatorRef: ReferenceObject | undefined = (schemaObject as any)[k].find(
      (t: SchemaObject | ReferenceObject) =>
        "$ref" in t &&
        (ctx.discriminators[t.$ref] || // explicit allOf from this node
          Object.values(ctx.discriminators).find((d) => d.oneOf?.includes(path))), // implicit oneOf from parent
    );
    if (discriminatorRef && ctx.discriminators[discriminatorRef.$ref]) {
      coreType.unshift(indent(getDiscriminatorPropertyName(path, ctx.discriminators[discriminatorRef.$ref]), indentLv + 1));
      break;
    }
  }
  // discriminators: implicit mapping from parent
  for (const d of Object.values(ctx.discriminators)) {
    if (d.oneOf?.includes(path)) {
      coreType.unshift(indent(getDiscriminatorPropertyName(path, d), indentLv + 1));
      break;
    }
  }

  // "type": "object" (explicit)
  // "anyOf" / "allOf" (object type implied)
  if (
    ("properties" in schemaObject && schemaObject.properties && Object.keys(schemaObject.properties).length) ||
    ("additionalProperties" in schemaObject && schemaObject.additionalProperties) ||
    ("$defs" in schemaObject && schemaObject.$defs)
  ) {
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

      // We need to add undefined when there are other optional properties in the schema.properties object
      // that is the case when either schemaObject.required is empty and there are defined properties, or
      // schemaObject.required is only contains a part of the schemaObject.properties
      const numProperties = schemaObject.properties ? Object.keys(schemaObject.properties).length : 0;
      if (schemaObject.properties && ((!schemaObject.required && numProperties) || (schemaObject.required && numProperties !== schemaObject.required.length))) {
        coreType.push(indent(`[key: string]: ${tsUnionOf(addlType ? addlType : "unknown", "undefined")};`, indentLv));
      } else {
        coreType.push(indent(`[key: string]: ${addlType ? addlType : "unknown"};`, indentLv));
      }
    }
    if (schemaObject.$defs && typeof schemaObject.$defs === "object" && Object.keys(schemaObject.$defs).length) {
      coreType.push(indent(`$defs: ${transformSchemaObjectMap(schemaObject.$defs, { path: `${path}$defs/`, ctx: { ...ctx, indentLv } })};`, indentLv));
    }
    indentLv--;
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
  if (Array.isArray(schemaObject.oneOf) && schemaObject.oneOf.length) {
    const oneOfType = tsUnionOf(...collectCompositions(schemaObject.oneOf));
    finalType = finalType ? tsIntersectionOf(finalType, oneOfType) : oneOfType;
  } else {
    // allOf
    if (Array.isArray((schemaObject as any).allOf) && schemaObject.allOf!.length) {
      finalType = tsIntersectionOf(...(finalType ? [finalType] : []), ...collectCompositions(schemaObject.allOf!));
      if ("required" in schemaObject && Array.isArray(schemaObject.required)) {
        finalType = tsWithRequired(finalType, schemaObject.required);
      }
    }
    // anyOf
    if (Array.isArray(schemaObject.anyOf) && schemaObject.anyOf.length) {
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

export function getDiscriminatorPropertyName(path: string, discriminator: DiscriminatorObject): string {
  // get the inferred propertyName value from the last section of the path (as the spec suggests to do)
  let value = parseRef(path).path.pop()!;
  // if mapping, and there’s a match, use this rather than the inferred name
  if (discriminator.mapping) {
    // Mapping value can either be a fully-qualified ref (#/components/schemas/XYZ) or a schema name (XYZ)
    const matchedValue = Object.entries(discriminator.mapping).find(([, v]) => (!v.startsWith("#") && v === value) || (v.startsWith("#") && parseRef(v).path.pop() === value));
    if (matchedValue) value = matchedValue[0]; // why was this designed backwards!?
  }
  return `${escObjKey(discriminator.propertyName)}: ${escStr(value)};`;
}
