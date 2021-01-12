import { comment, transformRef } from "../utils";
import { transformSchemaObj, transformSchemaObjMap } from "./schema";

export function transformResponsesObj(responsesObj: Record<string, any>): string {
  let output = "";
  Object.entries(responsesObj).forEach(([k, v]) => {
    if (v.description) output += comment(v.description);

    const resKey = parseInt(k, 10) ? k : `"${k}"`; // don’t surround w/ quotes if numeric status code

    if (v.$ref) {
      output += `  ${resKey}: ${transformRef(v.$ref)};\n`; // reference
      return;
    }

    if ((!v.content && !v.schema) || (v.content && !Object.keys(v.content).length)) {
      output += `  ${resKey}: unknown;\n`; // unknown / missing response
      return;
    }

    output += `  ${resKey}: {\n`; // open response

    // headers
    if (v.headers) {
      if (v.headers.$ref) {
        output += `    headers: ${transformRef(v.headers.$ref)};\n`;
      } else {
        output += `    headers: {\n      ${transformSchemaObjMap(v.headers)}\n    }\n`;
      }
    }

    // response
    if (v.content) {
      // V3
      Object.entries(v.content).forEach(([contentType, contentResponse]) => {
        output += `  "${contentType}": ${transformSchemaObj((contentResponse as any).schema)};\n`;
      });
    } else if (v.schema) {
      // V2 (note: because of the presence of "headers", we have to namespace this somehow; "schema" seemed natural)
      output += `  schema: ${transformSchemaObj(v.schema)};\n`;
    }

    output += `  }\n`; // close response
  });
  return output;
}
