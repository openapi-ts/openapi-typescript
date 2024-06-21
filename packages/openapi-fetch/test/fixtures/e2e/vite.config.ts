import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "./dist/",
  },
  preview: {
    port: Number.parseInt(process.env.PORT || "4173", 10),
  },
});
