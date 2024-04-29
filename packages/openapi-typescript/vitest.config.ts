import { defineConfig } from "vitest/config";
import os from "node:os";

export default defineConfig({
  test: {
    clearMocks: true,
    globals: true,
  },
});
