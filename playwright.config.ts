import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "Pixel 7",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    env: { MARKETPLACE_MODE: "mock", SITE_URL: "http://localhost:3000" },
  },
});
