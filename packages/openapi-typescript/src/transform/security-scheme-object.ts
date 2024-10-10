import ts from "typescript";
import type { SecuritySchemeObject, TransformNodeOptions } from "../types.js";

export default function transformSecuritySchemeObject(
  node: SecuritySchemeObject,
  options: TransformNodeOptions,
): ts.TypeNode {
  const properties: ts.PropertySignature[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (value !== undefined) {
      properties.push(
        ts.factory.createPropertySignature(undefined, key, undefined, createTypeNodeForValue(value, options)),
      );
    }
  }

  const t = ts.factory.createTypeLiteralNode(properties);
  return t;
}

function createTypeNodeForValue(value: any, options: TransformNodeOptions): ts.TypeNode {
  if (typeof value === "string") {
    return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(value));
  } else if (typeof value === "number") {
    return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(value));
  } else if (typeof value === "boolean") {
    return ts.factory.createLiteralTypeNode(value ? ts.factory.createTrue() : ts.factory.createFalse());
  } else if (Array.isArray(value)) {
    return ts.factory.createArrayTypeNode(
      ts.factory.createUnionTypeNode(value.map((item) => createTypeNodeForValue(item, options))),
    );
  } else if (typeof value === "object" && value !== null) {
    return transformSecuritySchemeObject(value, options);
  }

  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
}
