import { execa } from "execa";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

const SCHEMA = "./test/fixtures/api.yaml";
const V6_OUTPUT = "./test/fixtures/api.d.ts";
const V7_OUTPUT = "./test/fixtures/v7-beta.d.ts";

async function generate() {
  const cwd = fileURLToPath(root);

  await Promise.all([
    // note: the version inside node_modules is 6.x
    execa("pnpm", ["exec", "openapi-typescript", SCHEMA, "-o", V6_OUTPUT], { cwd }),
    // note: the version locally is 7.x
    execa("../openapi-typescript/bin/cli.js", [SCHEMA, "-o", V7_OUTPUT], { cwd }),
  ]);
}

generate();
