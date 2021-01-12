import { OperationObject, PathItemObject } from "../types";
import { comment, transformRef } from "../utils";
import { transformOperationObj } from "./operation";
import { transformSchemaObjMap } from "./schema";

interface TransformOptions {
  rawSchema?: boolean;
  version: number;
}

export function transformAll(schema: any, { version, rawSchema }: TransformOptions): string {
  let output = "";

  let operations: Record<string, OperationObject> = {};

  // #/paths (V2 & V3)
  output += `export interface paths {\n`; // open paths
  if (!rawSchema && schema.paths) {
    Object.entries(schema.paths as Record<string, PathItemObject>).forEach(([url, pathItem]) => {
      if (pathItem.description) output += comment(pathItem.description); // add comment

      if (pathItem.$ref) {
        output += `  "${url}": ${transformRef(pathItem.$ref)};\n`;
        return;
      }

      output += `  "${url}": {\n`; // open PathItem
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (operation.description) output += comment(operation.description); // add comment

        // if operation has operationId, abstract into top-level operations object
        if (operation.operationId) {
          output += `    "${method}": operations["${operation.operationId}"];\n`;
          operations[operation.operationId] = operation;
          return;
        }
        // otherwise, inline operation
        output += `    "${method}": {\n      ${transformOperationObj(operation, schema.parameters)};\n    }\n`;
      });
      output += `  }\n`; // close PathItem
    });
  }
  output += `}\n\n`; // close paths

  switch (version) {
    case 2: {
      // #/definitions
      let schemaDefs = rawSchema ? schema : schema.definitions;
      output += `export interface definitions {  ${transformSchemaObjMap(schemaDefs || {}, {
        required: Object.keys(schemaDefs),
      })}\n}`;
    }
    case 3: {
      // #/components
      output += `export interface components {\n`;
      let schemaDefs = rawSchema ? schema : schema.components?.schemas;

      // #/components/schemas
      if (schemaDefs)
        output += `  schemas: {\n    ${transformSchemaObjMap(schemaDefs, {
          required: Object.keys(schemaDefs),
        })}\n  }\n`;
      output += `}\n`;
    }
  }

  if (Object.keys(operations).length) {
    output += `export interface operations {\n`; // open operations
    Object.entries(operations).forEach(([operationId, operation]) => {
      if (operation.description) output += comment(operation.description); // handle comment
      output += `  "${operationId}": {\n    ${transformOperationObj(operation, schema.components?.parameters)};\n  }\n`;
    });
    output += `}\n`; // close operations
  }

  return output;
}
