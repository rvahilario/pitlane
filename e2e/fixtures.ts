import { test as base, chromium, type Browser, type Page } from "@playwright/test";
import { CDP_URL } from "./constants.ts";

type PitlaneFixtures = { page: Page };
type PitlaneWorkerFixtures = { browser: Browser };

export const test = base.extend<PitlaneFixtures, PitlaneWorkerFixtures>({
  // One shared CDP connection per worker (we run with workers: 1)
  browser: [
    async ({}, use) => {
      const browser = await chromium.connectOverCDP(CDP_URL);
      await use(browser);
      // Intentionally NOT calling browser.close() — that sends Browser.close
      // to WebView2 and would terminate the Tauri window.
      // The connection is released when the worker process exits.
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
