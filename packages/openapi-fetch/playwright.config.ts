import { defineConfig, devices } from "@playwright/test";

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.PORT || "4173", 10);

export default defineConfig({
  testMatch: "test/**/*.e2e.ts",
  webServer: {
    // We use the root-safe package workspace filter to accurately point to the exact local commands
    command: `pnpm --filter openapi-fetch run e2e-vite-build && pnpm --filter openapi-fetch run e2e-vite-start --host ${HOST} --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // Provides plenty of overhead room for TS6 type compilation
  },
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
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
