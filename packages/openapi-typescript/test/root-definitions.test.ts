import { describe, expect, test } from "vitest";
import openapiTS from "../src/index.js";
import { expectTypeScriptToCompile } from "./test-helpers.js";

const schema = JSON.stringify({
  openapi: "3.1.0",
  info: { title: "Root definitions", version: "1.0.0" },
  $defs: { Foo: { type: "string" } },
  components: { schemas: { Foo: { $ref: "#/$defs/Foo" } } },
});

describe("root definition hook output", () => {
  test.each([
    "{ Foo: string }",
    " \n\t{ Foo: string }\t\n ",
    "{\n    Foo: string;\n}",
    '{ Foo: string; nested?: { value: "}" | "{"; /* } & { */ }; }',
    "/* definitions */ { Foo: string }",
    "{ Foo: string } /* definitions */",
    "// definitions\n{ Foo: string } // definitions",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: This is TypeScript source containing a template literal type.
    '{ Foo: string; comments?: "/*" | "*/" | "//"; template?: `/*${string}*/`; }',
  ])("preserves object members independently of formatting: %s", async (replacement) => {
    const generated = await openapiTS(schema, {
      postTransform: (_type, options) => (options.path === "#/$defs" ? replacement : undefined),
    });

    expectTypeScriptToCompile(
      generated,
      `
const valid: components["schemas"]["Foo"] = "value";
// @ts-expect-error the root definition still describes a string
const invalid: components["schemas"]["Foo"] = 1;
`,
    );
  });

  test.each([
    "{}",
    " { \n\t } ",
    "{ /* no definitions */ }",
    "/* before */ { // no definitions\n } /* after */",
    "{\n    Foo: string;\n} & {\n    Bar: number;\n}",
    "{\n    Foo: string;\n} | {\n    Bar: number;\n}",
    "{\n    Foo: string;\n} extends object ? { Foo: number } : {\n    Bar: number;\n}",
  ])("retains the empty fallback for nonmember roots: %s", async (replacement) => {
    const generated = await openapiTS(schema, {
      postTransform: (_type, options) => (options.path === "#/$defs" ? replacement : undefined),
    });

    expect(generated).toContain("export type $defs = Record<string, never>;");
    expectTypeScriptToCompile(
      generated,
      `
// @ts-expect-error a skipped root definition has no usable values
const invalid: components["schemas"]["Foo"] = "value";
`,
    );
  });

  test.each([false, true])("uses a valid alias for mapped root types with exportType: %s", async (exportType) => {
    const generated = await openapiTS(schema, {
      exportType,
      postTransform: (_type, options) => (options.path === "#/$defs" ? '{ readonly [K in "Foo"]: string }' : undefined),
    });
    expect(generated).toContain("export type $defs =");
    expectTypeScriptToCompile(
      generated,
      `
const valid: components["schemas"]["Foo"] = "value";
// @ts-expect-error mapped definitions retain their value type
const invalid: components["schemas"]["Foo"] = 1;
declare const definitions: $defs;
// @ts-expect-error mapped definitions retain readonly keys
definitions.Foo = "other";
`,
    );
  });
});
