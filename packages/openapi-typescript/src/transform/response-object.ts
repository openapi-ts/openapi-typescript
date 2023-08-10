import type { GlobalContext, ResponseObject } from "../types.js";
import { escObjKey, escStr, getEntries, getSchemaObjectComment, indent, tsOptionalProperty, tsReadonly } from "../utils.js";
import transformHeaderObject from "./header-object.js";
import transformMediaTypeObject from "./media-type-object.js";

export interface TransformResponseObjectOptions {
  path: string;
  ctx: GlobalContext;
}

export default function transformResponseObject(responseObject: ResponseObject, { path, ctx }: TransformResponseObjectOptions): string {
  const output: string[] = ["{"];
  let { indentLv } = ctx;

  // headers
  if (responseObject.headers) {
    indentLv++;
    output.push(indent(`headers: {`, indentLv));
    indentLv++;
    for (const [name, headerObject] of getEntries(responseObject.headers, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(headerObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in headerObject) {
        output.push(indent(`${key}: ${headerObject.$ref};`, indentLv));
      } else {
        if (!headerObject.required) key = tsOptionalProperty(key);
        output.push(
          indent(
            `${key}: ${transformHeaderObject(headerObject, {
              path: `${path}/headers/${name}`,
              ctx: { ...ctx, indentLv },
            })};`,
            indentLv,
          ),
        );
      }
    }
    indentLv--;
    output.push(indent(`};`, indentLv));
    indentLv--;
  }

  // content
  if (responseObject.content) {
    indentLv++;
    output.push(indent("content: {", indentLv));
    indentLv++;
    for (const [contentType, mediaTypeObject] of getEntries(responseObject.content, ctx.alphabetize, ctx.excludeDeprecated)) {
      let key = escStr(contentType);
      if (ctx.immutableTypes) key = tsReadonly(key);
      output.push(
        indent(
          `${key}: ${transformMediaTypeObject(mediaTypeObject, {
            path: `${path}/content/${contentType}`,
            ctx: { ...ctx, indentLv: indentLv },
          })};`,
          indentLv,
        ),
      );
    }
    indentLv--;
    output.push(indent("};", indentLv));
    indentLv--;
  } else {
    indentLv++;
    output.push(indent("content: never;", indentLv));
    indentLv--;
  }

  output.push(indent("}", indentLv));
  return output.join("\n");
}
