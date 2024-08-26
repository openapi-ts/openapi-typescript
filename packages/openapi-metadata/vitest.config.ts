import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [
    // Required to have typescript metadata working. See https://github.com/vitest-dev/vitest/discussions/3320
    swc.vite(),
  ],
  test: {
    globals: true,
  },
});
