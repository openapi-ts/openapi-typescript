import { comment, isRef, transformRef } from "../utils";
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
      if (operation.requestBody.description) output += comment(operation.requestBody.description);

      output += `  requestBody: {\n`; // open requestBody
      output += `  ${transformRequestBodyObj(operation.requestBody)}`;
      output += `  }\n`; // close requestBody
    }
  }

  return output;
}

export function transformRequestBodyObj(requestBody: RequestBody) {
  let output = "";

  const { content } = requestBody;

  if (content && Object.keys(content).length) {
    output += `  content: {\n`; // open content

    Object.entries(content).forEach(([k, v]) => {
      output += `      "${k}": ${transformSchemaObj(v.schema)};\n`;
    });
    output += `    }\n`; // close content
  } else {
    output += `  unknown;\n`;
  }

  return output;
}
