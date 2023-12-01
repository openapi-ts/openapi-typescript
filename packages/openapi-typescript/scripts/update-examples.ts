import { execa } from "execa";
import path from "node:path";
import { multiFile, singleFile } from "./schemas.js";

/* eslint-disable no-console */

async function generateSchemas() {
  const cwd = new URL("../", import.meta.url);
  const singleFileSchemas = Object.entries(singleFile);
  const multiFileSchemas = Object.entries(multiFile);

  const schemaTotalCount = singleFileSchemas.length + multiFileSchemas.length;
  let schemasDoneCount = 0;

  const updateSchema = async (name: string, ext: string) => {
    const start = performance.now();

    await execa(
      "./bin/cli.js",
      [`./examples/${name}${ext}`, "-o", `./examples/${name}.ts`],
      { cwd },
    );

    schemasDoneCount++;
    const timeMs = Math.round(performance.now() - start);

    console.log(
      `✔︎ [${schemasDoneCount}/${schemaTotalCount}] Updated ${name} (${timeMs}ms)`,
    );
  };

  console.log("Updating examples...");

  await Promise.all([
    ...singleFileSchemas.map(async ([name, url]) => {
      const ext = path.extname(url);
      await updateSchema(name, ext);
    }),
    ...multiFileSchemas.map(async ([name, meta]) => {
      const ext = meta.entry.substring(1);
      await updateSchema(name, ext);
    }),
  ]);

  console.log("Updating examples done.");
  process.exit(0); // helps process close in npm script
}

generateSchemas();
