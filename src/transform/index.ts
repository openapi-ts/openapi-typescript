import { comment } from "../utils";
import { transformHeaderObjMap } from "./headers";
import { transformOperationObj } from "./operation";
import { transformPathsObj } from "./paths";
import { transformResponsesObj, transformRequestBodies } from "./responses";
import { transformSchemaObjMap } from "./schema";

interface TransformOptions {
  rawSchema?: boolean;
  version: number;
}

export function transformAll(schema: any, { version, rawSchema }: TransformOptions): string {
  let output = "";

  let operations: Record<string, OperationObject> = {};

  // --raw-schema mode
  if (rawSchema) {
    switch (version) {
      case 2: {
        return `export interface definitions {\n  ${transformSchemaObjMap(schema, {
          required: Object.keys(schema),
        })}\n}`;
      }
      case 3: {
        return `export interface schemas {\n    ${transformSchemaObjMap(schema, {
          required: Object.keys(schema),
        })}\n  }\n\n`;
      }
    }
  }

  // #/paths (V2 & V3)
  output += `export interface paths {\n`; // open paths
  if (schema.paths) {
    output += transformPathsObj(
      schema.paths,
      {
        operations,
        parameters: (schema.components && schema.components.parameters) || schema.parameters,
      },
      version
    );
  }
  output += `}\n\n`; // close paths

  switch (version) {
    case 2: {
      // #/definitions
      if (schema.definitions) {
        output += `export interface definitions {\n  ${transformSchemaObjMap(schema.definitions, {
          required: Object.keys(schema.definitions),
        })}\n}\n\n`;
      }

      // #/parameters
      if (schema.parameters) {
        const required = Object.keys(schema.parameters);
        output += `export interface parameters {\n    ${transformSchemaObjMap(schema.parameters, {
          required,
        })}\n  }\n\n`;
      }

      // #/parameters
      if (schema.responses) {
        output += `export interface responses {\n    ${transformResponsesObj(schema.responses)}\n  }\n\n`;
      }
      break;
    }
    case 3: {
      // #/components
      output += `export interface components {\n`; // open components

      if (schema.components) {
        // #/components/schemas
        if (schema.components.schemas) {
          const required = Object.keys(schema.components.schemas);
          output += `  schemas: {\n    ${transformSchemaObjMap(schema.components.schemas, { required })}\n  }\n`;
        }

        // #/components/responses
        if (schema.components.responses) {
          output += `  responses: {\n    ${transformResponsesObj(schema.components.responses)}\n  }\n`;
        }

        // #/components/parameters
        if (schema.components.parameters) {
          const required = Object.keys(schema.components.parameters);
          output += `  parameters: {\n    ${transformSchemaObjMap(schema.components.parameters, {
            required,
          })}\n  }\n`;
        }

        // #/components/requestBodies
        if (schema.components.requestBodies) {
          output += `  requestBodies: {\n    ${transformRequestBodies(schema.components.requestBodies)}\n  }\n`;
        }

        // #/components/headers
        if (schema.components.headers) {
          output += `  headers: {\n    ${transformHeaderObjMap(schema.components.headers)}  }\n`;
        }
      }

      output += `}\n\n`; // close components
      break;
    }
  }

  output += `export interface operations {\n`; // open operations
  if (Object.keys(operations).length) {
    Object.entries(operations).forEach(([operationId, operation]) => {
      if (operation.description) output += comment(operation.description); // handle comment
      output += `  "${operationId}": {\n    ${transformOperationObj(
        operation,
        version,
        schema.components && schema.components.parameters
      )}\n  }\n`;
    });
  }
  output += `}\n`; // close operations

  return output.trim();
}
