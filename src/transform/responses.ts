import { comment, transformRef } from "../utils";
import { transformHeaderObjMap } from "./headers";
import { transformSchemaObj } from "./schema";
import { transformRequestBodyObj } from "./operation";

const resType = (res: string | number) => (res === 204 || (res >= 300 && res < 400) ? "never" : "unknown");

export function transformResponsesObj(responsesObj: Record<string, any>): string {
  let output = "";
  Object.entries(responsesObj).forEach(([httpStatusCode, response]) => {
    if (response.description) output += comment(response.description);

    const statusCode = Number(httpStatusCode) || `"${httpStatusCode}"`; // don’t surround w/ quotes if numeric status code

    if (response.$ref) {
      output += `  ${statusCode}: ${transformRef(response.$ref)};\n`; // reference
      return;
    }

    if ((!response.content && !response.schema) || (response.content && !Object.keys(response.content).length)) {
      output += `  ${statusCode}: ${resType(statusCode)};\n`; // unknown / missing response
      return;
    }

    output += `  ${statusCode}: {\n`; // open response

    // headers
    if (response.headers && Object.keys(response.headers).length) {
      if (response.headers.$ref) {
        output += `    headers: ${transformRef(response.headers.$ref)};\n`;
      } else {
        output += `    headers: {\n      ${transformHeaderObjMap(response.headers)}\n    }\n`;
      }
    }

    // response
    if (response.content && Object.keys(response.content).length) {
      // V3
      output += `    content: {\n`; // open content
      Object.entries(response.content).forEach(([contentType, contentResponse]) => {
        output += `      "${contentType}": ${transformSchemaObj((contentResponse as any).schema)};\n`;
      });
      output += `    }\n`; //close content
    } else if (response.schema) {
      // V2 (note: because of the presence of "headers", we have to namespace this somehow; "schema" seemed natural)
      output += `  schema: ${transformSchemaObj(response.schema)};\n`;
    }

    output += `  }\n`; // close response
  });
  return output;
}

export function transformRequestBodies(requestBodies: Record<string, RequestBody>) {
  let output = "";

  Object.entries(requestBodies).forEach(([bodyName, requestBody]) => {
    if (requestBody && requestBody.description) output += `  ${comment(requestBody.description)}`;
    output += `  ${bodyName}: {`;
    output += `  ${transformRequestBodyObj(requestBody)}`;
    output += `  }\n`;
  });

  return output;
}
