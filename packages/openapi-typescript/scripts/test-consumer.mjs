import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execaSync } from "execa";

// Run after building the generator and helpers. Keep network-dependent consumer
// installs separate from the unit suite, and outside the workspace's resolution tree.
const version = process.argv.filter((argument) => argument !== "--")[2] ?? "none";
assert.match(version, /^(?:none|[567]\.\d+\.\d+)$/, "Expected a TypeScript 5/6/7 version or 'none'");
const packageDir = fileURLToPath(new URL("../", import.meta.url));
const helpersDir = fileURLToPath(new URL("../../openapi-typescript-helpers/", import.meta.url));
const consumer = await mkdtemp(join(tmpdir(), "openapi-typescript-consumer-"));
const env = { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" };
function run(command, args, cwd = consumer) {
  // Execa resolves npm.cmd on Windows and escapes its arguments safely.
  return execaSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    stripFinalNewline: false,
  }).stdout;
}
function pack(directory) {
  const [result] = JSON.parse(
    run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", consumer], directory),
  );
  assert(
    result.files.some((file) => file.path === "dist/index.mjs"),
    "Build packages before testing consumers",
  );
  assert(!result.files.some((file) => /^(test|scripts)\//.test(file.path)), "Do not publish test sources");
  return join(consumer, result.filename);
}

try {
  const tarballs = [pack(packageDir), pack(helpersDir)];
  await writeFile(join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
  const compiler = version === "none" ? [] : [`typescript@${version}`, "@types/node@25.6.0"];
  process.stdout.write(`Testing packed packages with TypeScript ${version} on ${process.version}\n`);
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--save-exact", ...tarballs, ...compiler]);
  await cp(join(packageDir, "test/fixtures/consumer"), consumer, { recursive: true });
  process.stdout.write(run(process.execPath, ["runtime.mjs", version]));

  if (version !== "none") {
    // Reuse the entire helper assertion suite against both the packed helper
    // package and the inline generated helpers, including negative assertions.
    const assertions = await readFile(join(helpersDir, "test/readable-writable.test-d.ts"), "utf8");
    for (const [name, module] of [
      ["package-helpers", "openapi-typescript-helpers"],
      ["mutable-helpers", "./mutable.js"],
      ["immutable-helpers", "./immutable.js"],
    ]) {
      await writeFile(join(consumer, `${name}.ts`), assertions.replace('"../src/index.js"', JSON.stringify(module)));
    }
    await writeFile(
      join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          module: "NodeNext",
          moduleResolution: "NodeNext",
          target: "ES2022",
          types: ["node"],
        },
        include: ["*.ts", "*.mts", "*.cts"],
      }),
    );
    const tsc = join(consumer, "node_modules/typescript/bin/tsc");
    assert.equal(run(process.execPath, [tsc, "--version"]).trim(), `Version ${version}`);
    process.stdout.write(run(process.execPath, [tsc, "--project", "tsconfig.json"]));
  }
  process.stdout.write("Consumer checks passed\n");
} catch (error) {
  process.stderr.write(error.stdout?.toString() ?? "");
  process.stderr.write(error.stderr?.toString() ?? "");
  throw error;
} finally {
  await rm(consumer, { recursive: true, force: true });
}
