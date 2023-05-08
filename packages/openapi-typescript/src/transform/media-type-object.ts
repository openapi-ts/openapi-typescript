import type { GlobalContext, MediaTypeObject } from "../types.js";
import transformSchemaObject from "./schema-object.js";

export interface TransformMediaTypeObjectOptions {
  path: string;
  ctx: GlobalContext;
}

export default function transformMediaTypeObject(mediaTypeObject: MediaTypeObject, { path, ctx }: TransformMediaTypeObjectOptions): string {
  if (!mediaTypeObject.schema) return "unknown";
  return transformSchemaObject(mediaTypeObject.schema, { path, ctx });
}
