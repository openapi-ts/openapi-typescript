import { execa } from "execa";
import path from "node:path";
import { multiFile, singleFile } from "./schemas.js";

async function generateSchemas() {
  const rootCWD = new URL("../", import.meta.url);
  const singleFileSchemas = Object.entries(singleFile);
  const multiFileSchemas = Object.entries(multiFile);

  const schemaTotalCount = singleFileSchemas.length + multiFileSchemas.length;
  let schemasDoneCount = 0;

  const updateSchema = async (name: string, ext: string) => {
    const start = performance.now();
    const cwd =
      process.platform === "win32"
        ? // execa/cross-spawn can not handle URL objects on Windows, so convert it to string and cut away the protocol
          rootCWD
            .toString()
            .slice("file:///".length)
        : rootCWD;

    try {
      await Promise.all([
        execa("./bin/cli.js", [`./examples/${name}${ext}`, "-o", `./examples/${name}.ts`], { cwd }),
        ...(name === "github-api"
          ? [
              execa(
                "./bin/cli.js",
                [
                  `./examples/${name}${ext}`,
                  "--immutable",
                  "--export-type",
                  "-o",
                  `./examples/${name}-export-type-immutable.ts`,
                ],
                { cwd },
              ),
              execa(
                "./bin/cli.js",
                [`./examples/${name}${ext}`, "--immutable", "-o", `./examples/${name}-immutable.ts`],
                { cwd },
              ),
            ]
          : []),
      ]);

      schemasDoneCount++;
      const timeMs = Math.round(performance.now() - start);

      // biome-ignore lint/suspicious/noConsoleLog: this is a script
      console.log(`✔︎ [${schemasDoneCount}/${schemaTotalCount}] Updated ${name} (${timeMs}ms)`);
    } catch (error) {
      console.error(`✘ [${schemasDoneCount}/${schemaTotalCount}] Failed to update ${name}`, {
        error: error instanceof Error ? error.message : error,
      });
    }
  };

  // biome-ignore lint/suspicious/noConsoleLog: this is a script
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

  // biome-ignore lint/suspicious/noConsoleLog: this is a script
  console.log("Updating examples done.");
  process.exit(0); // helps process close in npm script
}

generateSchemas();
