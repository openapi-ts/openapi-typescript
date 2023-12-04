import { parseRef } from "@redocly/openapi-core/lib/ref-utils.js";
import ts from "typescript";
import { BOOLEAN, NEVER, NULL, NUMBER, QUESTION_TOKEN, STRING, UNDEFINED, UNKNOWN, addJSDocComment, oapiRef, tsEnum, tsIntersection, tsIsPrimitive, tsLiteral, tsModifiers, tsNullable, tsOmit, tsPropertyIndex, tsRecord, tsUnion, tsWithRequired, } from "../lib/ts.js";
import { createDiscriminatorProperty, createRef, getEntries, } from "../lib/utils.js";
export default function transformSchemaObject(schemaObject, options) {
    const type = transformSchemaObjectWithComposition(schemaObject, options);
    if (typeof options.ctx.postTransform === "function") {
        const postTransformResult = options.ctx.postTransform(type, options);
        if (postTransformResult) {
            return postTransformResult;
        }
    }
    return type;
}
export function transformSchemaObjectWithComposition(schemaObject, options) {
    if (!schemaObject) {
        return NEVER;
    }
    if (schemaObject === true) {
        return UNKNOWN;
    }
    if (Array.isArray(schemaObject) || typeof schemaObject !== "object") {
        throw new Error(`Expected SchemaObject, received ${Array.isArray(schemaObject) ? "Array" : typeof schemaObject}`);
    }
    if ("$ref" in schemaObject) {
        return oapiRef(schemaObject.$ref);
    }
    if (schemaObject.const !== null && schemaObject.const !== undefined) {
        return tsLiteral(schemaObject.const);
    }
    if (Array.isArray(schemaObject.enum) &&
        (!("type" in schemaObject) || schemaObject.type !== "object") &&
        !("properties" in schemaObject) &&
        !("additionalProperties" in schemaObject)) {
        if (options.ctx.enum &&
            schemaObject.enum.every((v) => typeof v === "string" || typeof v === "number")) {
            let enumName = parseRef(options.path ?? "").pointer.join("/");
            enumName = enumName.replace("components/schemas", "");
            const metadata = schemaObject.enum.map((_, i) => ({
                name: schemaObject["x-enum-varnames"]?.[i],
                description: schemaObject["x-enum-descriptions"]?.[i],
            }));
            const enumType = tsEnum(enumName, schemaObject.enum, metadata, { export: true, readonly: options.ctx.immutable });
            options.ctx.injectFooter.push(enumType);
            return ts.factory.createTypeReferenceNode(enumType.name);
        }
        return tsUnion(schemaObject.enum.map(tsLiteral));
    }
    function collectCompositions(items, required) {
        const output = [];
        for (const item of items) {
            let itemType;
            if ("$ref" in item) {
                itemType = transformSchemaObject(item, options);
                const resolved = options.ctx.resolve(item.$ref);
                if (resolved &&
                    typeof resolved === "object" &&
                    "properties" in resolved) {
                    const validRequired = (required ?? []).filter((key) => !!resolved.properties[key]);
                    if (validRequired.length) {
                        itemType = tsWithRequired(itemType, validRequired, options.ctx.injectFooter);
                    }
                }
            }
            else {
                const itemRequired = [...(required ?? [])];
                if (typeof item === "object" && Array.isArray(item.required)) {
                    itemRequired.push(...item.required);
                }
                itemType = transformSchemaObject({ ...item, required: itemRequired }, options);
            }
            const discriminator = ("$ref" in item && options.ctx.discriminators[item.$ref]) ||
                item.discriminator;
            if (discriminator) {
                output.push(tsOmit(itemType, [discriminator.propertyName]));
            }
            else {
                output.push(itemType);
            }
        }
        return output;
    }
    let finalType = undefined;
    const coreObjectType = transformSchemaObjectCore(schemaObject, options);
    const allOfType = collectCompositions(schemaObject.allOf ?? [], schemaObject.required);
    if (coreObjectType || allOfType.length) {
        const allOf = allOfType.length
            ? tsIntersection(allOfType)
            : undefined;
        finalType = tsIntersection([
            ...(coreObjectType ? [coreObjectType] : []),
            ...(allOf ? [allOf] : []),
        ]);
    }
    const anyOfType = collectCompositions(schemaObject.anyOf ?? [], schemaObject.required);
    if (anyOfType.length) {
        finalType = tsUnion([...(finalType ? [finalType] : []), ...anyOfType]);
    }
    const oneOfType = collectCompositions(schemaObject.oneOf ||
        ("type" in schemaObject &&
            schemaObject.type === "object" &&
            schemaObject.enum) ||
        [], schemaObject.required);
    if (oneOfType.length) {
        if (oneOfType.every(tsIsPrimitive)) {
            finalType = tsUnion([...(finalType ? [finalType] : []), ...oneOfType]);
        }
        else {
            finalType = tsIntersection([
                ...(finalType ? [finalType] : []),
                tsUnion(oneOfType),
            ]);
        }
    }
    if (finalType) {
        if (schemaObject.nullable) {
            return tsNullable([finalType]);
        }
        return finalType;
    }
    else {
        if (!("type" in schemaObject)) {
            return UNKNOWN;
        }
        return tsRecord(STRING, options.ctx.emptyObjectsUnknown ? UNKNOWN : NEVER);
    }
}
function transformSchemaObjectCore(schemaObject, options) {
    if ("type" in schemaObject && schemaObject.type) {
        if (schemaObject.type === "null") {
            return NULL;
        }
        if (schemaObject.type === "string") {
            return STRING;
        }
        if (schemaObject.type === "number" || schemaObject.type === "integer") {
            return NUMBER;
        }
        if (schemaObject.type === "boolean") {
            return BOOLEAN;
        }
        if (schemaObject.type === "array") {
            let itemType = UNKNOWN;
            if (schemaObject.prefixItems || Array.isArray(schemaObject.items)) {
                const prefixItems = schemaObject.prefixItems ??
                    schemaObject.items;
                itemType = ts.factory.createTupleTypeNode(prefixItems.map((item) => transformSchemaObject(item, options)));
            }
            else if (schemaObject.items) {
                itemType = transformSchemaObject(schemaObject.items, options);
            }
            const min = typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0
                ? schemaObject.minItems
                : 0;
            const max = typeof schemaObject.maxItems === "number" &&
                schemaObject.maxItems >= 0 &&
                min <= schemaObject.maxItems
                ? schemaObject.maxItems
                : undefined;
            const estimateCodeSize = typeof max !== "number" ? min : (max * (max + 1) - min * (min - 1)) / 2;
            if (options.ctx.arrayLength &&
                (min !== 0 || max !== undefined) &&
                estimateCodeSize < 30) {
                if (schemaObject.maxItems > 0) {
                    const members = [];
                    for (let i = 0; i <= (max ?? 0) - min; i++) {
                        const elements = [];
                        for (let j = min; j < i + min; j++) {
                            elements.push(itemType);
                        }
                        members.push(ts.factory.createTupleTypeNode(elements));
                    }
                    return tsUnion(members);
                }
                else {
                    const elements = [];
                    for (let i = 0; i < min; i++) {
                        elements.push(itemType);
                    }
                    elements.push(ts.factory.createRestTypeNode(ts.factory.createArrayTypeNode(itemType)));
                    return ts.factory.createTupleTypeNode(elements);
                }
            }
            return ts.isTupleTypeNode(itemType)
                ? itemType
                : ts.factory.createArrayTypeNode(itemType);
        }
        if (Array.isArray(schemaObject.type) && !Array.isArray(schemaObject)) {
            let uniqueTypes = [];
            if (Array.isArray(schemaObject.oneOf)) {
                for (const t of schemaObject.type) {
                    if ((t === "boolean" ||
                        t === "string" ||
                        t === "number" ||
                        t === "integer" ||
                        t === "null") &&
                        schemaObject.oneOf.find((o) => typeof o === "object" && "type" in o && o.type === t)) {
                        continue;
                    }
                    uniqueTypes.push(t === "null" || t === null
                        ? NULL
                        : transformSchemaObject({ ...schemaObject, type: t, oneOf: undefined }, options));
                }
            }
            else {
                uniqueTypes = schemaObject.type.map((t) => t === "null" || t === null
                    ? NULL
                    : transformSchemaObject({ ...schemaObject, type: t }, options));
            }
            return tsUnion(uniqueTypes);
        }
    }
    const coreObjectType = [];
    for (const k of ["oneOf", "allOf", "anyOf"]) {
        if (!schemaObject[k]) {
            continue;
        }
        const discriminator = !schemaObject.discriminator && options.ctx.discriminators[options.path];
        if (discriminator) {
            coreObjectType.unshift(createDiscriminatorProperty(discriminator, {
                path: options.path,
                readonly: options.ctx.immutable,
            }));
            break;
        }
    }
    if (("properties" in schemaObject &&
        schemaObject.properties &&
        Object.keys(schemaObject.properties).length) ||
        ("additionalProperties" in schemaObject &&
            schemaObject.additionalProperties) ||
        ("$defs" in schemaObject && schemaObject.$defs)) {
        if (Object.keys(schemaObject.properties ?? {}).length) {
            for (const [k, v] of getEntries(schemaObject.properties ?? {}, options.ctx)) {
                if (typeof v !== "object" || Array.isArray(v)) {
                    throw new Error(`${options.path}: invalid property ${k}. Expected Schema Object, got ${Array.isArray(v) ? "Array" : typeof v}`);
                }
                if (options.ctx.excludeDeprecated) {
                    const resolved = "$ref" in v ? options.ctx.resolve(v.$ref) : v;
                    if (resolved?.deprecated) {
                        continue;
                    }
                }
                let optional = schemaObject.required?.includes(k) ||
                    ("default" in v &&
                        options.ctx.defaultNonNullable &&
                        !options.path?.includes("parameters"))
                    ? undefined
                    : QUESTION_TOKEN;
                let type = "$ref" in v
                    ? oapiRef(v.$ref)
                    : transformSchemaObject(v, {
                        ...options,
                        path: createRef([options.path ?? "", k]),
                    });
                if (typeof options.ctx.transform === "function") {
                    const result = options.ctx.transform(v, options);
                    if (result) {
                        if ("schema" in result) {
                            type = result.schema;
                            optional = result.questionToken ? QUESTION_TOKEN : optional;
                        }
                        else {
                            type = result;
                        }
                    }
                }
                const property = ts.factory.createPropertySignature(tsModifiers({
                    readonly: options.ctx.immutable || ("readOnly" in v && !!v.readOnly),
                }), tsPropertyIndex(k), optional, type);
                addJSDocComment(v, property);
                coreObjectType.push(property);
            }
        }
        if (schemaObject.$defs &&
            typeof schemaObject.$defs === "object" &&
            Object.keys(schemaObject.$defs).length) {
            const defKeys = [];
            for (const [k, v] of Object.entries(schemaObject.$defs)) {
                const property = ts.factory.createPropertySignature(tsModifiers({
                    readonly: options.ctx.immutable || ("readonly" in v && !!v.readOnly),
                }), tsPropertyIndex(k), undefined, transformSchemaObject(v, {
                    ...options,
                    path: createRef([options.path ?? "", "$defs", k]),
                }));
                addJSDocComment(v, property);
                defKeys.push(property);
            }
            coreObjectType.push(ts.factory.createPropertySignature(undefined, tsPropertyIndex("$defs"), undefined, ts.factory.createTypeLiteralNode(defKeys)));
        }
        if (schemaObject.additionalProperties || options.ctx.additionalProperties) {
            const hasExplicitAdditionalProperties = typeof schemaObject.additionalProperties === "object" &&
                Object.keys(schemaObject.additionalProperties).length;
            let addlType = hasExplicitAdditionalProperties
                ? transformSchemaObject(schemaObject.additionalProperties, options)
                : UNKNOWN;
            if (addlType.kind !== ts.SyntaxKind.UnknownKeyword) {
                addlType = tsUnion([addlType, UNDEFINED]);
            }
            coreObjectType.push(ts.factory.createIndexSignature(tsModifiers({
                readonly: options.ctx.immutable,
            }), [
                ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier("key"), undefined, STRING),
            ], addlType));
        }
    }
    return coreObjectType.length
        ? ts.factory.createTypeLiteralNode(coreObjectType)
        : undefined;
}
//# sourceMappingURL=schema-object.js.map