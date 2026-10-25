import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.mjs",
  workers: 2,
  use: { baseURL: "http://127.0.0.1:8765" },
  webServer: {
    command: "python -m http.server 8765 --directory . --bind 127.0.0.1",
    url: "http://127.0.0.1:8765/en.html",
    reuseExistingServer: !process.env.CI,
  },
  outputDir: "../build/website-test-results",
  projects: [
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "iphone-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
