import fs from "node:fs/promises";

async function copyTypesForCjs() {
  const sourceFilePath = "./dist/index.d.ts";
  const targetFilePath = "./dist/cjs/index.d.cts";

  await fs.copyFile(sourceFilePath, targetFilePath);
}

copyTypesForCjs();
