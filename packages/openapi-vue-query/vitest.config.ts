import { defineConfig, type Plugin } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  plugins: [vue() as unknown as Plugin, vueJsx() as unknown as Plugin],
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
