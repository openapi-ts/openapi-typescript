import { GlobalContext, OperationObject, ParameterObject, PathItemObject } from "../types";
import { comment, tsReadonly } from "../utils";
import { transformOperationObj } from "./operation";
import { transformParametersArray } from "./parameters";

interface TransformPathsObjOption extends GlobalContext {
  globalParameters: Record<string, ParameterObject>;
  operations: Record<string, { operation: OperationObject; pathItem: PathItemObject }>;
}

/** Note: this needs to mutate objects passed in */
export function transformPathsObj(paths: Record<string, PathItemObject>, options: TransformPathsObjOption): string {
  const { globalParameters, operations, ...ctx } = options;
  const readonly = tsReadonly(ctx.immutableTypes);

  let output = "";

  for (const [url, pathItem] of Object.entries(paths)) {
    if (pathItem.description) output += comment(pathItem.description); // add comment

    if (pathItem.$ref) {
      output += `  ${readonly}"${url}": ${pathItem.$ref};\n`;
      continue;
    }

    output += ` ${readonly}"${url}": {\n`; // open PathItem

    // methods
    for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"]) {
      const operation = (pathItem as any)[method];
      if (!operation) continue; // only allow valid methods
      if (operation.description) output += comment(operation.description); // add comment
      if (operation.operationId) {
        // if operation has operationId, abstract into top-level operations object
        operations[operation.operationId] = { operation, pathItem };
        const namespace = ctx.namespace ? `external["${ctx.namespace}"]["operations"]` : `operations`;
        output += `    ${readonly}"${method}": ${namespace}["${operation.operationId}"];\n`;
      } else {
        // otherwise, inline operation
        output += `    ${readonly}"${method}": {\n      ${transformOperationObj(operation, {
          ...ctx,
          globalParameters,
          pathItem,
        })}\n    }\n`;
      }
    }

    // parameters
    if (pathItem.parameters) {
      output += `   ${readonly}parameters: {\n      ${transformParametersArray(pathItem.parameters, {
        ...ctx,
        globalParameters,
      })}\n    }\n`;
    }

    output += `  }\n`; // close PathItem
  }

  return output;
}
