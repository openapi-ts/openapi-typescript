import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import degit from "degit";
import { fetch } from "undici";
import { error } from "../src/utils.js";

export const singleFile = {
  "github-api":
    "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.yaml",
  "github-api-next":
    "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions-next/api.github.com/api.github.com.yaml",
  "octokit-ghes-3.6-diff-to-api":
    "https://raw.githubusercontent.com/octokit/octokit-next.js/main/cache/types-openapi/ghes-3.6-diff-to-api.github.com.json",
  "stripe-api": "https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.yaml",
};
export const multiFile = {
  "digital-ocean-api": {
    repo: "https://github.com/digitalocean/openapi/specification",
    entry: "./DigitalOcean-public.v2.yaml",
  },
};

const ONE_DAY = 1000 * 60 * 60 * 24;
const EXAMPLES_DIR = new URL("../examples/", import.meta.url);

export async function download() {
  await Promise.all([
    ...Object.entries(singleFile).map(async ([k, url]) => {
      const ext = path.extname(url);
      const dest = new URL(`${k}${ext}`, EXAMPLES_DIR);
      if (fs.existsSync(dest)) {
        const { mtime } = fs.statSync(dest);
        if (Date.now() - mtime.getTime() < ONE_DAY) return; // only update every 24 hours at most
      }
      const result = await fetch(url);
      if (!result.ok) {
        error(`Error fetching ${url}`);
        process.exit(1);
      }
      fs.mkdirSync(new URL(".", dest), { recursive: true });
      fs.writeFileSync(dest, await result.text());
    }),
    ...Object.entries(multiFile).map(async ([k, meta]) => {
      const dest = new URL(k, EXAMPLES_DIR);
      if (fs.existsSync(dest)) {
        const { mtime } = fs.statSync(dest);
        if (Date.now() - mtime.getTime() < ONE_DAY) return; // only update every 24 hours at most
      }
      const emitter = degit(meta.repo, {
        force: true,
      });
      await emitter.clone(fileURLToPath(new URL(k, EXAMPLES_DIR)));
    }),
  ]);
}

download();
