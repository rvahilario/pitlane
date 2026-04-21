/**
 * Fixtures for the integration test suite.
 * Connects to a real Tauri binary via WebView2 CDP instead of using
 * Playwright's own browser. The binary must be running with:
 *   WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222
 *
 * Use scripts/start-e2e.ps1 or npm run test:e2e:integration (which handles
 * launching the binary automatically via the integration global-setup).
 */

import { test as base, chromium, type Browser, type Page } from "@playwright/test";
import { CDP_URL } from "../constants.ts";

type Fixtures = { page: Page };
type WorkerFixtures = { browser: Browser };

export const test = base.extend<Fixtures, WorkerFixtures>({
  browser: [
    async ({}, use) => {
      const browser = await chromium.connectOverCDP(CDP_URL);
      await use(browser);
      // Do NOT call browser.close() — it sends Browser.close to WebView2
      // and terminates the Tauri window.
    },
    { scope: "worker" },
  ],

  page: async ({ browser }, use) => {
    const context = browser.contexts()[0];
    if (!context) throw new Error("[e2e] No context found in Pitlane CDP");
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export { expect } from "@playwright/test";
