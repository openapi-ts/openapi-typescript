import vue from "@vitejs/plugin-vue";
import { defineConfig, type Plugin } from "vitest/config";

export default defineConfig({
  plugins: [vue() as unknown as Plugin],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
