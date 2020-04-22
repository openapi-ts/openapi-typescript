import propertyMapper from "./property-mapper";
import { OpenAPI3, OpenAPI3SchemaObject, SwaggerToTSOptions } from "./types";
import {
  escape,
  fromEntries,
  isAnyOfNode,
  isArrayNode,
  isObjNode,
  isOneOfNode,
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
  string: "string",

  // number types
  integer: "number",
  number: "number",
};

export default function generateTypesV3(
  schema: OpenAPI3,
  options?: SwaggerToTSOptions
): string {
  if (!schema.components || !schema.components.schemas) {
    throw new Error(
      `⛔️ 'components' missing from schema https://swagger.io/specification`
    );
  }

  // propertyMapper
  const propertyMapped = options
    ? propertyMapper(schema.components.schemas, options.propertyMapper)
    : schema.components.schemas;

  // type converter
  const objectsAndArrays = JSON.parse(
    JSON.stringify(propertyMapped),
    (_, node) => {
      // $ref
      if (node["$ref"]) {
        return escape(
          `components['${node.$ref
            .replace("#/components/", "")
            .replace(/\//g, "']['")}']`
        ); // important: use single-quotes here for JSON (you can always change w/ Prettier at the end)
      }

      // oneOf
      if (isOneOfNode(node)) {
        return escape(tsUnionOf(node.oneOf));
      }

      // anyOf
      if (isAnyOfNode(node)) {
        return escape(
          tsIntersectionOf(
            (node.anyOf as string[]).map((item) => escape(`Partial<${item}>`))
          )
        );
      }

      // primitive
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
              (node.properties as OpenAPI3SchemaObject["properties"]) || {}
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

  return `export interface components {
    schemas: {
    ${unescape(
      Object.entries(objectsAndArrays)
        .map(([key, val]) => `${JSON.stringify(key)}: ${val}`)
        .join(";\n")
    )}
  }
}`;
}
