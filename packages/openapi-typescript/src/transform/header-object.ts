import type { GlobalContext, HeaderObject } from "../types.js";
import { escStr, getEntries, getSchemaObjectComment, indent, tsReadonly } from "../utils.js";
import transformMediaTypeObject from "./media-type-object.js";
import transformSchemaObject from "./schema-object.js";

export interface TransformHeaderObjectOptions {
  path: string;
  ctx: GlobalContext;
}

export default function transformHeaderObject(headerObject: HeaderObject, { path, ctx }: TransformHeaderObjectOptions): string {
  if (headerObject.schema) return transformSchemaObject(headerObject.schema, { path, ctx });
  if (headerObject.content) {
    let { indentLv } = ctx;
    const output: string[] = ["{"];
    indentLv++;
    for (const [contentType, mediaTypeObject] of getEntries(headerObject.content, ctx.alphabetize, ctx.excludeDeprecated)) {
      const c = getSchemaObjectComment(mediaTypeObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escStr(contentType);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in mediaTypeObject) {
        output.push(indent(`${key}: ${transformSchemaObject(mediaTypeObject, { path: `${path}/${contentType}`, ctx })};`, indentLv));
      } else {
        const mediaType = transformMediaTypeObject(mediaTypeObject, { path: `${path}/${contentType}`, ctx });
        output.push(indent(`${key}: ${mediaType};`, indentLv));
      }
    }
    indentLv--;
    output.push(indent("}", indentLv));
    return output.join("\n");
  }
  return "unknown";
}
