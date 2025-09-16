import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    // Required to have typescript metadata working. See https://github.com/vitest-dev/vitest/discussions/3320
    swc.vite(),
  ],
  test: {
    globals: true,
  },
});
