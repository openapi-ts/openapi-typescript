/**
 * Example: generate types for only the GitHub Pulls API routes.
 *
 * This demonstrates the `pathsFilter` option, which accepts a function
 * `(pathname, method) => boolean` and removes all non-matching paths and
 * their associated (now-unreferenced) component schemas from the output.
 *
 * Run with:
 *   vite-node ./scripts/generate-github-pulls-only.ts
 */

import fs from "node:fs";
import { performance } from "node:perf_hooks";
import openapiTS, { astToString, COMMENT_HEADER } from "../src/index.js";

const GITHUB_API_YAML = new URL("../examples/github-api.yaml", import.meta.url);
const OUTPUT = new URL("../examples/github-api-pulls-only.ts", import.meta.url);
const PULLS_PATH_PREFIX = "/repos/{owner}/{repo}/pulls";

const start = performance.now();

// biome-ignore lint/suspicious/noConsole: this is a script
console.log("Generating github-api-pulls-only.ts …");

const ast = await openapiTS(GITHUB_API_YAML, {
  pathsFilter: (pathname) => pathname === PULLS_PATH_PREFIX || pathname.startsWith(`${PULLS_PATH_PREFIX}/`),
});

fs.writeFileSync(OUTPUT, COMMENT_HEADER + astToString(ast));

// biome-ignore lint/suspicious/noConsole: this is a script
console.log(`✔︎ Written to examples/github-api-pulls-only.ts (${Math.round(performance.now() - start)}ms)`);
