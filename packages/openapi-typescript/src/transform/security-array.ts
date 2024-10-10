import ts from "typescript";
import type { SecurityRequirementObject, TransformNodeOptions } from "../types.js";
import { QUESTION_TOKEN, tsModifiers, tsPropertyIndex } from "../lib/ts.js";

export default function transformSecurityArray(
  securityArray: SecurityRequirementObject[],
  options: TransformNodeOptions,
): ts.TypeElement[] {
  const type: ts.TypeElement[] = [];

  if (securityArray.length === 0) {
    type.push(
      ts.factory.createPropertySignature(
        tsModifiers({ readonly: options.ctx.immutable }),
        tsPropertyIndex("security"),
        QUESTION_TOKEN,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
      ),
    );

    return type;
  }

  const securityTypes = securityArray.map((securityRequirement) => {
    const properties = Object.entries(securityRequirement).map(([schemeName, scopes]) => {
      const securitySchemeType = ts.factory.createIndexedAccessTypeNode(
        ts.factory.createTypeReferenceNode("components['securitySchemes']", undefined),
        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(schemeName)),
      );

      const scopesType = ts.factory.createTupleTypeNode(
        (scopes as string[]).map((scope) => ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(scope))),
      );

      return ts.factory.createPropertySignature(
        undefined,
        ts.factory.createStringLiteral(schemeName),
        undefined,
        ts.factory.createIntersectionTypeNode([
          securitySchemeType,
          ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(undefined, ts.factory.createIdentifier("scopes"), undefined, scopesType),
          ]),
        ]),
      );
    });

    return ts.factory.createTypeLiteralNode(properties);
  });

  const securityType = securityTypes.length > 1 ? ts.factory.createUnionTypeNode(securityTypes) : securityTypes[0];

  type.push(
    ts.factory.createPropertySignature(
      tsModifiers({ readonly: options.ctx.immutable }),
      tsPropertyIndex("security"),
      undefined,
      securityType,
    ),
  );

  return type;
}
