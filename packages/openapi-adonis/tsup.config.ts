import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/decorators/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
});
