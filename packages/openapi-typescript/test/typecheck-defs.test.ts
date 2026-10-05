import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterAll, describe, expect, test } from "vitest";
import openapiTS, { astToString } from "../src/index.js";

/**
 * Snapshot tests compare generated text only. This test compiles the generated
 * output for a schema whose $refs go through `$defs`, so a type that prints fine
 * but fails under `strict` (e.g. indexing into an optional `$defs`) is caught.
 */
describe("generated output type-checks under strict", () => {
  const dir = mkdtempSync(join(tmpdir(), "openapi-ts-typecheck-"));

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("$refs through an optional $defs compile with strictNullChecks", async () => {
    const ast = await openapiTS(new URL("./fixtures/jsonschema-defs.yaml", import.meta.url));
    const source = astToString(ast);
    expect(source).toContain('NonNullable<components["schemas"]["OtherObject"]["$defs"]>["nestedDef"]');

    const file = join(dir, "defs.ts");
    writeFileSync(file, source, "utf8");
    const program = ts.createProgram([file], {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    });
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file?.fileName === file.replace(/\\/g, "/"))
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    expect(diagnostics).toEqual([]);
  });
});
