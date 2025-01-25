/**
 * Returns schema path from a class constructor or a schema name.
 */
export function getSchemaPath(model: string | Function): string {
  const modelName = typeof model === "string" ? model : model.name;
  return `#/components/schemas/${modelName}`;
}
