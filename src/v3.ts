import propertyMapper from "./property-mapper";
import {
  OpenAPI3,
  OpenAPI3Schemas,
  OpenAPI3SchemaObject,
  SwaggerToTSOptions,
} from "./types";
import {
  comment,
  nodeType,
  transformRef,
  tsArrayOf,
  tsIntersectionOf,
  tsPartial,
  tsUnionOf,
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
  input: OpenAPI3 | OpenAPI3Schemas,
  options?: SwaggerToTSOptions
): string {
  const schemas = options?.rawSchema
    ? (input as OpenAPI3Schemas)
    : (input as OpenAPI3).components?.schemas;

  if (!schemas) {
    throw new Error(
      `⛔️ 'components' missing from schema https://swagger.io/specification`
    );
  }

  // propertyMapper
  const propertyMapped = options
    ? propertyMapper(schemas, options.propertyMapper)
    : schemas;

  // type converter
  function transform(node: OpenAPI3SchemaObject): string {
    switch (nodeType(node)) {
      case "ref": {
        return transformRef(node.$ref, options?.rawSchema ? "schemas/" : "");
      }
      case "string":
      case "number":
      case "boolean": {
        return nodeType(node) || "any";
      }
      case "enum": {
        return tsUnionOf((node.enum as string[]).map((item) => `'${item}'`));
      }
      case "oneOf": {
        return tsUnionOf((node.oneOf as any[]).map(transform));
      }
      case "anyOf": {
        return tsIntersectionOf(
          (node.anyOf as any[]).map((anyOf) => tsPartial(transform(anyOf)))
        );
      }
      case "object": {
        // if empty object, then return generic map type
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
      }
      case "array": {
        return tsArrayOf(transform(node.items as any));
      }
    }

    return "";
  }

  function createKeys(
    obj: { [key: string]: any },
    required?: string[]
  ): string {
    let output = "";

    Object.entries(obj).forEach(([key, value]) => {
      // 1. JSDoc comment (goes above property)
      if (value.description) {
        output += comment(value.description);
      }

      // 2. name (with “?” if optional property)
      output += `"${key}"${!required || !required.includes(key) ? "?" : ""}: `;

      // 3. open nullable
      if (value.nullable) {
        output += "(";
      }

      // 4. transform
      output += transform(value);

      // 5. close nullable
      if (value.nullable) {
        output += ") | null";
      }

      // 6. close type
      output += ";\n";
    });

    return output;
  }

  // note: make sure that base-level schemas are required
  const output = createKeys(propertyMapped, Object.keys(propertyMapped));

  return options?.rawSchema
    ? `export interface schemas {
    ${output}
  }`
    : `export interface components {
    schemas: {
      ${output}
    }
  }`;
}
