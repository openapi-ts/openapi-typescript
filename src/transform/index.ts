import type { GlobalContext, OpenAPI3 } from "types";
import { escStr, getEntries, indent } from "../utils.js";
import transformComponentsObject from "./components-object.js";
import transformPathsObject from "./paths-object.js";

export default function transform(schema: OpenAPI3, ctx: GlobalContext): Record<string, string> {
  const output: Record<string, string> = {};
  let { indentLv } = ctx;
  const operations: Record<string, string> = {};

  // paths
  if (schema.paths) output.paths = transformPathsObject(schema.paths, { operations, ctx });
  else output.paths = "";

  // components
  if (schema.components) output.components = transformComponentsObject(schema.components, { operations, ctx });
  else output.components = "";

  // operations
  const operationsOutput: string[] = ["{"];
  indentLv++;
  for (const [id, operationObject] of getEntries(operations, ctx.alphabetize)) {
    operationsOutput.push(indent(`${escStr(id)}: ${operationObject};`, indentLv));
  }
  indentLv--;
  operationsOutput.push(indent("}", indentLv));
  output.operations = operationsOutput.join("\n");

  return output;
}
