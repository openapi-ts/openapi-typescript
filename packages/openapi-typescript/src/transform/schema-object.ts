import { parseRef } from "@redocly/openapi-core/lib/ref-utils.js";
import ts from "typescript";
import {
  BOOLEAN,
  NEVER,
  NULL,
  NUMBER,
  QUESTION_TOKEN,
  STRING,
  UNKNOWN,
  addJSDocComment,
  oapiRef,
  tsEnum,
  tsIntersection,
  tsIsPrimitive,
  tsLiteral,
  tsModifiers,
  tsNullable,
  tsOmit,
  tsPropertyIndex,
  tsRecord,
  tsUnion,
  tsWithRequired,
} from "../lib/ts.js";
import {
  createDiscriminatorProperty,
  createRef,
  getEntries,
} from "../lib/utils.js";
import {
  DiscriminatorObject,
  ReferenceObject,
  SchemaObject,
  TransformNodeOptions,
} from "../types.js";

/**
 * Transform SchemaObject nodes (4.8.24)
 * @see https://spec.openapis.org/oas/v3.1.0#schema-object
 */
export default function transformSchemaObject(
  schemaObject: SchemaObject | ReferenceObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  const type = transformSchemaObjectWithComposition(schemaObject, options);
  if (typeof options.ctx.postTransform === "function") {
    const postTransformResult = options.ctx.postTransform(type, options);
    if (postTransformResult) {
      return postTransformResult;
    }
  }
  return type;
}

/**
 * Transform SchemaObjects
 */
export function transformSchemaObjectWithComposition(
  schemaObject: SchemaObject | ReferenceObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  /**
   * Unexpected types & edge cases
   */

  // missing/falsy type returns `never`
  if (!schemaObject) {
    return NEVER;
  }
  // `true` returns `unknown` (this exists, but is untyped)
  if ((schemaObject as unknown) === true) {
    return UNKNOWN;
  }
  // for any other unexpected type, throw error
  if (Array.isArray(schemaObject) || typeof schemaObject !== "object") {
    throw new Error(
      `Expected SchemaObject, received ${
        Array.isArray(schemaObject) ? "Array" : typeof schemaObject
      }`,
    );
  }

  /**
   * ReferenceObject
   */
  if ("$ref" in schemaObject) {
    return oapiRef(schemaObject.$ref);
  }

  /**
   * transform()
   */
  if (typeof options.ctx.transform === "function") {
    const result = options.ctx.transform(schemaObject, options);
    if (result !== undefined && result !== null) {
      return result;
    }
  }

  /**
   * const (valid for any type)
   */
  if (schemaObject.const !== null && schemaObject.const !== undefined) {
    return tsLiteral(schemaObject.const);
  }

  /**
   * enum (non-objects)
   * note: enum is valid for any type, but for objects, handle in oneOf below
   */
  if (
    Array.isArray(schemaObject.enum) &&
    (!("type" in schemaObject) || schemaObject.type !== "object") &&
    !("properties" in schemaObject) &&
    !("additionalProperties" in schemaObject)
  ) {
    // hoist enum to top level if string/number enum and option is enabled
    if (
      options.ctx.enum &&
      schemaObject.enum.every(
        (v) => typeof v === "string" || typeof v === "number",
      )
    ) {
      let enumName = parseRef(options.path ?? "").pointer.join("/");
      // allow #/components/schemas to have simpler names
      enumName = enumName.replace("components/schemas", "");
      const enumType = tsEnum(
        enumName,
        schemaObject.enum as (string | number)[],
        { export: true, readonly: options.ctx.immutableTypes },
      );
      options.ctx.injectFooter.push(enumType);
      return ts.factory.createTypeReferenceNode(enumType.name);
    }
    return tsUnion(schemaObject.enum.map(tsLiteral));
  }

  /**
   * Object + composition (anyOf/allOf/oneOf) types
   */

  /** Collect oneOf/allOf/anyOf with Omit<> for discriminators */
  function collectCompositions(
    items: (SchemaObject | ReferenceObject)[],
  ): ts.TypeNode[] {
    const output: ts.TypeNode[] = [];
    for (const item of items) {
      const itemType = transformSchemaObject(item, options);
      if ("$ref" in item) {
        const resolvedDiscriminator = options.ctx.resolve<DiscriminatorObject>(
          item.$ref,
        );
        output.push(
          resolvedDiscriminator?.propertyName
            ? tsOmit(itemType, [resolvedDiscriminator.propertyName])
            : itemType,
        );
      } else {
        output.push(itemType);
      }
    }
    return output;
  }

  // compile final type
  let finalType: ts.TypeNode | undefined = undefined;

  // core + allOf: intersect
  const coreObjectType = transformSchemaObjectCore(schemaObject, options);
  const allOfType = collectCompositions(schemaObject.allOf ?? []);
  if (coreObjectType || allOfType.length) {
    let allOf: ts.TypeNode | undefined = allOfType.length
      ? tsIntersection(allOfType)
      : undefined;
    // add required props
    if (
      allOf &&
      "required" in schemaObject &&
      Array.isArray(schemaObject.required)
    ) {
      allOf = tsWithRequired(allOf, schemaObject.required);
    }
    finalType = tsIntersection([
      ...(coreObjectType ? [coreObjectType] : []),
      ...(allOf ? [allOf] : []),
    ]);
  }
  // anyOf: union
  // (note: this may seem counterintuitive, but as TypeScript’s unions are not true XORs, they mimic behavior closer to anyOf than oneOf)
  const anyOfType = collectCompositions(schemaObject.anyOf ?? []);
  if (anyOfType.length) {
    finalType = tsUnion([...(finalType ? [finalType] : []), ...anyOfType]);
  }
  // oneOf: union (within intersection with other types, if any)
  const oneOfType = collectCompositions(
    schemaObject.oneOf ||
      ("type" in schemaObject &&
        schemaObject.type === "object" &&
        (schemaObject.enum as (SchemaObject | ReferenceObject)[])) ||
      [],
  );
  if (oneOfType.length) {
    // note: oneOf is the only type that may include primitives
    if (oneOfType.every(tsIsPrimitive)) {
      finalType = tsUnion([...(finalType ? [finalType] : []), ...oneOfType]);
    } else {
      finalType = tsIntersection([
        ...(finalType ? [finalType] : []),
        tsUnion(oneOfType),
      ]);
    }
  }

  // if final type could be generated, return intersection of all members
  if (finalType) {
    // deprecated nullable
    if (schemaObject.nullable) {
      return tsNullable([finalType]);
    }
    return finalType;
  }
  // otherwise fall back to unknown type (or related variants)
  else {
    // fallback: unknown
    if (!("type" in schemaObject)) {
      return UNKNOWN;
    }

    // if no type could be generated, fall back to “empty object” type
    return tsRecord(STRING, options.ctx.emptyObjectsUnknown ? UNKNOWN : NEVER);
  }
}

/**
 * Handle SchemaObject minus composition (anyOf/allOf/oneOf)
 */
function transformSchemaObjectCore(
  schemaObject: SchemaObject,
  options: TransformNodeOptions,
): ts.TypeNode | undefined {
  if ("type" in schemaObject && schemaObject.type) {
    // primitives
    // type: null
    if (schemaObject.type === "null") {
      return NULL;
    }
    // type: string
    if (schemaObject.type === "string") {
      return STRING;
    }
    // type: number / type: integer
    if (schemaObject.type === "number" || schemaObject.type === "integer") {
      return NUMBER;
    }
    // type: boolean
    if (schemaObject.type === "boolean") {
      return BOOLEAN;
    }

    // type: array (with support for tuples)
    if (schemaObject.type === "array") {
      // default to `unknown[]`
      let itemType: ts.TypeNode = UNKNOWN;
      // tuple type
      if (schemaObject.prefixItems || Array.isArray(schemaObject.items)) {
        const prefixItems =
          schemaObject.prefixItems ??
          (schemaObject.items as (SchemaObject | ReferenceObject)[]);
        itemType = ts.factory.createTupleTypeNode(
          prefixItems.map((item) => transformSchemaObject(item, options)),
        );
      }
      // standard array type
      else if (schemaObject.items) {
        itemType = transformSchemaObject(schemaObject.items, options);
        if (options.ctx.immutableTypes) {
          itemType = ts.factory.createTypeOperatorNode(
            ts.SyntaxKind.ReadonlyKeyword,
            itemType,
          );
        }
      }

      const min: number =
        typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0
          ? schemaObject.minItems
          : 0;
      const max: number | undefined =
        typeof schemaObject.maxItems === "number" &&
        schemaObject.maxItems >= 0 &&
        min <= schemaObject.maxItems
          ? schemaObject.maxItems
          : undefined;
      const estimateCodeSize =
        typeof max !== "number" ? min : (max * (max + 1) - min * (min - 1)) / 2;
      if (
        options.ctx.supportArrayLength &&
        (min !== 0 || max !== undefined) &&
        estimateCodeSize < 30 // "30" is an arbitrary number but roughly around when TS starts to struggle with tuple inference in practice
      ) {
        // if maxItems is set, then return a union of all permutations of possible tuple types
        if ((schemaObject.maxItems as number) > 0) {
          const members: ts.TypeNode[] = [];
          // populate 1 short of min …
          for (let i = 0; i <= (max ?? 0) - min; i++) {
            const elements: ts.TypeNode[] = [];
            for (let j = min; j < i + min; j++) {
              elements.push(itemType);
            }
            members.push(ts.factory.createTupleTypeNode(elements));
          }
          return tsUnion(members);
        }
        // if maxItems not set, then return a simple tuple type the length of `min`
        else {
          const elements: ts.TypeNode[] = [];
          for (let i = 0; i < min; i++) {
            elements.push(itemType);
          }
          elements.push(
            ts.factory.createRestTypeNode(
              ts.factory.createArrayTypeNode(itemType),
            ),
          );
          return ts.factory.createTupleTypeNode(elements);
        }
      }

      return ts.isTupleTypeNode(itemType)
        ? itemType
        : ts.factory.createArrayTypeNode(itemType); // wrap itemType in array type, but only if not a tuple already
    }

    // polymorphic, or 3.1 nullable
    if (Array.isArray(schemaObject.type) && !Array.isArray(schemaObject)) {
      // skip any primitive types that appear in oneOf as well
      let uniqueTypes: ts.TypeNode[] = [];
      if (Array.isArray(schemaObject.oneOf)) {
        for (const t of schemaObject.type) {
          if (
            (t === "boolean" ||
              t === "string" ||
              t === "number" ||
              t === "integer" ||
              t === "null") &&
            schemaObject.oneOf.find(
              (o) => typeof o === "object" && "type" in o && o.type === t,
            )
          ) {
            continue;
          }
          uniqueTypes.push(
            t === "null" || t === null
              ? NULL
              : transformSchemaObject(
                  { ...schemaObject, type: t, oneOf: undefined }, // don’t stack oneOf transforms
                  options,
                ),
          );
        }
      } else {
        uniqueTypes = schemaObject.type.map((t) =>
          t === "null" || t === null
            ? NULL
            : transformSchemaObject({ ...schemaObject, type: t }, options),
        );
      }
      return tsUnion(uniqueTypes);
    }
  }

  // type: object
  const coreObjectType: ts.TypeElement[] = [];

  // discriminatorss: explicit mapping on schema object
  for (const k of ["oneOf", "allOf", "anyOf"] as (
    | "oneOf"
    | "allOf"
    | "anyOf"
  )[]) {
    if (!schemaObject[k]) {
      continue;
    }
    const discriminatorRef = schemaObject[k]!.find(
      (t: SchemaObject | ReferenceObject) =>
        "$ref" in t &&
        (options.ctx.discriminators[t.$ref] || // explicit allOf from this node
          Object.values(options.ctx.discriminators).find(
            (d) => d.oneOf?.includes(options.path!), // implicit oneOf from parent
          )),
    ) as ReferenceObject | undefined;
    if (discriminatorRef && options.ctx.discriminators[discriminatorRef.$ref]) {
      coreObjectType.unshift(
        createDiscriminatorProperty(
          options.ctx.discriminators[discriminatorRef.$ref],
          { path: options.path!, readonly: options.ctx.immutableTypes },
        ),
      );
      break;
    }
  }
  // discriminators: implicit mapping from parent
  for (const d of Object.values(options.ctx.discriminators)) {
    if (d.oneOf?.includes(options.path!)) {
      coreObjectType.unshift(
        createDiscriminatorProperty(d, {
          path: options.path!,
          readonly: options.ctx.immutableTypes,
        }),
      );
      break;
    }
  }

  if (
    ("properties" in schemaObject &&
      schemaObject.properties &&
      Object.keys(schemaObject.properties).length) ||
    ("additionalProperties" in schemaObject &&
      schemaObject.additionalProperties) ||
    ("$defs" in schemaObject && schemaObject.$defs)
  ) {
    // properties
    if (Object.keys(schemaObject.properties ?? {}).length) {
      for (const [k, v] of getEntries(
        schemaObject.properties ?? {},
        options.ctx,
      )) {
        // handle excludeDeprecated option
        if (options.ctx.excludeDeprecated) {
          const resolved =
            "$ref" in v ? options.ctx.resolve<SchemaObject>(v.$ref) : v;
          if (resolved?.deprecated) {
            continue;
          }
        }
        const optional =
          schemaObject.required?.includes(k) ||
          ("default" in v && options.ctx.defaultNonNullable)
            ? undefined
            : QUESTION_TOKEN;
        const type =
          "$ref" in v
            ? oapiRef(v.$ref)
            : transformSchemaObject(v, {
                ...options,
                path: createRef([options.path ?? "", k]),
              });
        const property = ts.factory.createPropertySignature(
          /* modifiers     */ tsModifiers({
            readonly:
              options.ctx.immutableTypes || ("readOnly" in v && !!v.readOnly),
          }),
          /* name          */ tsPropertyIndex(k),
          /* questionToken */ optional,
          /* type          */ type,
        );
        addJSDocComment(v, property);
        coreObjectType.push(property);
      }
    }

    // $defs
    if (
      schemaObject.$defs &&
      typeof schemaObject.$defs === "object" &&
      Object.keys(schemaObject.$defs).length
    ) {
      const defKeys: ts.TypeElement[] = [];
      for (const [k, v] of Object.entries(schemaObject.$defs)) {
        const property = ts.factory.createPropertySignature(
          /* modifiers */ tsModifiers({
            readonly:
              options.ctx.immutableTypes || ("readonly" in v && !!v.readOnly),
          }),
          /* name          */ tsPropertyIndex(k),
          /* questionToken */ undefined,
          /* type          */ transformSchemaObject(v, {
            ...options,
            path: createRef([options.path ?? "", "$defs", k]),
          }),
        );
        addJSDocComment(v, property);
        defKeys.push(property);
      }
      coreObjectType.push(
        ts.factory.createPropertySignature(
          /* modifiers     */ tsModifiers({
            readonly: options.ctx.immutableTypes,
          }),
          /* name          */ tsPropertyIndex("$defs"),
          /* questionToken */ undefined,
          /* type          */ ts.factory.createTypeLiteralNode(defKeys),
        ),
      );
    }

    // additionalProperties
    if (schemaObject.additionalProperties || options.ctx.additionalProperties) {
      const hasExplicitAdditionalProperties =
        typeof schemaObject.additionalProperties === "object" &&
        Object.keys(schemaObject.additionalProperties).length;
      const addlType = hasExplicitAdditionalProperties
        ? transformSchemaObject(
            schemaObject.additionalProperties as SchemaObject,
            options,
          )
        : UNKNOWN;
      coreObjectType.push(
        ts.factory.createIndexSignature(
          /* modifiers  */ tsModifiers({
            readonly: options.ctx.immutableTypes,
          }),
          /* parameters */ [
            ts.factory.createParameterDeclaration(
              /* modifiers      */ undefined,
              /* dotDotDotToken */ undefined,
              /* name           */ ts.factory.createIdentifier("key"),
              /* questionToken  */ undefined,
              /* type           */ STRING,
            ),
          ],
          /* type       */ addlType,
        ),
      );
    }
  }

  return coreObjectType.length
    ? ts.factory.createTypeLiteralNode(coreObjectType)
    : undefined;
}
