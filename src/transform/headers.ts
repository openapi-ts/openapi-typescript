import { HeaderObject, SchemaFormatter, SchemaObject, SourceDocument } from "../types";
import { comment, resolveRefIfNeeded, tsReadonly } from "../utils";
import { transformSchemaObj } from "./schema";

export function transformHeaderObjMap(
  headerMap: Record<string, HeaderObject>,
  options: { formatter?: SchemaFormatter; immutableTypes: boolean; version: number, document: SourceDocument }
): string {
  let output = "";

  Object.entries(headerMap).forEach(([k, v]) => {
    if (!v.schema) return;

    if (v.description) output += comment(v.description);

    const readonly = tsReadonly(options.immutableTypes);
    const schema = resolveRefIfNeeded<SchemaObject>(options.document, v.schema);

    const required = v.required || (schema != null && schema.default != null) ? "" : "?";

    output += `  ${readonly}"${k}"${required}: ${transformSchemaObj(v.schema, options)}\n`;
  });

  return output;
}
