import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 4,
  use: {
    baseURL: "http://localhost:3100",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 240_000,
    env: { GUIDE_MODE: "mock", DATABASE_URL: `file:data/test-phase-09-${process.pid}.db` },
  },
});
