import type { GlobalContext } from "../types.js";
import { comment, tsReadonly } from "../utils.js";
import { transformHeaderObjMap } from "./headers.js";
import { transformSchemaObj } from "./schema.js";

export function transformResponsesObj(responsesObj: Record<string, any>, ctx: GlobalContext): string {
  const readonly = tsReadonly(ctx.immutableTypes);
  const resType = (res: string | number) => {
    if (tsReadonly(ctx.contentNever)) {
      return "never";
    } else {
      return res === 204 || (res >= 300 && res < 400) ? "never" : "unknown";
    }
  };

  let output = "";

  for (const httpStatusCode of Object.keys(responsesObj)) {
    const statusCode = Number(httpStatusCode) || `"${httpStatusCode}"`; // don’t surround w/ quotes if numeric status code
    const response = responsesObj[httpStatusCode];
    if (response.description) output += comment(response.description);

    if (response.$ref) {
      output += `  ${readonly}${statusCode}: ${response.$ref};\n`; // reference
      continue;
    }

    if ((!response.content && !response.schema) || (response.content && !Object.keys(response.content).length)) {
      output += `  ${readonly}${statusCode}: ${resType(statusCode)};\n`; // unknown / missing response
      continue;
    }

    output += `  ${readonly}${statusCode}: {\n`; // open response

    // headers
    if (response.headers && Object.keys(response.headers).length) {
      if (response.headers.$ref) {
        output += `    ${readonly}headers: ${response.headers.$ref};\n`;
      } else {
        output += `    ${readonly}headers: {\n      ${transformHeaderObjMap(response.headers, {
          ...ctx,
          required: new Set<string>(),
        })}\n    }\n`;
      }
    }

    // response
    switch (ctx.version) {
      case 3: {
        output += `    ${readonly}content: {\n`; // open content
        for (const contentType of Object.keys(response.content)) {
          const contentResponse = response.content[contentType] as any;
          const responseType =
            contentResponse && contentResponse?.schema
              ? transformSchemaObj(contentResponse.schema, { ...ctx, required: new Set<string>() })
              : "unknown";
          output += `      ${readonly}"${contentType}": ${responseType};\n`;
        }
        output += ` }\n`; // close content
        break;
      }
      case 2: {
        // note: because of the presence of "headers", we have to namespace this somehow; "schema" seemed natural
        output += `  ${readonly} schema: ${transformSchemaObj(response.schema, {
          ...ctx,
          required: new Set<string>(),
        })};\n`;
        break;
      }
    }

    output += `  }\n`; // close response
  }

  return output;
}
