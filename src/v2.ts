import propertyMapper from "./property-mapper";
import { OpenAPI2, OpenAPI2Reference, OpenAPI2SchemaObject, OpenAPI2Schemas, SwaggerToTSOptions } from "./types";
import { comment, nodeType, transformRef, tsArrayOf, tsIntersectionOf, tsUnionOf, isOpenAPI2Reference } from "./utils";

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

export default function generateTypesV2(input: OpenAPI2 | OpenAPI2Schemas, options?: SwaggerToTSOptions): string {
  const rawSchema = options && options.rawSchema;

  let definitions: OpenAPI2Schemas;

  if (rawSchema) {
    definitions = input as OpenAPI2Schemas;
  } else {
    const document = input as OpenAPI2;

    if (!document.definitions) {
      throw new Error(`⛔️ 'definitions' missing from schema https://swagger.io/specification/v2/#definitions-object`);
    }
    definitions = document.definitions;
  }

  // propertyMapper
  const propertyMapped = options ? propertyMapper(definitions, options.propertyMapper) : definitions;

  //this functionality could perhaps be added to the nodeType function, but I don't want to mess with that code
  function getAdditionalPropertiesType(additionalProperties: OpenAPI2SchemaObject | OpenAPI2Reference | boolean) {
    if (isOpenAPI2Reference(additionalProperties)) {
      return transformRef(additionalProperties.$ref, rawSchema ? "definitions/" : "");
    }
    return nodeType(additionalProperties);
  }

  // type conversions
  function transform(node: OpenAPI2SchemaObject): string {
    switch (nodeType(node)) {
      case "ref": {
        return transformRef(node.$ref, rawSchema ? "definitions/" : "");
      }
      case "string":
      case "number":
      case "boolean": {
        return nodeType(node) || "any";
      }
      case "enum": {
        return tsUnionOf(
          (node.enum as string[]).map((item) =>
            typeof item === "number" || typeof item === "boolean" ? item : `'${item}'`
          )
        );
      }
      case "object": {
        if ((!node.properties || !Object.keys(node.properties).length) && !node.allOf && !node.additionalProperties) {
          return `{ [key: string]: any }`;
        }

        let properties = createKeys(node.properties || {}, node.required);

        // if additional properties, add to end of properties
        if (node.additionalProperties) {
          properties += `[key: string]: ${getAdditionalPropertiesType(node.additionalProperties) || "any"};\n`;
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

  function createKeys(obj: { [key: string]: any }, required: string[] = []): string {
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
