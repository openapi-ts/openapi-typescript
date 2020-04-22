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

  // propertyMapper
  const propertyMapped = options
    ? propertyMapper(schema.definitions, options.propertyMapper)
    : schema.definitions;

  // type conversions
  const objectsAndArrays = JSON.parse(
    JSON.stringify(propertyMapped),
    (_, node) => {
      // $ref
      if (node["$ref"]) {
        return escape(
          `definitions['${node.$ref
            .replace("#/definitions/", "")
            .replace(/\//g, "']['")}']`
        ); // important: use single-quotes her
      }

      // primitives
      if (node.type && PRIMITIVES[node.type]) {
        return escape(
          node.enum
            ? tsUnionOf((node.enum as string[]).map((item) => `'${item}'`))
            : PRIMITIVES[node.type]
        );
      }

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
          ...(Object.keys(properties).length
            ? [JSON.stringify(properties)]
            : []),
        ]);
      }

      // arrays
      if (isArrayNode(node) && typeof node.items === "string") {
        return escape(tsArrayOf(node.items));
      }

      return node; // return by default
    }
  );

  return `export interface definitions {
  ${unescape(
    Object.entries(objectsAndArrays)
      .map(([key, val]) => `${JSON.stringify(key)}: ${val}`)
      .join(";\n")
  )}
}`;
}
