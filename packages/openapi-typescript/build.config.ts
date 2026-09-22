import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index.ts"],
  declaration: "compatible",
  clean: true,
  sourcemap: true,
  rollup: {
    // Ship CommonJS-compatible bundle
    emitCJS: true,
    // Don’t bundle .js files together to more closely match old exports (can remove in next major)
    output: { preserveModules: true },
  },
  hooks: {
    "rollup:dts:options"(_ctx, options) {
      // Our CommonJS bundle exports an object with named exports and `.default`.
      // unbuild's interop plugin incorrectly changes this declaration to `export =`.
      options.plugins = options.plugins.filter((plugin) => plugin.name !== "fix-dts-default-cjs-exports-plugin");
    },
  },
});
