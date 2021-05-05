import { RequestBody, SchemaFormatter } from "../types";
import { comment, transformRef, tsReadonly } from "../utils";
import { transformHeaderObjMap } from "./headers";
import { transformSchemaObj } from "./schema";
import { transformRequestBodyObj } from "./operation";

const resType = (res: string | number) => (res === 204 || (res >= 300 && res < 400) ? "never" : "unknown");

interface Options {
  formatter?: SchemaFormatter;
  immutableTypes: boolean;
  version: number;
}

export function transformResponsesObj(responsesObj: Record<string, any>, options: Options): string {
  const { immutableTypes } = options;
  const readonly = tsReadonly(immutableTypes);

  let output = "";

  Object.entries(responsesObj).forEach(([httpStatusCode, response]) => {
    if (response.description) output += comment(response.description);

    const statusCode = Number(httpStatusCode) || `"${httpStatusCode}"`; // don’t surround w/ quotes if numeric status code

    if (response.$ref) {
      output += `  ${readonly}${statusCode}: ${transformRef(response.$ref)};\n`; // reference
      return;
    }

    if ((!response.content && !response.schema) || (response.content && !Object.keys(response.content).length)) {
      output += `  ${readonly}${statusCode}: ${resType(statusCode)};\n`; // unknown / missing response
      return;
    }

    output += `  ${readonly}${statusCode}: {\n`; // open response

    // headers
    if (response.headers && Object.keys(response.headers).length) {
      if (response.headers.$ref) {
        output += `    ${readonly}headers: ${transformRef(response.headers.$ref)};\n`;
      } else {
        output += `    ${readonly}headers: {\n      ${transformHeaderObjMap(response.headers, options)}\n    }\n`;
      }
    }

    // response
    if (response.content && Object.keys(response.content).length) {
      // V3
      output += `    ${readonly}content: {\n`; // open content
      Object.entries(response.content).forEach(([contentType, contentResponse]) => {
        const responseType =
          contentResponse && (contentResponse as any).schema
            ? transformSchemaObj((contentResponse as any).schema, options)
            : "unknown";
        output += `      ${readonly}"${contentType}": ${responseType};\n`;
      });
      output += `    }\n`; //close content
    } else if (response.schema) {
      // V2 (note: because of the presence of "headers", we have to namespace this somehow; "schema" seemed natural)
      output += `  ${readonly} schema: ${transformSchemaObj(response.schema, options)};\n`;
    }

    output += `  }\n`; // close response
  });
  return output;
}

export function transformRequestBodies(requestBodies: Record<string, RequestBody>, options: Options) {
  let output = "";

  Object.entries(requestBodies).forEach(([bodyName, requestBody]) => {
    if (requestBody && requestBody.description) output += `  ${comment(requestBody.description)}`;
    output += `  "${bodyName}": {`;
    output += `  ${transformRequestBodyObj(requestBody, options)}`;
    output += `  }\n`;
  });

  return output;
}
