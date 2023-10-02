import { execa } from "execa";
import path from "node:path";
import { multiFile, singleFile } from "./schemas.js";

/* eslint-disable no-console */

async function generateSchemas() {
  const cwd = new URL("../", import.meta.url);
  const allSchemas = Object.keys({ ...singleFile, ...multiFile });

  let done = 0;
  console.log("Updating examples..."); // eslint-disable-line no-console
  await Promise.all([
    ...Object.keys(singleFile).map(async (name) => {
      const start = performance.now();
      const ext = path.extname(singleFile[name as keyof typeof singleFile]);
      await execa(
        "./bin/cli.js",
        [`./examples/${name}${ext}`, "-o", `./examples/${name}.ts`],
        { cwd },
      );
      done++;
      console.log(
        `✔︎ [${done}/${allSchemas.length}] Updated ${name} (${Math.round(
          performance.now() - start,
        )}ms)`,
      ); // eslint-disable-line no-console
    }),
    ...Object.entries(multiFile).map(async ([name, meta]) => {
      const start = performance.now();
      await execa(
        "./bin/cli.js",
        [
          `./examples/${name}${meta.entry.substring(1)}`,
          "-o",
          `./examples/${name}.ts`,
        ],
        { cwd },
      );
      done++;
      console.log(
        `✔︎ [${done}/${allSchemas.length}] Updated ${name} (${Math.round(
          performance.now() - start,
        )}ms)`,
      ); // eslint-disable-line no-console
    }),
  ]);
  console.log("Updating examples done."); // eslint-disable-line no-console
  process.exit(0); // helps process close in npm script
}

generateSchemas();
