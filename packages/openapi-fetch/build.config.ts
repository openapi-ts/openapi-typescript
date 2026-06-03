import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index.js"],
  declaration: "compatible",
  clean: true,
  sourcemap: true,
  rollup: {
    // Ship CommonJS-compatible bundle
    emitCJS: true,
  },
});
