import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import openapiTS, { COMMENT_HEADER, tsComment } from "openapi-typescript";

const require = createRequire(import.meta.url);
const cjs = require("openapi-typescript");
const packageDir = dirname(dirname(require.resolve("openapi-typescript")));
const packageJSON = JSON.parse(await readFile(join(packageDir, "package.json"), "utf8"));
assert.equal(packageJSON.dependencies?.typescript, undefined);
assert.equal(packageJSON.peerDependencies?.typescript, undefined);
if (process.argv[2] === "none") {
  assert.throws(() => require.resolve("typescript", { paths: [packageDir] }), { code: "MODULE_NOT_FOUND" });
} else {
  assert.equal(require("typescript/package.json").version, process.argv[2]);
}

const schema = {
  openapi: "3.1.0",
  info: { title: "Compiler compatibility", version: "1.0.0" },
  components: {
    schemas: {
      Row: {
        type: "object",
        required: ["id", "secret", "date"],
        properties: {
          id: { type: "string", readOnly: true },
          secret: { type: "string", writeOnly: true },
          date: { type: "string", format: "date-time" },
          mutable: { type: "string", readOnly: true },
        },
      },
      Rows: { type: "array", items: { $ref: "#/components/schemas/Row" } },
      Matrix: { type: "array", items: { type: "array", items: { type: "number" } } },
      Mixed: {
        type: "array",
        items: { anyOf: [{ type: "string" }, { type: "array", items: { type: "number" } }] },
      },
      ReadonlyArrayData: { type: "string" },
    },
  },
};

for (const immutable of [false, true]) {
  const options = {
    immutable,
    readWriteMarkers: true,
    rootTypes: true,
    rootTypesNoSchemaPrefix: true,
    transform(schema) {
      if (schema.format === "date-time") return "Date";
    },
    postTransform(type) {
      assert.equal(typeof type, "string");
      return type;
    },
    transformProperty(property) {
      if (property.name === "mutable") {
        return { ...property, readonly: false, comment: tsComment(["@custom mutable"], property.indent) };
      }
    },
  };
  const generated = await openapiTS(schema, options);
  assert.equal(typeof generated, "string");
  assert.equal(generated, await cjs.default(schema, options));
  assert(generated.includes("@custom mutable"));
  await writeFile(immutable ? "immutable.d.ts" : "mutable.d.ts", generated);
}

const rootSchema = {
  openapi: "3.1.0",
  info: schema.info,
  $defs: { Token: { type: "string" } },
  components: { schemas: { Token: { $ref: "#/$defs/Token" } } },
};
const rootOptions = {
  postTransform(type, options) {
    return options.path === "#/$defs"
      ? '/* definitions */ { readonly [K in "Token"]: string } /* end */'
      : type;
  },
};
const definitions = await openapiTS(rootSchema, rootOptions);
assert.equal(definitions, await cjs.default(rootSchema, rootOptions));
await writeFile("definitions.d.ts", definitions);

await writeFile("schema.json", JSON.stringify(schema));
const cli = join(packageDir, "bin/cli.js");
execFileSync(process.execPath, [cli, "schema.json", "--immutable", "--read-write-markers", "-o", "cli.d.ts"]);
assert.equal(
  await readFile("cli.d.ts", "utf8"),
  `${COMMENT_HEADER}${await openapiTS(schema, { immutable: true, readWriteMarkers: true })}`,
);
process.stdout.write("CLI, ESM, CommonJS, and all three hooks passed\n");
