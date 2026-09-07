import assert = require("node:assert/strict");
import fs = require("node:fs");
import openapiTS = require("openapi-typescript");

async function main() {
  const { ts, astToString } = openapiTS;
  const ast: openapiTS.ts.Node[] = await openapiTS.default(fs.readFileSync("schema.json", "utf8"), {
    transform(schema) {
      if (schema.format === "date-time") {
        return ts.factory.createTypeReferenceNode("Date");
      }
    },
  });
  assert.ok(ast.some(ts.isInterfaceDeclaration));
  assert.match(astToString(ast), /createdAt\?: Date/);
}

main().catch((error) => {
  throw error;
});
