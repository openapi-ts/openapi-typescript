import { OperationObject, ParameterObject, ReferenceObject } from "../types";
import { comment, transformRef } from "../utils";
import { transformParametersArray } from "./parameters";
import { transformResponsesObj } from "./responses";
import { transformSchemaObj } from "./schema";

export function transformOperationObj(
  operation: OperationObject,
  globalParams?: Record<string, ParameterObject>
): string {
  let output = "";

  if (operation.parameters) {
    output += `  parameters: {\n    ${transformParametersArray(operation.parameters, globalParams)}\n  }\n`;
  }

  if (operation.responses) {
    output += `  responses: {\n  ${transformResponsesObj(operation.responses)}\n  }\n`;
  }

  if (operation.requestBody) {
    if (isRef(operation.requestBody)) {
      output += `  requestBody: ${transformRef(operation.requestBody.$ref)};\n`;
    } else {
      const {description, content} = operation.requestBody

      if (description) output += comment(description);

      if (content && Object.keys(content).length) {
        output += `  requestBody: {\n    content: {\n`; // open requestBody

        Object.entries(content).forEach(([k, v]) => {
          output += `      "${k}": ${transformSchemaObj(v.schema)};\n`;
        });
        output += `    }\n  }\n`; // close requestBody
      } else {
        output += `  requestBody: unknown;\n`;
      }

    }
  }

  return output;
}

export function isRef(obj: any): obj is ReferenceObject {
  return !!obj.$ref
}