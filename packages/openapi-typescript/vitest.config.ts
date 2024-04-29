import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    globals: true,
    testTimeout: 20_000, // note: tests only need > 1s on GitHub CI Windows
  },
});
