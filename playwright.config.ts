import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],

  globalSetup:    "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  projects: [
    {
      // Default suite — Playwright's own Chromium, Tauri API mocked.
      // Runs against the Vite dev server; no Tauri binary needed.
      name: "ui",
      testMatch: /ui-smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
    {
      // Integration suite — connects via CDP to a running Tauri binary.
      // Requires: cargo build && npm run test:e2e:integration
      // (or the binary to already be running with --remote-debugging-port=9222)
      name: "integration",
      testMatch: /integration\/iracing-lifecycle\.spec\.ts/,
      use: {
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        // CDP connection is handled in e2e/integration/fixtures.ts
      },
    },
  ],
});
