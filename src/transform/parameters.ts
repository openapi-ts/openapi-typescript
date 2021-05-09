import { ParameterObject, ReferenceObject, SourceDocument } from "../types";
import { comment, resolveRefIfNeeded, tsReadonly } from "../utils";
import { transformSchemaObj } from "./schema";

export function transformParametersArray(
  parameters: (ReferenceObject | ParameterObject)[],
  {
    globalParameters,
    immutableTypes,
    document,
    version,
  }: {
    globalParameters?: Record<string, ParameterObject>;
    immutableTypes: boolean;
    document: SourceDocument;
    version: number;
  }
): string {
  const readonly = tsReadonly(immutableTypes);

  let output = "";

  // sort into map
  let mappedParams: Record<string, Record<string, ParameterObject>> = {};
  parameters.forEach((paramObj: any) => {
    if (paramObj.$ref && globalParameters) {
      const paramName = paramObj.$ref.split("/").pop(); // take last segment
      if (globalParameters[paramName]) {
        const reference = globalParameters[paramName] as any;
        if (!mappedParams[reference.in]) mappedParams[reference.in] = {};
        if (version === 2) {
          mappedParams[reference.in][reference.name || paramName] = {
            ...reference,
            $ref: paramObj.$ref,
          };
        } else if (version === 3) {
          mappedParams[reference.in][reference.name || paramName] = {
            ...reference,
            // They want to keep this ref here so it references
            // the components, but it does violate the standards.
            schema: { $ref: paramObj.$ref },
          };
        }
      }
      return;
    }

    if (!paramObj.in || !paramObj.name) return;
    if (!mappedParams[paramObj.in]) mappedParams[paramObj.in] = {};
    mappedParams[paramObj.in][paramObj.name] = paramObj;
  });

  // transform output
  Object.entries(mappedParams).forEach(([paramIn, paramGroup]) => {
    output += `  ${readonly}${paramIn}: {\n`; // open in
    Object.entries(paramGroup).forEach(([paramName, paramObj]) => {
      let paramComment = "";
      if (paramObj.deprecated) paramComment += `@deprecated `;
      if (paramObj.description) paramComment += paramObj.description;
      if (paramComment) output += comment(paramComment);

      let hasDefault = false;
      if (paramObj.schema) {
        const actualParam = resolveRefIfNeeded<ParameterObject>(document, paramObj.schema as ReferenceObject);

        // Because the schema refs have been re-written to reference the global parameters
        // need to look a little deeper to get the real schema.
        if (actualParam != null && actualParam.schema != null) {
          const actualParamSchema = resolveRefIfNeeded(document, actualParam?.schema);

          if (actualParamSchema != null && actualParamSchema.default != null) {
            hasDefault = true;
          }
        }
      }

      const required = (paramObj.required || hasDefault) ? `` : `?`;
      let paramType = ``;
      if (version === 2) {
        if (paramObj.in === "body" && paramObj.schema) {
          paramType = transformSchemaObj(paramObj.schema, { immutableTypes, version, document });
        } else if (paramObj.type) {
          paramType = transformSchemaObj(paramObj, { immutableTypes, version, document });
        } else {
          paramType = "unknown";
        }
      } else if (version === 3) {
        paramType = paramObj.schema ? transformSchemaObj(paramObj.schema, { immutableTypes, version, document }) : "unknown";
      }
      output += `    ${readonly}"${paramName}"${required}: ${paramType};\n`;

    });
    output += `  }\n`; // close in
  });

  return output;
}
