import { comment, transformRef } from "../utils";
import { transformOperationObj } from "./operation";
import { transformParametersArray } from "./parameters";

interface TransformPathsObjOption {
  operations: Record<string, OperationObject>;
  globalParameters: Record<string, ParameterObject>;
  version: number;
}

/** Note: this needs to mutate objects passed in */
export function transformPathsObj(
  paths: Record<string, PathItemObject>,
  { operations, globalParameters, version }: TransformPathsObjOption
): string {
  let output = "";

  Object.entries(paths as Record<string, PathItemObject>).forEach(([url, pathItem]) => {
    if (pathItem.description) output += comment(pathItem.description); // add comment

    if (pathItem.$ref) {
      output += `  "${url}": ${transformRef(pathItem.$ref)};\n`;
      return;
    }

    output += `  "${url}": {\n`; // open PathItem

    // methods
    ["get", "put", "post", "delete", "options", "head", "patch", "trace"].forEach((method) => {
      const operation = (pathItem as any)[method];

      if (!operation) return; // only allow valid methods

      if (operation.description) output += comment(operation.description); // add comment

      // if operation has operationId, abstract into top-level operations object
      if (operation.operationId) {
        output += `    "${method}": operations["${operation.operationId}"];\n`;
        operations[operation.operationId] = operation;
        return;
      }

      // otherwise, inline operation
      output += `    "${method}": {\n      ${transformOperationObj(operation, { version, globalParameters })}\n    }\n`;
    });

    // parameters
    if (pathItem.parameters) {
      output += `    parameters: {\n      ${transformParametersArray(pathItem.parameters, {
        version,
        globalParameters,
      })}\n    }\n`;
    }

    output += `  }\n`; // close PathItem
  });

  return output;
}
