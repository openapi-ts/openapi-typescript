import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// Test an installed tarball: workspace links can hide peer/declaration resolution bugs.
// Compile with the application's compiler, not the package's own TS 5 lint command.
const { values } = parseArgs({
  options: {
    bun: { type: "boolean" },
    linker: { type: "string", default: "hoisted" },
  },
});
assert.ok(["hoisted", "isolated"].includes(values.linker));
const cwd = mkdtempSync(join(tmpdir(), "openapi-typescript-ts7-"));
const pnpm = process.env.npm_execpath;
assert.ok(pnpm, "Run with pnpm run test:typescript-7");
const run = (args, stdio = "inherit") =>
  values.bun
    ? execFileSync("bun", args, { cwd, stdio })
    : execFileSync(process.execPath, [pnpm, ...args], { cwd, stdio });
const install = [
  "install",
  "--ignore-scripts",
  ...(values.bun ? ["--linker", values.linker] : ["--strict-peer-dependencies"]),
];

try {
  execFileSync(process.execPath, [pnpm, "pack", "--out", join(cwd, "openapi-typescript.tgz")], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "inherit",
  });
  cpSync(new URL("../test/fixtures/typescript-7/", import.meta.url), cwd, { recursive: true });
  // Cover a fresh TS 7 install, then downgrade/upgrade without deleting the lockfile or node_modules.
  for (const typescript of ["7.0.2", "5.9.3", "7.0.2"]) {
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          "openapi-typescript": "file:./openapi-typescript.tgz",
          typescript,
          "@types/node": "25.6.0",
          // Redocly's public declarations reference these undeclared type dependencies.
          "@types/js-yaml": "4.0.9",
          "json-schema-to-ts": "3.1.1",
        },
      }),
    );
    // pnpm defaults to frozen installs in CI, but this fixture intentionally changes compiler versions.
    run([...install, ...(values.bun ? [] : ["--no-frozen-lockfile"])]);
    run([...install, "--frozen-lockfile"]);
    const version = execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--version"], { cwd });
    assert.equal(version.toString().trim(), `Version ${typescript}`);
    // Also check the application's PATH: installing the generator must not replace tsc.
    const binVersion = run([values.bun ? "run" : "exec", "tsc", "--version"], "pipe");
    assert.equal(binVersion.toString().trim(), `Version ${typescript}`);
    run([
      ...(values.bun ? ["--bun", "run"] : ["exec"]),
      "openapi-typescript",
      "schema.json",
      "--output",
      "schema.d.ts",
    ]);
    assert.match(readFileSync(join(cwd, "schema.d.ts"), "utf8"), /createdAt\?: string/);
    execFileSync(
      process.execPath,
      [
        "node_modules/typescript/bin/tsc",
        "--strict",
        "--skipLibCheck",
        "false",
        "--module",
        "NodeNext",
        "--target",
        "ES2022",
        "esm.mts",
        "cjs.cts",
      ],
      { cwd, stdio: "inherit" },
    );
    execFileSync(process.execPath, ["esm.mjs"], { cwd, stdio: "inherit" });
    execFileSync(process.execPath, ["cjs.cjs"], { cwd, stdio: "inherit" });
    if (values.bun) {
      execFileSync("bun", ["esm.mjs"], { cwd, stdio: "inherit" });
      execFileSync("bun", ["cjs.cjs"], { cwd, stdio: "inherit" });
    }
  }
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
