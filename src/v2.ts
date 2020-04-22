import propertyMapper from "./property-mapper";
import { OpenAPI2, OpenAPI2SchemaObject, SwaggerToTSOptions } from "./types";
import {
  escape,
  fromEntries,
  isArrayNode,
  isObjNode,
  isSchemaObj,
  makeOptional,
  tsArrayOf,
  tsIntersectionOf,
  tsUnionOf,
  unescape,
} from "./utils";

export const PRIMITIVES: { [key: string]: "boolean" | "string" | "number" } = {
  // boolean types
  boolean: "boolean",

  // string types
  binary: "string",
  byte: "string",
  date: "string",
  dateTime: "string",
  password: "string",
  string: "string",

  // number types
  double: "number",
  float: "number",
  integer: "number",
  number: "number",
};

export default function generateTypesV2(
  schema: OpenAPI2,
  options?: SwaggerToTSOptions
): string {
  if (!schema.definitions) {
    throw new Error(
      `⛔️ 'definitions' missing from schema https://swagger.io/specification/v2/#definitions-object`
    );
  }

  // 1st pass: expand $refs first to reduce lookups & prevent circular refs
  const expandedRefs = JSON.parse(
    JSON.stringify(schema.definitions),
    (_, node) =>
      node && node["$ref"]
        ? escape(
            `definitions['${node.$ref
              .replace("#/definitions/", "")
              .replace(/\//g, "']['")}']`
          ) // important: use single-quotes here for JSON (you can always change w/ Prettier at the end)
        : node // return by default
  );

  // 2nd pass: propertyMapper
  const propertyMapped = options
    ? propertyMapper(expandedRefs, options.propertyMapper)
    : expandedRefs;

  // 3rd pass: primitives
  const primitives = JSON.parse(
    JSON.stringify(propertyMapped),
    (_, node: OpenAPI2SchemaObject) => {
      if (node.type && PRIMITIVES[node.type]) {
        // prepend comment to each item
        return escape(
          node.enum
            ? tsUnionOf(node.enum.map((item) => `'${item}'`))
            : PRIMITIVES[node.type]
        );
      }
      return node; // return by default
    }
  );

  // 4th pass: objects & arrays
  const objectsAndArrays = JSON.parse(JSON.stringify(primitives), (_, node) => {
    // object
    if (isObjNode(node)) {
      // handle no properties
      if (
        (!node.properties || !Object.keys(node.properties).length) &&
        (!node.allOf || !node.allOf.length) &&
        !node.additionalProperties
      ) {
        return escape(`{[key: string]: any}`);
      }

      // unescape properties if some have been transformed already for nested objects
      const properties = makeOptional(
        fromEntries(
          Object.entries(
            (node.properties as OpenAPI2SchemaObject["properties"]) || {}
          ).map(([key, val]) => {
            if (typeof val === "string") {
              // try and parse as JSON to remove bad string escapes; otherwise, escape normally
              try {
                return [key, JSON.parse(val)];
              } catch (err) {
                return [key, escape(unescape(val))];
              }
            }
            return [key, val];
          })
        ),
        node.required
      );

      // if additional properties, add to end of properties
      if (node.additionalProperties) {
        const addlType =
          typeof node.additionalProperties === "string" &&
          PRIMITIVES[unescape(node.additionalProperties)];
        properties[escape("[key: string]")] = escape(addlType || "any");
      }

      return tsIntersectionOf([
        // append allOf first
        ...(node.allOf
          ? node.allOf.map((item: any) =>
              isSchemaObj(item)
                ? JSON.stringify(makeOptional(item, node.required))
                : item
            )
          : []),
        // then properties + additionalProperties
        ...(Object.keys(properties).length ? [JSON.stringify(properties)] : []),
      ]);
    }

    // arrays
    if (isArrayNode(node) && typeof node.items === "string") {
      return escape(tsArrayOf(node.items));
    }

    return node; // return by default
  });

  return `export interface definitions {
  ${unescape(
    Object.entries(objectsAndArrays)
      .map(([key, val]) => `${JSON.stringify(key)}: ${val}`)
      .join(";\n")
  )}
}`;
}
