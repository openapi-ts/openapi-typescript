import { defineConfig, devices } from "@playwright/test";

const PORT = Number.parseInt(process.env.PORT || 4173 || "", 10);

export default defineConfig({
  testMatch: "test/**/*.e2e.ts",
  webServer: {
    command: "pnpm run e2e-vite-build && pnpm run e2e-vite-start",
    port: PORT,
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
