import { GlobalContext, RequestBody } from "../types";
import { comment, tsReadonly } from "../utils";
import { transformSchemaObj } from "./schema";

export function transformRequestBodies(requestBodies: Record<string, RequestBody>, ctx: GlobalContext) {
  let output = "";

  for (const name of Object.keys(requestBodies)) {
    const requestBody = requestBodies[name];
    if (requestBody && requestBody.description) output += `  ${comment(requestBody.description)}`;
    output += `  "${name}": {\n    ${transformRequestBodyObj(requestBody, ctx)}\n  }\n`;
  }

  return output;
}

export function transformRequestBodyObj(requestBody: RequestBody, ctx: GlobalContext): string {
  const readonly = tsReadonly(ctx.immutableTypes);

  let output = "";

  if (requestBody.content && Object.keys(requestBody.content).length) {
    output += `  ${readonly}content: {\n`; // open content
    for (const k of Object.keys(requestBody.content)) {
      const v = requestBody.content[k];
      output += `      ${readonly}"${k}": ${transformSchemaObj(v.schema, { ...ctx, required: new Set<string>() })};\n`;
    }
    output += `    }\n`; // close content
  } else {
    output += `  unknown;\n`;
  }

  return output;
}
