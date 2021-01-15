import { OperationObject, ParameterObject } from "../types";
import { comment } from "../utils";
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

  if (operation.requestBody && operation.requestBody.content) {
    if (operation.requestBody.description) output += comment(operation.requestBody.description);

    if (Object.keys(operation.requestBody.content).length) {
      output += `  requestBody: {\n    content: {\n`; // open requestBody

      Object.entries(operation.requestBody.content).forEach(([k, v]) => {
        output += `      "${k}": ${transformSchemaObj(v.schema)};\n`;
      });
      output += `    }\n  }\n`; // close requestBody
    } else {
      output += `  requestBody: unknown;\n`;
    }
  }

  return output;
}
