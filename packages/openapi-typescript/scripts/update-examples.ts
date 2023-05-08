import { execa } from "execa";
import path from "node:path";
import { URL } from "node:url";
import { download, singleFile, multiFile } from "./download-schemas.js";

async function generateSchemas() {
  await download();
  const cwd = new URL("../", import.meta.url);
  await Promise.all([
    ...Object.keys(singleFile).map(async (name) => {
      const ext = path.extname(singleFile[name as keyof typeof singleFile]);
      await execa("node", ["./bin/cli.js", `./examples/${name}${ext}`, "-o", `./examples/${name}.ts`], { cwd });
    }),
    ...Object.entries(multiFile).map(async ([name, meta]) => {
      await execa(
        "node",
        ["./bin/cli.js", `./examples/${name}${meta.entry.substring(1)}`, "-o", `./examples/${name}.ts`],
        { cwd }
      );
    }),
  ]);
}

generateSchemas();
