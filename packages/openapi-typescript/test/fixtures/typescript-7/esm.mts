import assert from "node:assert/strict";
import { createRequire } from "node:module";
import openapiTS, { astToString, ts, type OpenAPITSOptions } from "openapi-typescript";
import type { components } from "./schema.js";

const require = createRequire(import.meta.url);
const generatorRequire = createRequire(require.resolve("openapi-typescript"));
assert.strictEqual(ts, generatorRequire("typescript"));
assert.strictEqual(ts, require("openapi-typescript").ts);
assert.match(ts.version, /^5\./);

const person: components["schemas"]["Person"] = { name: "Ada" };
assert.equal(person.name, "Ada");
// @ts-expect-error Generated types must still reject invalid data under TypeScript 7.
const invalid: components["schemas"]["Person"] = { name: 123 };

const options: OpenAPITSOptions = {
  transform(schema): ts.TypeNode | undefined {
    if (schema.format === "date-time") {
      return ts.factory.createTypeReferenceNode("Date");
    }
  },
  postTransform(node): ts.TypeNode {
    if (node.kind === ts.SyntaxKind.StringKeyword) {
      return ts.factory.createUnionTypeNode([node, ts.factory.createLiteralTypeNode(ts.factory.createNull())]);
    }
    return node;
  },
  transformProperty(property): ts.PropertySignature {
    assert.ok(ts.isPropertySignature(property));
    return ts.factory.updatePropertySignature(
      property,
      [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
      property.name,
      property.questionToken,
      property.type,
    );
  },
};
const ast: ts.Node[] = await openapiTS(new URL("./schema.json", import.meta.url), options);
assert.ok(ast.some(ts.isInterfaceDeclaration));
const printer: ts.PrinterOptions = { newLine: ts.NewLineKind.LineFeed };
const output = astToString(ast, { formatOptions: printer });
assert.match(output, /readonly name: string \| null/);
assert.match(output, /readonly createdAt\?: Date/);
