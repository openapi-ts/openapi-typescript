import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
    },
    restoreMocks: true,
  },
});
