import { OperationObject, ParameterObject, PathItemObject } from "../types";
import { comment, transformRef, tsReadonly } from "../utils";
import { transformOperationObj } from "./operation";
import { transformParametersArray } from "./parameters";

interface TransformPathsObjOption {
  globalParameters: Record<string, ParameterObject>;
  immutableTypes: boolean;
  operations: Record<string, { operation: OperationObject; pathItem: PathItemObject }>;
  version: number;
}

/** Note: this needs to mutate objects passed in */
export function transformPathsObj(
  paths: Record<string, PathItemObject>,
  { globalParameters, immutableTypes, operations, version }: TransformPathsObjOption
): string {
  const readonly = tsReadonly(immutableTypes);

  let output = "";

  Object.entries(paths).forEach(([url, pathItem]) => {
    if (pathItem.description) output += comment(pathItem.description); // add comment

    if (pathItem.$ref) {
      output += `  ${readonly}"${url}": ${transformRef(pathItem.$ref)};\n`;
      return;
    }

    output += ` ${readonly}"${url}": {\n`; // open PathItem

    // methods
    ["get", "put", "post", "delete", "options", "head", "patch", "trace"].forEach((method) => {
      const operation = (pathItem as any)[method];

      if (!operation) return; // only allow valid methods

      if (operation.description) output += comment(operation.description); // add comment

      // if operation has operationId, abstract into top-level operations object
      if (operation.operationId) {
        operations[operation.operationId] = { operation, pathItem };
        output += `    ${readonly}"${method}": operations["${operation.operationId}"];\n`;
        return;
      }
      // otherwise, inline operation
      output += `    ${readonly}"${method}": {\n      ${transformOperationObj(operation, {
        globalParameters,
        immutableTypes,
        pathItem,
        version,
      })}\n    }\n`;
    });

    // parameters
    if (pathItem.parameters) {
      output += `   ${readonly}parameters: {\n      ${transformParametersArray(pathItem.parameters, {
        globalParameters,
        immutableTypes,
        version,
      })}\n    }\n`;
    }

    output += `  }\n`; // close PathItem
  });

  return output;
}
