import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
    },
  },
});
