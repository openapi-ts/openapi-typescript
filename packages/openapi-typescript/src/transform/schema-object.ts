import { parseRef } from "@redocly/openapi-core/lib/ref-utils.js";
import ts from "typescript";
import {
  BOOLEAN,
  type EnumMemberMetadata,
  NEVER,
  NULL,
  NUMBER,
  QUESTION_TOKEN,
  STRING,
  UNDEFINED,
  UNKNOWN,
  addJSDocComment,
  astToString,
  oapiRef,
  sanitizeMemberName,
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
import type { ArraySubtype, ReferenceObject, SchemaObject, TransformNodeOptions } from "../types.js";

/**
 * Transform SchemaObject nodes (4.8.24)
 * @see https://spec.openapis.org/oas/v3.1.0#schema-object
 */
export default function transformSchemaObject(
  schemaObject: SchemaObject | ReferenceObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  const type = transformSchemaObjectWithComposition(schemaObject, options);
  const postTransformType =
    typeof options.ctx.postTransform === "function" ? options.ctx.postTransform(type, options) : undefined;

  return postTransformType ?? type;
}

function isEnumMemberLiteral(value: any): value is string | number | null {
  return value === null || typeof value === "number" || typeof value === "string";
}
type EnumSchemaMember = Exclude<SchemaObject["enum"], undefined>;
type EnumSchemaObject = SchemaObject & {
  readonly additionalProperties: never;
  readonly enum: readonly EnumSchemaMember[];
  readonly properties: never;
};

function isEnumSchemaObject(schemaObject: SchemaObject): schemaObject is EnumSchemaObject {
  return (
    Array.isArray(schemaObject.enum) &&
    schemaObject.enum.length > 0 &&
    (!("type" in schemaObject) || schemaObject.type !== "object") &&
    !("properties" in schemaObject) &&
    !("additionalProperties" in schemaObject)
  );
}

function schemaObjectToEnumMemberMetadata(schemaObject: EnumSchemaObject): EnumMemberMetadata[] {
  return schemaObject.enum.map((_, index) => {
    return {
      name: schemaObject["x-enum-varnames"]?.[index] ?? schemaObject["x-enumNames"]?.[index],
      description: schemaObject["x-enum-descriptions"]?.[index] ?? schemaObject["x-enumDescriptions"]?.[index],
    };
  });
}

function transformEnumSchemaObjectToUnion(schemaObject: EnumSchemaObject) {
  const isNullable =
    ((Array.isArray(schemaObject.type) && schemaObject.type.includes("null")) || schemaObject.nullable) &&
    !schemaObject.default;

  const enumType = schemaObject.enum.map(tsLiteral);

  return tsUnion(isNullable ? enumType.concat(NULL) : enumType);
}

function transformEnumSchemaObject(schemaObject: EnumSchemaObject, options: TransformNodeOptions) {
  // If the `enum` or `enumValues` options are enabled, create and hoist the declarations
  // for the enum and array, so long as all enum members are string or number literals.
  const enumMembers = schemaObject.enum;
  // First filter the enum members down to just the literals; this aids in narrowing the type
  // of the values.
  const initialEnumMemberLiterals = enumMembers.filter(isEnumMemberLiteral);
  // After filtering & narrowing, ensure that all the members are literals by comparing the lengths
  // of the filtered and unfiltered lists.
  // If the lengths differ, this enum is not valid for transformation.
  const enumMemberLiterals =
    initialEnumMemberLiterals.length === enumMembers.length ? initialEnumMemberLiterals : undefined;

  if (!(enumMemberLiterals?.length && (options.ctx.enum || options.ctx.enumValues))) {
    return transformEnumSchemaObjectToUnion(schemaObject);
  }

  // The enum qualifies for extraction at this point, either as a TypeScript enum
  // or as an array of values.
  // Allow #/components/schemas to have simpler names
  const enumName = parseRef(options.path ?? "")
    .pointer.join("/")
    .replace("components/schemas", "");

  const metadata = schemaObjectToEnumMemberMetadata(schemaObject);

  // OpenAPI enums can contain null values, but we don't want to output them
  const hasNull = enumMembers.some((enumValue) => enumValue === null);
  const members = enumMembers.filter(isEnumMemberLiteral).filter((enumValue) => enumValue !== null);

  const enumType = options.ctx.enum
    ? tsEnum(
        // tsEnum performs its own sanitization on enumName
        enumName,
        members,
        metadata,
        // TS enum do not support the readonly modifier
        { shouldCache: options.ctx.dedupeEnums, export: true },
      )
    : undefined;

  const constTypeName = options.ctx.enumValues ? sanitizeMemberName(enumName) : undefined;
  const constName = options.ctx.enumValues && constTypeName ? `${constTypeName}Values` : undefined;

  const constExpression =
    options.ctx.enumValues && constName
      ? tsArrayLiteralExpression(
          /* name        */ constName,
          /* elementType */ undefined,
          /* members     */ members,
          /* metadata    */ metadata,
          /* options     */ { shouldCache: options.ctx.dedupeEnums, export: true },
        )
      : undefined;

  const constMemberType =
    options.ctx.enumValues && constName && constTypeName
      ? ts.factory.createTypeAliasDeclaration(
          /* modifiers      */ tsModifiers({ export: true }),
          /* name           */ constTypeName,
          /* typeParameters */ undefined,
          /* type           */ ts.factory.createIndexedAccessTypeNode(
            ts.factory.createTypeQueryNode(ts.factory.createIdentifier(constName)),
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          ),
        )
      : undefined;

  // Add declarations for all selected output types.
  for (const node of [enumType, constExpression, constMemberType]) {
    if (node && !options.ctx.injectNodes.includes(node)) {
      options.ctx.injectNodes.push(node);
    }
  }

  const refName = (enumType ? enumType.name : undefined) ?? (constMemberType ? constMemberType.name : undefined);

  const ref = refName ? ts.factory.createTypeReferenceNode(refName) : undefined;

  if (!ref) {
    return NULL;
  }

  return hasNull ? tsUnion([ref, NULL].filter((node) => node !== undefined)) : ref;
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
      `Expected SchemaObject, received ${Array.isArray(schemaObject) ? "Array" : typeof schemaObject} at ${options.path}`,
    );
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
  const enumSchemaObject = isEnumSchemaObject(schemaObject) ? schemaObject : undefined;
  if (enumSchemaObject) {
    return transformEnumSchemaObject(enumSchemaObject, options);
  }

  /**
   * Object + composition (anyOf/allOf/oneOf) types
   */

  /** Collect oneOf/anyOf */
  function collectUnionCompositions(schemaObject: SchemaObject, items: (SchemaObject | ReferenceObject)[]) {
    const compositionType =
      (schemaObject.allOf ? "allOf" : undefined) ??
      (schemaObject.anyOf ? "anyOf" : undefined) ??
      (schemaObject.oneOf ? "oneOf" : undefined);

    return items.map((item, index) =>
      transformSchemaObject(item, { ...options, path: createRef([options.path, compositionType, index]) }),
    );
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
            itemType = tsWithRequired(itemType, validRequired, options.ctx.injectNodes);
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
  const anyOfType = collectUnionCompositions(schemaObject, schemaObject.anyOf ?? []);
  if (anyOfType.length) {
    finalType = tsUnion([...(finalType ? [finalType] : []), ...anyOfType]);
  }
  // oneOf: union (within intersection with other types, if any)
  const oneOfType = collectUnionCompositions(
    schemaObject,
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

  // When no final type can be generated, fall back to unknown type (or related variants)
  if (!finalType) {
    if ("type" in schemaObject) {
      finalType = tsRecord(STRING, options.ctx.emptyObjectsUnknown ? UNKNOWN : NEVER);
    } else {
      finalType = UNKNOWN;
    }
  }

  if (finalType !== UNKNOWN && schemaObject.nullable && !schemaObject.default) {
    finalType = tsNullable([finalType]);
  }

  return finalType;
}

type ArraySchemaObject = SchemaObject & ArraySubtype;
function isArraySchemaObject(schemaObject: SchemaObject | ArraySchemaObject): schemaObject is ArraySchemaObject {
  return schemaObject.type === "array";
}

function padTupleMembers(length: number, itemType: ts.TypeNode, prefixTypes: readonly ts.TypeNode[]) {
  return Array.from({ length }).map((_, index) => {
    return prefixTypes[index] ?? itemType;
  });
}

function toOptionsReadonly<TMembers extends ts.ArrayTypeNode | ts.TupleTypeNode>(
  members: TMembers,
  options: TransformNodeOptions,
): TMembers | ts.TypeOperatorNode {
  return options.ctx.immutable ? ts.factory.createTypeOperatorNode(ts.SyntaxKind.ReadonlyKeyword, members) : members;
}

/* Transform Array schema object */
function transformArraySchemaObject(schemaObject: ArraySchemaObject, options: TransformNodeOptions): ts.TypeNode {
  const prefixTypes = (schemaObject.prefixItems ?? []).map((item) => transformSchemaObject(item, options));

  if (Array.isArray(schemaObject.items)) {
    throw new Error(`${options.path}: invalid property items. Expected Schema Object, got Array`);
  }

  const itemType = schemaObject.items ? transformSchemaObject(schemaObject.items, options) : UNKNOWN;

  // The minimum number of tuple members to return
  const min: number =
    options.ctx.arrayLength && typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0
      ? schemaObject.minItems
      : 0;
  const max: number | undefined =
    options.ctx.arrayLength &&
    typeof schemaObject.maxItems === "number" &&
    schemaObject.maxItems >= 0 &&
    min <= schemaObject.maxItems
      ? schemaObject.maxItems
      : undefined;

  // "30" is an arbitrary number but roughly around when TS starts to struggle with tuple inference in practice
  const MAX_CODE_SIZE = 30;
  const estimateCodeSize = max === undefined ? min : (max * (max + 1) - min * (min - 1)) / 2;
  const shouldGeneratePermutations = (min !== 0 || max !== undefined) && estimateCodeSize < MAX_CODE_SIZE;

  // if maxItems is set, then return a union of all permutations of possible tuple types
  if (shouldGeneratePermutations && max !== undefined) {
    return tsUnion(
      Array.from({ length: max - min + 1 }).map((_, index) =>
        toOptionsReadonly(ts.factory.createTupleTypeNode(padTupleMembers(index + min, itemType, prefixTypes)), options),
      ),
    );
  }

  // if maxItems not set, then return a simple tuple type the length of `min`
  const spreadType = ts.factory.createArrayTypeNode(itemType);
  const tupleType =
    shouldGeneratePermutations || prefixTypes.length
      ? ts.factory.createTupleTypeNode([
          ...padTupleMembers(Math.max(min, prefixTypes.length), itemType, prefixTypes),
          ts.factory.createRestTypeNode(toOptionsReadonly(spreadType, options)),
        ])
      : spreadType;

  return toOptionsReadonly(tupleType, options);
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
    if (isArraySchemaObject(schemaObject)) {
      return transformArraySchemaObject(schemaObject, options);
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
