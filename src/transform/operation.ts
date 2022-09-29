import type { GlobalContext, OperationObject, ParameterObject, PathItemObject } from "../types.js";
import { comment, isRef, tsReadonly } from "../utils.js";
import { getParameterLocations, transformParametersArray } from "./parameters.js";
import { transformRequestBodyObj } from "./request.js";
import { transformResponsesObj } from "./responses.js";

interface TransformOperationOptions extends GlobalContext {
  globalParameters?: Record<string, ParameterObject>;
  pathItem?: PathItemObject;
}

export function transformOperationObj(operation: OperationObject, options: TransformOperationOptions): string {
  const { pathItem = {}, globalParameters, ...ctx } = options;
  const readonly = tsReadonly(ctx.immutableTypes);

  let output = "";

  if (operation.parameters || pathItem.parameters) {
    const parameters = (pathItem.parameters || []).concat(operation.parameters || []);
    output += `  ${readonly}parameters: {\n    ${transformParametersArray(parameters, {
      ...ctx,
      globalParameters,
    })}\n  }\n`;
  }

  if (operation.responses) {
    output += `  ${readonly}responses: {\n    ${transformResponsesObj(operation.responses, ctx)}\n  }\n`;
  }

  if (operation.requestBody) {
    if (isRef(operation.requestBody)) {
      output += `  ${readonly}requestBody: ${operation.requestBody.$ref};\n`;
    } else {
      if (operation.requestBody.description) output += comment(operation.requestBody.description);
      output += `  ${readonly}requestBody: {\n  ${transformRequestBodyObj(operation.requestBody, ctx)}  }\n`;
    }
  }

  return output;
}

export function operationRequestType(
  operationId: string,
  operation: OperationObject,
  options: TransformOperationOptions
): string {
  const { pathItem = {}, globalParameters, ...ctx } = options;
  const parameters = (pathItem.parameters || []).concat(operation.parameters || []);
  const types = getParameterLocations(parameters, { ...ctx, globalParameters });

  const opType = `operations["${operationId}"]`;
  const opParams = `${opType}["parameters"]`;
  const paramType = types.includes("path") ? `${opParams}["path"]` : "never";
  const bodyType = operation.requestBody ? `${opType}["requestBody"]["content"]["application/json"]` : "never";
  const queryType = types.includes("query") ? `${opParams}["query"]` : "never";

  return `${paramType}, express<Locals>["${operationId}"]["responses"], ${bodyType}, ${queryType}, Locals`;
}
