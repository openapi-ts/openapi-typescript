import { execSync } from "node:child_process";
import fs from "node:fs";
import { URL } from "node:url";
import downloadSchemas, { FIXTURES_DIR } from "./download-schemas.js";

const EXT_RE = /\.[^.]+$/;

async function generateSchemas() {
  await downloadSchemas();
  const schemas = fs.readdirSync(FIXTURES_DIR);
  await Promise.all(
    schemas.map(async (filename) => {
      if (!filename.endsWith(".json") && !filename.endsWith(".yaml")) return;
      await execSync(`node ./bin/cli.js ./test/fixtures/${filename} -o ./examples/${filename.replace(EXT_RE, "")}.ts`, {
        cwd: new URL("../", import.meta.url),
      });
    })
  );
}

generateSchemas();
