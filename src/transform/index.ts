import type { GlobalContext, OpenAPI3 } from "../types";
import transformComponentsObject from "./components-object.js";
import transformPathsObject from "./paths-object.js";

/** transform top-level schema */
export function transformSchema(schema: OpenAPI3, ctx: GlobalContext): Record<string, string> {
  if (!schema) return {};

  const output: Record<string, string> = {};

  // paths
  if (schema.paths) output.paths = transformPathsObject(schema.paths, ctx);
  else output.paths = "";

  // components
  if (schema.components) output.components = transformComponentsObject(schema.components, ctx);
  else output.components = "";

  return output;
}
