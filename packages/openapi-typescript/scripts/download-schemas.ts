import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import degit from "degit";
import { fetch } from "undici";
import { error } from "../src/utils.js";
import { multiFile, singleFile } from "./schemas.js";

const ONE_DAY = 1000 * 60 * 60 * 24;
const EXAMPLES_DIR = new URL("../examples/", import.meta.url);

export async function download() {
  const allSchemas = Object.keys({ ...singleFile, ...multiFile });
  let done = 0;
  console.log("Downloading schemas..."); // eslint-disable-line no-console
  await Promise.all([
    ...Object.entries(singleFile).map(async ([k, url]) => {
      const start = performance.now();
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
      done++;
      console.log(`✔︎ [${done}/${allSchemas.length}] Downloaded ${k} (${Math.round(performance.now() - start)}ms)`); // eslint-disable-line no-console
    }),
    ...Object.entries(multiFile).map(async ([k, meta]) => {
      const start = performance.now();
      const dest = new URL(k, EXAMPLES_DIR);
      if (fs.existsSync(dest)) {
        const { mtime } = fs.statSync(dest);
        if (Date.now() - mtime.getTime() < ONE_DAY) return; // only update every 24 hours at most
      }
      const emitter = degit(meta.repo, {
        force: true,
      });
      await emitter.clone(fileURLToPath(new URL(k, EXAMPLES_DIR)));
      done++;
      console.log(`✔︎ [${done}/${allSchemas.length}] Downloaded ${k} (${Math.round(performance.now() - start)}ms)`); // eslint-disable-line no-console
    }),
  ]);
  console.log("Downloading schemas done."); // eslint-disable-line no-console
}

download();
