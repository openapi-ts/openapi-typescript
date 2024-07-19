import degit from "degit";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { error } from "../src/lib/utils.js";
import { multiFile, singleFile } from "./schemas.js";

const ONE_DAY = 1000 * 60 * 60 * 24;
const EXAMPLES_DIR = new URL("../examples/", import.meta.url);

export async function download() {
  const allSchemas = Object.keys({ ...singleFile, ...multiFile });
  let done = 0;
  // biome-ignore lint/suspicious/noConsoleLog: this is a script
  console.log("Downloading schemas...");
  await Promise.all([
    ...Object.entries(singleFile).map(async ([k, url]) => {
      const start = performance.now();
      const ext = path.extname(url);
      const dest = new URL(`${k}${ext}`, EXAMPLES_DIR);
      if (fs.existsSync(dest)) {
        const { mtime } = fs.statSync(dest);
        if (Date.now() - mtime.getTime() < ONE_DAY) {
          return; // only update every 24 hours at most
        }
      }
      const result = await fetch(url);
      if (!result.ok) {
        error(`Error fetching ${url}`);
        process.exit(1);
      }
      fs.mkdirSync(new URL(".", dest), { recursive: true });
      fs.writeFileSync(dest, await result.text());
      done++;
      // biome-ignore lint/suspicious/noConsoleLog: this is a script
      console.log(`✔︎ [${done}/${allSchemas.length}] Downloaded ${k} (${Math.round(performance.now() - start)}ms)`);
    }),
    ...Object.entries(multiFile).map(async ([k, meta]) => {
      const start = performance.now();
      const dest = new URL(k, EXAMPLES_DIR);
      if (fs.existsSync(dest)) {
        const { mtime } = fs.statSync(dest);
        if (Date.now() - mtime.getTime() < ONE_DAY) {
          return; // only update every 24 hours at most
        }
      }
      const emitter = degit(meta.repo, {
        force: true,
      });
      await emitter.clone(fileURLToPath(new URL(k, EXAMPLES_DIR)));
      done++;
      // biome-ignore lint/suspicious/noConsoleLog: this is a script
      console.log(`✔︎ [${done}/${allSchemas.length}] Downloaded ${k} (${Math.round(performance.now() - start)}ms)`);
    }),
  ]);
  // biome-ignore lint/suspicious/noConsoleLog: this is a script
  console.log("Downloading schemas done.");
  process.exit(0); // helps process close in npm script
}

download();
