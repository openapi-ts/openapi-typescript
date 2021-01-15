import { transformSchemaObj } from "./schema";
import { ParameterObject, ReferenceObject } from "../types";
import { comment } from "../utils";

export function transformParametersArray(
  parameters: (ReferenceObject | ParameterObject)[],
  globalParams?: Record<string, ParameterObject>
): string {
  let output = "";

  // sort into map
  let mappedParams: Record<string, Record<string, ParameterObject>> = {};
  parameters.forEach((paramObj: any) => {
    if (paramObj.$ref && globalParams) {
      const paramName = paramObj.$ref.split("/").pop(); // take last segment
      if (globalParams[paramName]) {
        const reference = globalParams[paramName] as any;
        if (!mappedParams[reference.in]) mappedParams[reference.in] = {};
        mappedParams[reference.in][reference.name || paramName] = {
          ...reference,
          schema: { $ref: paramObj.$ref },
        } as any;
      }
      return;
    }

    if (!paramObj.in || !paramObj.name) return;
    if (!mappedParams[paramObj.in]) mappedParams[paramObj.in] = {};
    mappedParams[paramObj.in][paramObj.name] = paramObj;
  });

  // transform output
  Object.entries(mappedParams).forEach(([paramIn, paramGroup]) => {
    output += `  ${paramIn}: {\n`; // open in
    Object.entries(paramGroup).forEach(([paramName, paramObj]) => {
      let paramComment = "";
      if (paramObj.deprecated) paramComment += `@deprecated `;
      if (paramObj.description) paramComment += paramObj.description;
      if (paramComment) output += comment(paramComment);

      const required = paramObj.required ? `` : `?`;
      output += `    "${paramName}"${required}: ${
        paramObj.schema ? transformSchemaObj(paramObj.schema) : "unknown"
      };\n`;
    });
    output += `  }\n`; // close in
  });

  return output;
}
