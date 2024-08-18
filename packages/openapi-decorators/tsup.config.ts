import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/builders/index.ts", "src/loaders/index.ts", "src/resolvers/index.ts", "src/ui/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
});
