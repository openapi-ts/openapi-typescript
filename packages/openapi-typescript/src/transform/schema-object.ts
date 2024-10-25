import { parseRef } from "@redocly/openapi-core/lib/ref-utils.js";
import ts from "typescript";
import {
  BOOLEAN,
  NEVER,
  NULL,
  NUMBER,
  QUESTION_TOKEN,
  STRING,
  UNDEFINED,
  UNKNOWN,
  addJSDocComment,
  oapiRef,
  tsArrayLiteralExpression,
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
import { createDiscriminatorProperty, createRef, getEntries } from "../lib/utils.js";
import type { ReferenceObject, SchemaObject, TransformNodeOptions } from "../types.js";

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
    throw new Error(`Expected SchemaObject, received ${Array.isArray(schemaObject) ? "Array" : typeof schemaObject}`);
  }

  /**
   * ReferenceObject
   */
  if ("$ref" in schemaObject) {
    return oapiRef(schemaObject.$ref);
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
      schemaObject.enum.every((v) => typeof v === "string" || typeof v === "number" || v === null)
    ) {
      let enumName = parseRef(options.path ?? "").pointer.join("/");
      // allow #/components/schemas to have simpler names
      enumName = enumName.replace("components/schemas", "");
      const metadata = schemaObject.enum.map((_, i) => ({
        name: schemaObject["x-enum-varnames"]?.[i] ?? schemaObject["x-enumNames"]?.[i],
        description: schemaObject["x-enum-descriptions"]?.[i] ?? schemaObject["x-enumDescriptions"]?.[i],
      }));

      // enums can contain null values, but dont want to output them
      let hasNull = false;
      const validSchemaEnums = schemaObject.enum.filter((enumValue) => {
        if (enumValue === null) {
          hasNull = true;
          return false;
        }

        return true;
      });
      const enumType = tsEnum(enumName, validSchemaEnums as (string | number)[], metadata, {
        shouldCache: options.ctx.dedupeEnums,
        export: true,
        // readonly: TS enum do not support the readonly modifier
      });
      if (!options.ctx.injectFooter.includes(enumType)) {
        options.ctx.injectFooter.push(enumType);
      }
      const ref = ts.factory.createTypeReferenceNode(enumType.name);
      return hasNull ? tsUnion([ref, NULL]) : ref;
    }
    const enumType = schemaObject.enum.map(tsLiteral);
    if (
      ((Array.isArray(schemaObject.type) && schemaObject.type.includes("null")) || schemaObject.nullable) &&
      !schemaObject.default
    ) {
      enumType.push(NULL);
    }

    const unionType = tsUnion(enumType);

    // hoist array with valid enum values to top level if string/number enum and option is enabled
    if (options.ctx.enumValues && schemaObject.enum.every((v) => typeof v === "string" || typeof v === "number")) {
      let enumValuesVariableName = parseRef(options.path ?? "").pointer.join("/");
      // allow #/components/schemas to have simpler names
      enumValuesVariableName = enumValuesVariableName.replace("components/schemas", "");
      enumValuesVariableName = `${enumValuesVariableName}Values`;

      const enumValuesArray = tsArrayLiteralExpression(
        enumValuesVariableName,
        oapiRef(options.path ?? ""),
        schemaObject.enum as (string | number)[],
        {
          export: true,
          readonly: true,
          injectFooter: options.ctx.injectFooter,
        },
      );

      options.ctx.injectFooter.push(enumValuesArray);
    }

    return unionType;
  }

  /**
   * Object + composition (anyOf/allOf/oneOf) types
   */

  /** Collect oneOf/anyOf */
  function collectUnionCompositions(items: (SchemaObject | ReferenceObject)[]) {
    const output: ts.TypeNode[] = [];
    for (const item of items) {
      output.push(transformSchemaObject(item, options));
    }

    return output;
  }

  /** Collect allOf with Omit<> for discriminators */
  function collectAllOfCompositions(items: (SchemaObject | ReferenceObject)[], required?: string[]): ts.TypeNode[] {
    const output: ts.TypeNode[] = [];
    for (const item of items) {
      let itemType: ts.TypeNode;
      // if this is a $ref, use WithRequired<X, Y> if parent specifies required properties
      // (but only for valid keys)
      if ("$ref" in item) {
        itemType = transformSchemaObject(item, options);

        const resolved = options.ctx.resolve<SchemaObject>(item.$ref);

        // make keys required, if necessary
        if (
          resolved &&
          typeof resolved === "object" &&
          "properties" in resolved &&
          // we have already handled this item (discriminator property was already added as required)
          !options.ctx.discriminators.refsHandled.includes(item.$ref)
        ) {
          // add WithRequired<X, Y> if necessary
          const validRequired = (required ?? []).filter((key) => !!resolved.properties?.[key]);
          if (validRequired.length) {
            itemType = tsWithRequired(itemType, validRequired, options.ctx.injectFooter);
          }
        }
      }
      // otherwise, if this is a schema object, combine parent `required[]` with its own, if any
      else {
        const itemRequired = [...(required ?? [])];
        if (typeof item === "object" && Array.isArray(item.required)) {
          itemRequired.push(...item.required);
        }
        itemType = transformSchemaObject({ ...item, required: itemRequired }, options);
      }

      const discriminator =
        ("$ref" in item && options.ctx.discriminators.objects[item.$ref]) || (item as any).discriminator;
      if (discriminator) {
        output.push(tsOmit(itemType, [discriminator.propertyName]));
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
  const allOfType = collectAllOfCompositions(schemaObject.allOf ?? [], schemaObject.required);
  if (coreObjectType || allOfType.length) {
    const allOf: ts.TypeNode | undefined = allOfType.length ? tsIntersection(allOfType) : undefined;
    finalType = tsIntersection([...(coreObjectType ? [coreObjectType] : []), ...(allOf ? [allOf] : [])]);
  }
  // anyOf: union
  // (note: this may seem counterintuitive, but as TypeScript’s unions are not true XORs, they mimic behavior closer to anyOf than oneOf)
  const anyOfType = collectUnionCompositions(schemaObject.anyOf ?? []);
  if (anyOfType.length) {
    finalType = tsUnion([...(finalType ? [finalType] : []), ...anyOfType]);
  }
  // oneOf: union (within intersection with other types, if any)
  const oneOfType = collectUnionCompositions(
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
      finalType = tsIntersection([...(finalType ? [finalType] : []), tsUnion(oneOfType)]);
    }
  }

  // if final type could be generated, return intersection of all members
  if (finalType) {
    // deprecated nullable
    if (schemaObject.nullable && !schemaObject.default) {
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
function transformSchemaObjectCore(schemaObject: SchemaObject, options: TransformNodeOptions): ts.TypeNode | undefined {
  if ("type" in schemaObject && schemaObject.type) {
    if (typeof options.ctx.transform === "function") {
      const result = options.ctx.transform(schemaObject, options);
      if (result && typeof result === "object") {
        if ("schema" in result) {
          if (result.questionToken) {
            return ts.factory.createUnionTypeNode([result.schema, UNDEFINED]);
          } else {
            return result.schema;
          }
        } else {
          return result;
        }
      }
    }

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
        const prefixItems = schemaObject.prefixItems ?? (schemaObject.items as (SchemaObject | ReferenceObject)[]);
        itemType = ts.factory.createTupleTypeNode(prefixItems.map((item) => transformSchemaObject(item, options)));
      }
      // standard array type
      else if (schemaObject.items) {
        if ("type" in schemaObject.items && schemaObject.items.type === "array") {
          itemType = ts.factory.createArrayTypeNode(transformSchemaObject(schemaObject.items, options));
        } else {
          itemType = transformSchemaObject(schemaObject.items, options);
        }
      }

      const min: number =
        typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0 ? schemaObject.minItems : 0;
      const max: number | undefined =
        typeof schemaObject.maxItems === "number" && schemaObject.maxItems >= 0 && min <= schemaObject.maxItems
          ? schemaObject.maxItems
          : undefined;
      const estimateCodeSize = typeof max !== "number" ? min : (max * (max + 1) - min * (min - 1)) / 2;
      if (
        options.ctx.arrayLength &&
        (min !== 0 || max !== undefined) &&
        estimateCodeSize < 30 // "30" is an arbitrary number but roughly around when TS starts to struggle with tuple inference in practice
      ) {
        if (min === max) {
          const elements: ts.TypeNode[] = [];
          for (let i = 0; i < min; i++) {
            elements.push(itemType);
          }
          return tsUnion([ts.factory.createTupleTypeNode(elements)]);
        } else if ((schemaObject.maxItems as number) > 0) {
          // if maxItems is set, then return a union of all permutations of possible tuple types
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
          elements.push(ts.factory.createRestTypeNode(ts.factory.createArrayTypeNode(itemType)));
          return ts.factory.createTupleTypeNode(elements);
        }
      }

      const finalType =
        ts.isTupleTypeNode(itemType) || ts.isArrayTypeNode(itemType)
          ? itemType
          : ts.factory.createArrayTypeNode(itemType); // wrap itemType in array type, but only if not a tuple or array already

      return options.ctx.immutable
        ? ts.factory.createTypeOperatorNode(ts.SyntaxKind.ReadonlyKeyword, finalType)
        : finalType;
    }

    // polymorphic, or 3.1 nullable
    if (Array.isArray(schemaObject.type) && !Array.isArray(schemaObject)) {
      // skip any primitive types that appear in oneOf as well
      const uniqueTypes: ts.TypeNode[] = [];
      if (Array.isArray(schemaObject.oneOf)) {
        for (const t of schemaObject.type) {
          if (
            (t === "boolean" || t === "string" || t === "number" || t === "integer" || t === "null") &&
            schemaObject.oneOf.find((o) => typeof o === "object" && "type" in o && o.type === t)
          ) {
            continue;
          }
          uniqueTypes.push(
            t === "null" || t === null
              ? NULL
              : transformSchemaObject(
                  { ...schemaObject, type: t, oneOf: undefined } as SchemaObject, // don’t stack oneOf transforms
                  options,
                ),
          );
        }
      } else {
        for (const t of schemaObject.type) {
          if (t === "null" || t === null) {
            if (!schemaObject.default) {
              uniqueTypes.push(NULL);
            }
          } else {
            uniqueTypes.push(transformSchemaObject({ ...schemaObject, type: t } as SchemaObject, options));
          }
        }
      }
      return tsUnion(uniqueTypes);
    }
  }

  // type: object
  const coreObjectType: ts.TypeElement[] = [];

  // discriminators: explicit mapping on schema object
  for (const k of ["allOf", "anyOf"] as const) {
    if (!schemaObject[k]) {
      continue;
    }
    // for all magic inheritance, we will have already gathered it into
    // ctx.discriminators. But stop objects from referencing their own
    // discriminator meant for children (!schemaObject.discriminator)
    // and don't add discriminator properties if we already added/patched
    // them (options.ctx.discriminators.refsHandled.includes(options.path!).
    const discriminator =
      !schemaObject.discriminator &&
      !options.ctx.discriminators.refsHandled.includes(options.path ?? "") &&
      options.ctx.discriminators.objects[options.path ?? ""];
    if (discriminator) {
      coreObjectType.unshift(
        createDiscriminatorProperty(discriminator, {
          path: options.path ?? "",
          readonly: options.ctx.immutable,
        }),
      );
      break;
    }
  }

  if (
    ("properties" in schemaObject && schemaObject.properties && Object.keys(schemaObject.properties).length) ||
    ("additionalProperties" in schemaObject && schemaObject.additionalProperties) ||
    ("$defs" in schemaObject && schemaObject.$defs)
  ) {
    // properties
    if (Object.keys(schemaObject.properties ?? {}).length) {
      for (const [k, v] of getEntries(schemaObject.properties ?? {}, options.ctx)) {
        if (typeof v !== "object" || Array.isArray(v)) {
          throw new Error(
            `${options.path}: invalid property ${k}. Expected Schema Object, got ${
              Array.isArray(v) ? "Array" : typeof v
            }`,
          );
        }

        // handle excludeDeprecated option
        if (options.ctx.excludeDeprecated) {
          const resolved = "$ref" in v ? options.ctx.resolve<SchemaObject>(v.$ref) : v;
          if (resolved?.deprecated) {
            continue;
          }
        }
        let optional =
          schemaObject.required?.includes(k) ||
          (schemaObject.required === undefined && options.ctx.propertiesRequiredByDefault) ||
          ("default" in v &&
            options.ctx.defaultNonNullable &&
            !options.path?.includes("parameters") &&
            !options.path?.includes("requestBody") &&
            !options.path?.includes("requestBodies")) // can’t be required, even with defaults
            ? undefined
            : QUESTION_TOKEN;
        let type =
          "$ref" in v
            ? oapiRef(v.$ref)
            : transformSchemaObject(v, {
                ...options,
                path: createRef([options.path, k]),
              });

        if (typeof options.ctx.transform === "function") {
          const result = options.ctx.transform(v as SchemaObject, options);
          if (result && typeof result === "object") {
            if ("schema" in result) {
              type = result.schema;
              optional = result.questionToken ? QUESTION_TOKEN : optional;
            } else {
              type = result;
            }
          }
        }

        const property = ts.factory.createPropertySignature(
          /* modifiers     */ tsModifiers({
            readonly: options.ctx.immutable || ("readOnly" in v && !!v.readOnly),
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
    if (schemaObject.$defs && typeof schemaObject.$defs === "object" && Object.keys(schemaObject.$defs).length) {
      const defKeys: ts.TypeElement[] = [];
      for (const [k, v] of Object.entries(schemaObject.$defs)) {
        const property = ts.factory.createPropertySignature(
          /* modifiers    */ tsModifiers({
            readonly: options.ctx.immutable || ("readonly" in v && !!v.readOnly),
          }),
          /* name          */ tsPropertyIndex(k),
          /* questionToken */ undefined,
          /* type          */ transformSchemaObject(v, {
            ...options,
            path: createRef([options.path, "$defs", k]),
          }),
        );
        addJSDocComment(v, property);
        defKeys.push(property);
      }
      coreObjectType.push(
        ts.factory.createPropertySignature(
          /* modifiers     */ undefined,
          /* name          */ tsPropertyIndex("$defs"),
          /* questionToken */ undefined,
          /* type          */ ts.factory.createTypeLiteralNode(defKeys),
        ),
      );
    }

    // additionalProperties
    if (schemaObject.additionalProperties || options.ctx.additionalProperties) {
      const hasExplicitAdditionalProperties =
        typeof schemaObject.additionalProperties === "object" && Object.keys(schemaObject.additionalProperties).length;
      const addlType = hasExplicitAdditionalProperties
        ? transformSchemaObject(schemaObject.additionalProperties as SchemaObject, options)
        : UNKNOWN;
      return tsIntersection([
        ...(coreObjectType.length ? [ts.factory.createTypeLiteralNode(coreObjectType)] : []),
        ts.factory.createTypeLiteralNode([
          ts.factory.createIndexSignature(
            /* modifiers  */ tsModifiers({
              readonly: options.ctx.immutable,
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
        ]),
      ]);
    }
  }

  return coreObjectType.length ? ts.factory.createTypeLiteralNode(coreObjectType) : undefined;
}
