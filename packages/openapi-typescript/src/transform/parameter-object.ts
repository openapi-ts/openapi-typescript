import type ts from "typescript";
import { STRING } from "../lib/ts.js";
import type { ParameterObject, TransformNodeOptions } from "../types.js";
import transformSchemaObject from "./schema-object.js";

/**
 * Transform ParameterObject nodes (4.8.12)
 * @see https://spec.openapis.org/oas/v3.1.0#parameter-object
 */
export default function transformParameterObject(
  parameterObject: ParameterObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  return parameterObject.schema ? transformSchemaObject(parameterObject.schema, options) : STRING; // assume a parameter is a string by default rather than "unknown"
}
