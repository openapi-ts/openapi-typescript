import { comment } from "../utils";
import { HeaderObject } from "../types";
import { transformSchemaObj } from "./schema";

export function transformHeaderObjMap(headerMap: Record<string, HeaderObject>): string {
  let output = "";

  Object.entries(headerMap).forEach(([k, v]) => {
    if (!v.schema) return;

    if (v.description) output += comment(v.description);
    const required = v.required ? "" : "?";
    output += `  "${k}"${required}: ${transformSchemaObj(v.schema)}\n`;
  });

  return output;
}
