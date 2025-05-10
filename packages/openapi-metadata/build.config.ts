import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "./src/index.ts",
    "./src/decorators/index.ts",
    "./src/metadata/index.ts",
    "./src/errors/index.ts",
    "./src/ui/index.ts",
  ],
  declaration: "compatible",
  clean: true,
  sourcemap: true,
  rollup: {
    // Ship CommonJS-compatible bundle
    emitCJS: true,
    // Don’t bundle .js files together to more closely match old exports (can remove in next major)
    output: { preserveModules: true },
  },
});
