export function schemaPath(model: string | Function): string {
  const modelName = typeof model === "string" ? model : model.name;
  return `#/components/schemas/${modelName}`;
}
