import type { GlobalContext, OperationObject, ParameterObject } from "../types";
import {
  escObjKey,
  getEntries,
  getSchemaObjectComment,
  indent,
  makeTSIndex,
  parseTSIndex,
  tsIntersectionOf,
  tsNonNullable,
  tsOptionalProperty,
  tsPick,
  tsReadonly,
} from "../utils.js";
import transformParameterObject from "./parameter-object.js";
import transformRequestBodyObject from "./request-body-object.js";
import transformResponseObject from "./response-object.js";
import transformSchemaObject from "./schema-object.js";

export interface TransformOperationObjectOptions {
  path: string;
  ctx: GlobalContext;
  wrapObject?: boolean;
}

export default function transformOperationObject(
  operationObject: OperationObject,
  { path, ctx, wrapObject = true }: TransformOperationObjectOptions
): string {
  let { indentLv } = ctx;
  const output: string[] = wrapObject ? ["{"] : [];
  indentLv++;
  const c = getSchemaObjectComment(operationObject, indentLv);
  if (c) output.push(indent(c, indentLv));

  // parameters
  {
    if (operationObject.parameters) {
      const parameterOutput: string[] = [];
      let allParamsOptional = true;
      indentLv++;
      for (const paramIn of ["query", "header", "path", "cookie"] as ParameterObject["in"][]) {
        let inlineParamsOptional = true;
        const inlineOutput: string[] = [];
        const refs: Record<string, string[]> = {};
        indentLv++;
        for (const p of operationObject.parameters) {
          // handle inline params
          if ("in" in p) {
            if (p.in !== paramIn) continue;
            let key = escObjKey(p.name);
            if (paramIn !== "path" && !p.required) {
              key = tsOptionalProperty(key);
            } else {
              inlineParamsOptional = false;
              allParamsOptional = false;
            }
            const c = getSchemaObjectComment(p, indentLv);
            if (c) parameterOutput.push(indent(c, indentLv));
            const parameterType = transformParameterObject(p, {
              path: `${path}/parameters/${p.name}`,
              ctx: { ...ctx, indentLv },
            });
            inlineOutput.push(indent(`${key}: ${parameterType};`, indentLv));
          }
          // handle $ref’d params
          // note: these can only point to specific parts of the schema, which have already
          // been resolved in the initial step and follow a predictable pattern. so we can
          // do some clever string magic to link them up properly without needing the
          // original object
          else if (p.$ref) {
            const parts = parseTSIndex(p.$ref);
            const paramI = parts.indexOf("parameters");
            if (paramI === -1 || parts[paramI + 1] !== paramIn || !parts[paramI + 2]) continue;
            const key = parts.pop() as string;
            const index = makeTSIndex(parts);
            if (!refs[index]) refs[index] = [key];
            else refs[index].push(key);
          }
        }
        indentLv--;

        // nothing here? skip
        if (!inlineOutput.length && !Object.keys(refs).length) continue;

        const paramType = tsIntersectionOf(
          ...(inlineOutput.length ? [`{\n${inlineOutput.join("\n")}\n${indent("}", indentLv)}`] : []),
          ...Object.entries(refs).map(([root, keys]) =>
            paramIn === "path" ? tsPick(root, keys) : tsPick(tsNonNullable(root), keys)
          )
        );
        let key: string = paramIn;
        if (inlineParamsOptional) key = tsOptionalProperty(key); // if all params are optional, so is this key
        if (ctx.immutableTypes) key = tsReadonly(key);
        parameterOutput.push(indent(`${key}: ${paramType};`, indentLv));
      }
      indentLv--;
      if (parameterOutput.length) {
        output.push(indent(allParamsOptional ? `parameters?: {` : `parameters: {`, indentLv));
        output.push(parameterOutput.join("\n"));
        output.push(indent("};", indentLv));
      }
    }
  }

  // requestBody
  {
    if (operationObject.requestBody) {
      const c = getSchemaObjectComment(operationObject.requestBody, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = "requestBody";
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in operationObject.requestBody) {
        output.push(indent(`${key}: ${transformSchemaObject(operationObject.requestBody, { path, ctx })};`, indentLv));
      } else {
        if (!operationObject.requestBody.required) key = tsOptionalProperty(key);
        const requestBody = transformRequestBodyObject(operationObject.requestBody, {
          path: `${path}/requestBody`,
          ctx: { ...ctx, indentLv },
        });
        output.push(indent(`${key}: ${requestBody};`, indentLv));
      }
    }
  }

  // responses
  {
    if (operationObject.responses) {
      output.push(indent(`responses: {`, indentLv));
      indentLv++;
      for (const [responseCode, responseObject] of getEntries(operationObject.responses, ctx.alphabetize)) {
        const c = getSchemaObjectComment(responseObject, indentLv);
        if (c) output.push(indent(c, indentLv));
        if ("$ref" in responseObject) {
          output.push(
            indent(
              `${responseCode}: ${transformSchemaObject(responseObject, {
                path: `${path}/responses/${responseCode}`,
                ctx,
              })};`,
              indentLv
            )
          );
        } else {
          const responseType = transformResponseObject(responseObject, {
            path: `${path}/responses/${responseCode}`,
            ctx: { ...ctx, indentLv },
          });
          output.push(indent(`${responseCode}: ${responseType};`, indentLv));
        }
      }
      indentLv--;
      output.push(indent(`};`, indentLv));
    }
  }

  indentLv--;
  if (wrapObject) {
    output.push(indent("}", indentLv));
  }
  return output.join("\n");
}
