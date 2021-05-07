import { HeaderObject, SchemaFormatter } from "../types";
import { comment, tsReadonly } from "../utils";
import { transformSchemaObj } from "./schema";

export function transformHeaderObjMap(
  headerMap: Record<string, HeaderObject>,
  options: { formatter?: SchemaFormatter; immutableTypes: boolean; version: number }
): string {
  let output = "";

  Object.entries(headerMap).forEach(([k, v]) => {
    if (!v.schema) return;

    if (v.description) output += comment(v.description);

    const readonly = tsReadonly(options.immutableTypes);
    const required = v.required ? "" : "?";

    output += `  ${readonly}"${k}"${required}: ${transformSchemaObj(v.schema, options)}\n`;
  });

  return output;
}
