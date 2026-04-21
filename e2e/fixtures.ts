import { test as base, type Page } from "@playwright/test";
import { VITE_URL } from "./constants.ts";

/**
 * Minimal mock of window.__TAURI_INTERNALS__ so @tauri-apps/api/core's
 * invoke() resolves without a real Tauri backend.
 *
 * Returns sensible defaults for every command the UI calls on startup.
 * Tests can override specific commands via page.evaluate() before interactions.
 */
const TAURI_MOCK_SCRIPT = `
  const DEFAULTS = {
    get_apps:              [],
    get_profiles:          [{ id: "p1", name: "Default", enabled: true, color: null, trigger_mode: null }],
    get_active_profile_id: "p1",
    get_settings:          { poll_interval_secs: 2, default_trigger: "ui", notifications_enabled: true, autostart: false },
    get_iracing_status:    false,
    get_app_statuses:      [],
    set_tray_labels:       null,
    get_autostart_enabled: false,
  };

  window.__TAURI_INTERNALS__ = {
    invoke: (cmd, _args) => Promise.resolve(DEFAULTS[cmd] ?? null),
    transformCallback: (cb) => cb,
    convertFileSrc: (s) => s,
    metadata: {},
  };
`;

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    // Inject mock before any page script runs
    await page.addInitScript(TAURI_MOCK_SCRIPT);
    await page.goto(VITE_URL);
    // Wait for the React shell to mount
    await page.waitForSelector("[data-testid='iracing-status']");
    await use(page);
  },
});

export { expect } from "@playwright/test";
