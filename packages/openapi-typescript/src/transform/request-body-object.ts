import type { GlobalContext, RequestBodyObject } from "../types.js";
import { escStr, getEntries, getSchemaObjectComment, indent, tsReadonly } from "../utils.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";

export interface TransformRequestBodyObjectOptions {
  path: string;
  ctx: GlobalContext;
}

export default function transformRequestBodyObject(requestBodyObject: RequestBodyObject, { path, ctx }: TransformRequestBodyObjectOptions): string {
  let { indentLv } = ctx;
  const output: string[] = ["{"];
  indentLv++;
  output.push(indent(ctx.immutableTypes ? tsReadonly("content: {") : "content: {", indentLv));
  indentLv++;

  if (!Object.keys(requestBodyObject.content).length) {
    output.push(indent(`${escStr("*/*")}: never;`, indentLv));
  }

  for (const [contentType, mediaTypeObject] of getEntries(requestBodyObject.content, ctx.alphabetize, ctx.excludeDeprecated)) {
    const c = getSchemaObjectComment(mediaTypeObject, indentLv);
    if (c) output.push(indent(c, indentLv));
    let key = escStr(contentType);
    if (ctx.immutableTypes) key = tsReadonly(key);
    if ("$ref" in mediaTypeObject) {
      output.push(
        indent(
          `${key}: ${transformSchemaObject(mediaTypeObject, {
            path: `${path}/${contentType}`,
            ctx: { ...ctx, indentLv },
          })};`,
          indentLv,
        ),
      );
    } else {
      const mediaType = transformMediaTypeObject(mediaTypeObject, {
        path: `${path}/${contentType}`,
        ctx: { ...ctx, indentLv },
      });
      output.push(indent(`${key}: ${mediaType};`, indentLv));
    }
  }
  indentLv--;
  output.push(indent("};", indentLv));
  indentLv--;
  output.push(indent("}", indentLv));
  return output.join("\n");
}
