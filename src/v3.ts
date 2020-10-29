import propertyMapper from "./property-mapper";
import {
  OpenAPI3,
  OpenAPI3Parameter,
  OpenAPI3Paths,
  OpenAPI3SchemaObject,
  OpenAPI3Schemas,
  OpenAPI3Operation,
  Parameter,
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
      output += transform(value.schema ? value.schema : value);

      // 5. close nullable
      if (value.nullable) {
        output += ") | null";
      }

      // 6. close type
      output += ";\n";
    });

    return output;
  }

  function transformParameters(parameters: Parameter[]): string {
    const allParameters: Record<
      string,
      Record<string, OpenAPI3Parameter | string>
    > = {};

    let output = `parameters: {\n`;

    parameters.forEach((p) => {
      if ("$ref" in p) {
        const referencedValue = (p.$ref
          .substr(2)
          .split("/")
          .reduce(
            (value, property) => value[property],
            input
          ) as unknown) as OpenAPI3Parameter;

        if (!allParameters[referencedValue.in])
          allParameters[referencedValue.in] = {};

        allParameters[referencedValue.in][
          referencedValue.name
        ] = transformRef(p.$ref);
        return;
      }

      if (!allParameters[p.in]) allParameters[p.in] = {};
      allParameters[p.in][p.name] = p;
    });

    Object.entries(allParameters).forEach(([loc, locParams]) => {
      output += `"${loc}": {\n`;
      Object.entries(locParams).forEach(([paramName, paramProps]) => {
        if (typeof paramProps === "string") {
          output += `"${paramName}": ${paramProps}\n`;
          return;
        }
        if (paramProps.description)
          output += comment(paramProps.description);
        output += `"${paramName}"${
          paramProps.required === true ? "" : "?"
        }: ${transform(paramProps.schema)};\n`;
      });
      output += `}\n`;
    });
    output += `}\n`;

    return output;
  }

  function transformPaths(paths: OpenAPI3Paths): string {
    let output = "";
    Object.entries(paths).forEach(([path, methods]) => {
      output += `"${path}": {\n`;

      Object.entries(methods).forEach(([method, operation]) => {
        // skip the parameters "method" for shared parameters - we'll handle it later
        if (method !== "parameters") {
          operation = operation as OpenAPI3Operation;
          if (operation.description) output += comment(operation.description);
          output += `"${method}": {\n`;

          // handle operation parameters
          if (operation.parameters) {
            output += transformParameters(operation.parameters);
          }

          // handle requestBody
          if (operation.requestBody) {
            output += `requestBody: {\n`;
            Object.entries(operation.requestBody.content).forEach(
              ([contentType, { schema }]) => {
                output += `"${contentType}": ${transform(schema)};\n`;
              }
            );
            output += `}\n`;
          }

          // handle responses
          output += `responses: {\n`;
          Object.entries(operation.responses).forEach(
            ([statusCode, response]) => {
              if (response.description) output += comment(response.description);
              if (!response.content || !Object.keys(response.content).length) {
                const type =
                  statusCode === "204" || Math.floor(+statusCode / 100) === 3
                    ? "never"
                    : "unknown";
                output += `"${statusCode}": ${type};\n`;
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
        }
      });

      if (methods.parameters) {
        // Handle shared parameters
        output += transformParameters(methods.parameters as Parameter[])
      }
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

  if (components.parameters && Object.keys(components.parameters).length) {
    finalOutput += `
parameters: {
  ${createKeys(components.parameters, Object.keys(components.parameters))}
}\n`;
  }

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
