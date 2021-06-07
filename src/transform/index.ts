import { GlobalContext, OperationObject, PathItemObject } from "../types";
import { comment, tsReadonly } from "../utils";
import { transformHeaderObjMap } from "./headers";
import { transformOperationObj } from "./operation";
import { transformPathsObj } from "./paths";
import { transformRequestBodies } from "./request";
import { transformResponsesObj } from "./responses";
import { transformSchemaObjMap, transformSchemaRefMap } from "./schema";

export function transformAll(schema: any, ctx: GlobalContext): Record<string, string> {
  const readonly = tsReadonly(ctx.immutableTypes);
  const { splitSchema } = ctx;

  let output: Record<string, string> = {};

  let operations: Record<string, { operation: OperationObject; pathItem: PathItemObject }> = {};

  // --raw-schema mode
  if (ctx.rawSchema) {
    const required = new Set(Object.keys(schema));
    switch (ctx.version) {
      case 2: {
        output.definitions = transformSchemaObjMap(schema, { ...ctx, required });
        return output;
      }
      case 3: {
        output.schemas = transformSchemaObjMap(schema, { ...ctx, required });
        return output;
      }
    }
  }

  // #/paths (V2 & V3)
  output.paths = ""; // open paths
  if (schema.paths) {
    output.paths += transformPathsObj(schema.paths, {
      ...ctx,
      globalParameters: (schema.components && schema.components.parameters) || schema.parameters,
      operations,
    });
  }

  switch (ctx.version) {
    case 2: {
      // #/definitions
      if (schema.definitions) {
        output.definitions = transformSchemaObjMap(schema.definitions, {
          ...ctx,
          required: new Set(Object.keys(schema.definitions)),
        });
      }

      // #/parameters
      if (schema.parameters) {
        output.parameters = transformSchemaObjMap(schema.parameters, {
          ...ctx,
          required: new Set(Object.keys(schema.parameters)),
        });
      }

      // #/parameters
      if (schema.responses) {
        output.responses = transformResponsesObj(schema.responses, ctx);
      }
      break;
    }
    case 3: {
      // #/components
      output.components = "";

      if (schema.components) {
        // #/components/schemas
        if (schema.components.schemas) {
          const required = new Set(Object.keys(schema.components.schemas));

          if (splitSchema) {
            output.components += `  ${readonly}"x-requestSchemas": {\n    ${transformSchemaObjMap(
              schema.components.schemas,
              {
                ...ctx,
                required,
                requestResponse: "request",
              }
            )}\n  }\n`;
            output.components += `  ${readonly}"x-responseSchemas": {\n    ${transformSchemaObjMap(
              schema.components.schemas,
              {
                ...ctx,
                required,
                requestResponse: "response",
              }
            )}\n  }\n`;
            output.components += `  ${readonly}"schemas": {\n    ${transformSchemaRefMap(
              schema.components.schemas,
              ctx
            )}\n  }\n`;
          } else {
            output.components += `  ${readonly}schemas: {\n    ${transformSchemaObjMap(schema.components.schemas, {
              ...ctx,
              required,
            })}\n  }\n`;
          }
        }

        // #/components/responses
        if (schema.components.responses) {
          output.components += `  ${readonly}responses: {\n    ${transformResponsesObj(schema.components.responses, {
            ...ctx,
            requestResponse: splitSchema ? "response" : undefined,
          })}\n  }\n`;
        }

        // #/components/parameters
        if (schema.components.parameters) {
          output.components += `  ${readonly}parameters: {\n    ${transformSchemaObjMap(schema.components.parameters, {
            ...ctx,
            required: new Set(Object.keys(schema.components.parameters)),
          })}\n  }\n`;
        }

        // #/components/requestBodies
        if (schema.components.requestBodies) {
          output.components += `  ${readonly}requestBodies: {\n    ${transformRequestBodies(
            schema.components.requestBodies,
            {
              ...ctx,
              requestResponse: splitSchema ? "request" : undefined,
            }
          )}\n  }\n`;
        }

        // #/components/headers
        if (schema.components.headers) {
          output.components += `  ${readonly}headers: {\n    ${transformHeaderObjMap(schema.components.headers, {
            ...ctx,
            required: new Set<string>(),
          })}\n  }\n`;
        }
      }
      break;
    }
  }

  // #/operations
  output.operations = "";
  if (Object.keys(operations).length) {
    for (const id of Object.keys(operations)) {
      const { operation, pathItem } = operations[id];
      if (operation.description) output.operations += comment(operation.description); // handle comment
      output.operations += `  ${readonly}"${id}": {\n    ${transformOperationObj(operation, {
        ...ctx,
        pathItem,
        globalParameters: (schema.components && schema.components.parameters) || schema.parameters,
      })}\n  }\n`;
    }
  }

  // cleanup: trim whitespace
  for (const k of Object.keys(output)) {
    if (typeof output[k] === "string") {
      output[k] = output[k].trim();
    }
  }

  return output;
}
