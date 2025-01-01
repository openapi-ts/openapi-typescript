import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/decorators/index.ts", "src/errors/index.ts", "src/metadata/index.ts", "src/ui/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
});
