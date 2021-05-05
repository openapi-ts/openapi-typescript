import { OperationObject, ParameterObject, PathItemObject, RequestBody } from "../types";
import { comment, isRef, transformRef, tsReadonly } from "../utils";
import { transformParametersArray } from "./parameters";
import { transformResponsesObj } from "./responses";
import { transformSchemaObj } from "./schema";

export function transformOperationObj(
  operation: OperationObject,
  {
    globalParameters,
    immutableTypes,
    pathItem = {},
    version,
  }: {
    pathItem?: PathItemObject;
    globalParameters?: Record<string, ParameterObject>;
    immutableTypes: boolean;
    version: number;
  }
): string {
  const readonly = tsReadonly(immutableTypes);

  let output = "";

  if (operation.parameters || pathItem.parameters) {
    const parameters = (pathItem.parameters || []).concat(operation.parameters || []);
    output += `  ${readonly}parameters: {\n    ${transformParametersArray(parameters, {
      globalParameters,
      immutableTypes,
      version,
    })}\n  }\n`;
  }

  if (operation.responses) {
    output += `  ${readonly}responses: {\n  ${transformResponsesObj(operation.responses, {
      immutableTypes,
      version,
    })}\n  }\n`;
  }

  if (operation.requestBody) {
    if (isRef(operation.requestBody)) {
      output += `  ${readonly}requestBody: ${transformRef(operation.requestBody.$ref)};\n`;
    } else {
      if (operation.requestBody.description) output += comment(operation.requestBody.description);

      output += `  ${readonly}requestBody: {\n`; // open requestBody
      output += `  ${transformRequestBodyObj(operation.requestBody, { immutableTypes, version })}`;
      output += `  }\n`; // close requestBody
    }
  }

  return output;
}

export function transformRequestBodyObj(
  requestBody: RequestBody,
  { immutableTypes, version }: { immutableTypes: boolean; version: number }
): string {
  const readonly = tsReadonly(immutableTypes);

  let output = "";

  const { content } = requestBody;

  if (content && Object.keys(content).length) {
    output += `  ${readonly}content: {\n`; // open content

    Object.entries(content).forEach(([k, v]) => {
      output += `      ${readonly}"${k}": ${transformSchemaObj(v.schema, { immutableTypes, version })};\n`;
    });
    output += `    }\n`; // close content
  } else {
    output += `  unknown;\n`;
  }

  return output;
}
