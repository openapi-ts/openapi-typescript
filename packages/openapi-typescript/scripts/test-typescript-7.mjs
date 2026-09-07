import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Test an installed tarball: workspace links can hide peer/declaration resolution bugs.
// The fixture is compiled here with TS 7, not by the package's own TS 5 lint command.
const cwd = mkdtempSync(join(tmpdir(), "openapi-typescript-ts7-"));
const pnpm = process.env.npm_execpath;
assert.ok(pnpm, "Run with pnpm run test:typescript-7");
const run = (args) => execFileSync(process.execPath, [pnpm, ...args], { cwd, stdio: "inherit" });

try {
  execFileSync(process.execPath, [pnpm, "pack", "--out", join(cwd, "openapi-typescript.tgz")], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "inherit",
  });
  cpSync(new URL("../test/fixtures/typescript-7/", import.meta.url), cwd, { recursive: true });
  writeFileSync(
    join(cwd, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        "openapi-typescript": "file:./openapi-typescript.tgz",
        typescript: "7.0.2",
        "@types/node": "25.6.0",
        // Redocly's public declarations reference these undeclared type dependencies.
        "@types/js-yaml": "4.0.9",
        "json-schema-to-ts": "3.1.1",
      },
    }),
  );
  run(["install", "--ignore-scripts", "--strict-peer-dependencies"]);
  const version = execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--version"], { cwd });
  assert.match(version.toString(), /^Version 7\.0\.2/);
  run(["exec", "openapi-typescript", "schema.json", "--output", "schema.d.ts"]);
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
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
