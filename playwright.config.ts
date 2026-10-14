import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3100",
    ...devices["Pixel 7"],
    viewport: { width: 375, height: 812 },
  },
  projects: [{ name: "mobile-chromium" }],
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 240_000,
    env: { GUIDE_MODE: "mock" },
  },
});
