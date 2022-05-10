import type { GlobalContext, OperationObject, ParameterObject, PathItemObject } from "../types.js";
import { comment, tsReadonly, nodeType } from "../utils.js";
import { transformOperationObj } from "./operation.js";
import { transformParametersArray } from "./parameters.js";

interface TransformPathsObjOption extends GlobalContext {
  globalParameters: Record<string, ParameterObject>;
  operations: Record<string, { operation: OperationObject; pathItem: PathItemObject }>;
}

const httpMethods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

function replacePathParamsWithTypes(url: string, params: NonNullable<PathItemObject["parameters"]>) {
  let result = url;

  params.forEach((param) => {
    if ("in" in param && param.in === "path") {
      if (param.schema && "type" in param.schema) {
        result = result.replace(`{${param.name}}`, `\${${nodeType(param.schema)}}`);
      } else if (param.type) {
        result = result.replace(`{${param.name}}`, `\${${nodeType({ type: param.type })}}`);
      }
    }
  });

  return result;
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

    let key = `"${url}"`;

    if (url.includes("{") && url.includes("}") && ctx.pathParamsAsTypes) {
      let params;

      if (pathItem.parameters) {
        params = pathItem.parameters;
      } else {
        const firstMethodParams = Object.values(pathItem)
          .map((props) => typeof props === "object" && props.parameters)
          .filter(Boolean)[0];

        if (firstMethodParams) {
          params = firstMethodParams;
        }
      }

      key = `[key: \`${replacePathParamsWithTypes(url, params)}\`]`;
    }

    output += ` ${readonly}${key}: {\n`; // open PathItem

    // methods
    for (const method of httpMethods) {
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

/**
 * Generate an Enum with operation names as keys and the corresponding paths as values.
 */
export function makeApiPathsEnum(paths: Record<string, PathItemObject>): string {
  let output = "export enum ApiPaths {\n";

  for (const [url, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!["get", "put", "post", "delete", "options", "head", "patch", "trace"].includes(method)) continue;

      // Generate a name from the operation ID
      let pathName: string;
      if (operation.operationId) pathName = operation.operationId;
      else {
        // If the operation ID is not present, construct a name from the method and path
        pathName = (method + url)
          .split("/")
          .map((part) => {
            const capitalised = part.charAt(0).toUpperCase() + part.slice(1);

            // Remove any characters not allowed as enum keys, and attempt to remove
            //  named parameters.
            return capitalised.replace(/{.*}|:.*|[^a-zA-Z\d_]+/, "");
          })
          .join("");
      }

      // Replace {parameters} with :parameters
      const adaptedUrl = url.replace(/{(\w+)}/g, ":$1");

      output += `  ${pathName} = "${adaptedUrl}",\n`;
    }
  }

  output += "\n}";

  return output;
}
