import propertyMapper from "./property-mapper";
import {
  OpenAPI3,
  OpenAPI3Parameter,
  OpenAPI3Paths,
  OpenAPI3SchemaObject,
  OpenAPI3Schemas,
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
  tsTupleOf,
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
  const { rawSchema = false } = options || {};
  let { paths = {}, components = { schemas: {} } } = input as OpenAPI3;

  if (rawSchema) {
    components = { schemas: input };
  } else {
    if (!input.components && !input.paths) {
      throw new Error(
        `No components or paths found. Specify --raw-schema to load a raw schema.`
      );
    }
  }

  // propertyMapper
  const propertyMapped = options
    ? propertyMapper(components.schemas, options.propertyMapper)
    : components.schemas;

  // type converter
  function transform(node: OpenAPI3SchemaObject): string {
    switch (nodeType(node)) {
      case "ref": {
        return transformRef(node.$ref, rawSchema ? "schemas/" : "");
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
            node.additionalProperties === true
              ? "any"
              : transform(node.additionalProperties) || "any"
          };\n`;
        }

        return tsIntersectionOf([
          ...(node.allOf ? (node.allOf as any[]).map(transform) : []), // append allOf first
          ...(properties ? [`{ ${properties} }`] : []), // then properties + additionalProperties
        ]);
      }
      case "array": {
        if (Array.isArray(node.items)) {
          return tsTupleOf(node.items.map(transform));
        } else {
          return tsArrayOf(node.items ? transform(node.items as any) : "any");
        }
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

  function transformPaths(paths: OpenAPI3Paths): string {
    let output = "";
    Object.entries(paths).forEach(([path, methods]) => {
      output += `"${path}": {\n`;
      Object.entries(methods).forEach(([method, responses]) => {
        if (responses.description) output += comment(responses.description);
        output += `"${method}": {\n`;

        // handle parameters
        if (responses.parameters) {
          output += `parameters: {\n`;
          const allParameters: Record<
            string,
            Record<string, OpenAPI3Parameter>
          > = {};
          responses.parameters.forEach((p) => {
            if (!allParameters[p.in]) allParameters[p.in] = {};
            // TODO: handle $ref parameters
            if (p.name) {
              allParameters[p.in][p.name] = p;
            }
          });

          Object.entries(allParameters).forEach(([loc, locParams]) => {
            output += `"${loc}": {\n`;
            Object.entries(locParams).forEach(([paramName, paramProps]) => {
              if (paramProps.description)
                output += comment(paramProps.description);
              output += `"${paramName}"${
                paramProps.required === true ? "" : "?"
              }: ${transform(paramProps.schema)};\n`;
            });
            output += `}\n`;
          });
          output += `}\n`;
        }

        // handle requestBody
        if (responses.requestBody) {
          output += `requestBody: {\n`;
          Object.entries(responses.requestBody.content).forEach(
            ([contentType, { schema }]) => {
              output += `"${contentType}": ${transform(schema)};\n`;
            }
          );
          output += `}\n`;
        }

        // handle responses
        output += `responses: {\n`;
        Object.entries(responses.responses).forEach(
          ([statusCode, response]) => {
            if (response.description) output += comment(response.description);
            if (!response.content || !Object.keys(response.content).length) {
              output += `"${statusCode}": any;\n`;
              return;
            }
            output += `"${statusCode}": {\n`;
            Object.entries(response.content).forEach(
              ([contentType, encodedResponse]) => {
                output += `"${contentType}": ${transform(
                  encodedResponse.schema
                )};\n`;
              }
            );
            output += `}\n`;
          }
        );
        output += `}\n`;
        output += `}\n`;
      });
      output += `}\n`;
    });
    return output;
  }

  if (rawSchema) {
    return `export interface schemas {
  ${createKeys(propertyMapped, Object.keys(propertyMapped))}
}`;
  }

  // now put everything together
  let finalOutput = "";

  // handle paths
  if (Object.keys(paths).length) {
    finalOutput += `export interface paths {
  ${transformPaths(paths)}
}

`;
  }

  finalOutput += "export interface components {\n";

  // TODO: handle components.parameters

  if (Object.keys(propertyMapped).length) {
    finalOutput += `schemas: {
  ${createKeys(propertyMapped, Object.keys(propertyMapped))}
}`;
  }
  if (components.responses && Object.keys(components.responses).length) {
    finalOutput += `
responses: {
  ${createKeys(components.responses, Object.keys(components.responses))}
}`;
  }

  // close components wrapper
  finalOutput += "\n}";

  return finalOutput;
}
