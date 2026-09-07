import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index.ts"],
  declaration: "compatible",
  clean: true,
  sourcemap: true,
  hooks: {
    "rollup:dts:options"(_ctx, options) {
      // Our CJS bundle exposes .default and named exports, not module.exports = default.
      options.plugins = options.plugins.filter((plugin) => plugin.name !== "fix-dts-default-cjs-exports-plugin");
    },
  },
  rollup: {
    // Ship CommonJS-compatible bundle
    emitCJS: true,
    // Don’t bundle .js files together to more closely match old exports (can remove in next major)
    output: { preserveModules: true },
  },
});
