import type { GlobalContext, ResponseObject } from "../types";
import {
  comment,
  escObjKey,
  escStr,
  getEntries,
  getSchemaObjectComment,
  indent,
  tsOptionalProperty,
  tsReadonly,
} from "../utils.js";
import transformHeaderObject from "./header-object.js";
import transformLinkObject from "./link-object.js";
import transformMediaTypeObject from "./media-type-object.js";

export interface TransformResponseObjectOptions {
  path: string;
  ctx: GlobalContext;
}

export default function transformResponseObject(
  responseObject: ResponseObject,
  { path, ctx }: TransformResponseObjectOptions
): string {
  // never
  if (!responseObject.content) {
    return "never";
  }

  const output: string[] = ["{"];
  let { indentLv } = ctx;

  // headers
  if (responseObject.headers) {
    indentLv++;
    output.push(indent(`headers: {`, indentLv));
    indentLv++;
    for (const [name, headerObject] of getEntries(responseObject.headers, ctx.alphabetize)) {
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
            indentLv
          )
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
    for (const [contentType, mediaTypeObject] of getEntries(responseObject.content, ctx.alphabetize)) {
      let key = escStr(contentType);
      if (ctx.immutableTypes) key = tsReadonly(key);
      output.push(
        indent(
          `${key}: ${transformMediaTypeObject(mediaTypeObject, { path: "", ctx: { ...ctx, indentLv: indentLv } })};`,
          indentLv
        )
      );
    }
    indentLv--;
    output.push(indent("};", indentLv));
    indentLv--;
  }

  // links
  if (responseObject.links) {
    indentLv++;
    output.push(indent("links: {", indentLv));
    indentLv++;
    for (const [name, linkObject] of getEntries(responseObject.links, ctx.alphabetize)) {
      const c = getSchemaObjectComment(linkObject, indentLv);
      if (c) output.push(indent(c, indentLv));
      let key = escObjKey(name);
      if (ctx.immutableTypes) key = tsReadonly(key);
      if ("$ref" in linkObject) {
        output.push(indent(`${key}: ${linkObject.$ref};`, indentLv));
      } else {
        if (linkObject.description) output.push(indent(comment(linkObject.description), indentLv));
        output.push(indent(`${key}: ${transformLinkObject(linkObject, { ...ctx, indentLv })};`, indentLv));
      }
    }
    indentLv--;
    output.push(indent("};", indentLv));
    indentLv--;
  }

  output.push(indent("}", indentLv));
  return output.join("\n");
}
