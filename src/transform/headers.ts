import type { GlobalContext, HeaderObject } from "../types.js";
import { comment, getEntries, tsReadonly } from "../utils.js";
import { transformSchemaObj } from "./schema.js";

interface TransformHeadersOptions extends GlobalContext {
  required: Set<string>;
}

export function transformHeaderObjMap(
  headerMap: Record<string, HeaderObject>,
  options: TransformHeadersOptions
): string {
  let output = "";

  for (const [k, v] of getEntries(headerMap, options)) {
    if (!v.schema) continue;

    if (v.description) output += comment(v.description);

    const readonly = tsReadonly(options.immutableTypes);
    const required = v.required ? "" : "?";

    output += `  ${readonly}"${k}"${required}: ${transformSchemaObj(v.schema, options)}\n`;
  }

  return output;
}
