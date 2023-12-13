/**
 * Build
 * Only copies files & makes folders, but works on Windows too
 */
import fs from "node:fs";

const cwd = new URL("../", import.meta.url);

fs.mkdirSync(new URL("./dist/cjs/", cwd), { recursive: true });

const files = [
  {
    in: new URL("./index.js", cwd),
    out: new URL("./dist/index.js", cwd),
  },
  {
    in: new URL("./index.d.ts", cwd),
    out: new URL("./dist/index.d.ts", cwd),
  },
  {
    in: new URL("./index.js", cwd),
    out: new URL("./dist/cjs/index.cjs", cwd),
  },
  {
    in: new URL("./index.d.ts", cwd),
    out: new URL("./dist/cjs/index.d.cts", cwd),
  },
];

for (const f of files) {
  fs.copyFileSync(f.in, f.out);
}
