import { HeaderObject } from "../types";
import { comment, tsReadonly } from "../utils";
import { transformSchemaObj } from "./schema";

export function transformHeaderObjMap(
  headerMap: Record<string, HeaderObject>,
  { immutableTypes }: { immutableTypes: boolean }
): string {
  let output = "";

  Object.entries(headerMap).forEach(([k, v]) => {
    if (!v.schema) return;

    if (v.description) output += comment(v.description);

    const readonly = tsReadonly(immutableTypes);
    const required = v.required ? "" : "?";

    output += `  ${readonly}"${k}"${required}: ${transformSchemaObj(v.schema, {
      immutableTypes,
    })}\n`;
  });

  return output;
}
