import propertyMapper from "./property-mapper";
import { OpenAPI2, OpenAPI2SchemaObject, SwaggerToTSOptions } from "./types";
import {
  comment,
  nodeType,
  transformRef,
  tsArrayOf,
  tsIntersectionOf,
  tsUnionOf,
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
  function transform(node: OpenAPI2SchemaObject): string {
    switch (nodeType(node)) {
      case "ref": {
        return transformRef(node.$ref);
      }
      case "string":
      case "number":
      case "boolean": {
        return nodeType(node) || "any";
      }
      case "enum": {
        return tsUnionOf(
          (node.enum as string[]).map((item) =>
            typeof item === "number" || typeof item === "boolean"
              ? item
              : `'${item}'`
          )
        );
      }
      case "object": {
        if (
          (!node.properties || !Object.keys(node.properties).length) &&
          !node.allOf &&
          !node.additionalProperties
        ) {
          return `{ [key: string]: any }`;
        }

        let properties = createKeys(node.properties || {}, node.required);

        // if additional properties, add to end of properties
        if (node.additionalProperties) {
          properties += `[key: string]: ${
            nodeType(node.additionalProperties) || "any"
          };\n`;
        }

        return tsIntersectionOf([
          ...(node.allOf ? (node.allOf as any[]).map(transform) : []), // append allOf first
          ...(properties ? [`{ ${properties} }`] : []), // then properties + additionalProperties
        ]);
        break;
      }
      case "array": {
        return tsArrayOf(transform(node.items as any));
      }
    }

    return "";
  }

  function createKeys(
    obj: { [key: string]: any },
    required: string[] = []
  ): string {
    let output = "";

    Object.entries(obj).forEach(([key, value]) => {
      // 1. JSDoc comment (goes above property)
      if (value.description) {
        output += comment(value.description);
      }

      // 2. name (with “?” if optional property)
      output += `"${key}"${!required || !required.includes(key) ? "?" : ""}: `;

      // 3. get value
      output += transform(value);

      // 4. close type
      output += ";\n";
    });

    return output;
  }

  // note: make sure that base-level definitions are required
  return `export interface definitions {
    ${createKeys(propertyMapped, Object.keys(propertyMapped))}
  }`;
}
