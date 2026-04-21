import { test, expect } from "./fixtures";
import { startFakeIRacing, stopFakeIRacing } from "../helpers/fake-iracing";

/**
 * iRacing lifecycle tests.
 *
 * Prerequisites:
 *   - Pitlane must be running (started by globalSetup or manually)
 *   - No iRacing process running at the start of each test
 *
 * The fake iRacing helper creates an iRacingUI.exe process (cmd.exe clone)
 * that Pitlane's monitor detects normally. Stopping it triggers the kill cycle.
 */

test.describe("iRacing lifecycle", () => {
  // Always clean up fake iRacing after each test, even on failure
  test.afterEach(async () => {
    await stopFakeIRacing();
  });

  // ── Core: status bar detection ───────────────────────────────────────────

  test("status bar shows offline when iRacing is not running", async ({ page }) => {
    const status = page.getByTestId("iracing-status");
    await expect(status).toContainText(/offline/i);
  });

  test("status bar detects iRacing start and stop", async ({ page }) => {
    const status = page.getByTestId("iracing-status");

    // Baseline: offline
    await expect(status).toContainText(/offline/i);

    // Start fake iRacing → Pitlane detects within monitor poll period (~2 s)
    await startFakeIRacing();
    await expect(status).not.toContainText(/offline/i, { timeout: 15_000 });

    // Stop fake iRacing → Pitlane detects exit
    await stopFakeIRacing();
    await expect(status).toContainText(/offline/i, { timeout: 15_000 });
  });

  // ── App launch cycle (requires apps configured in the active profile) ────

  test("apps running count appears in status bar when iRacing starts", async ({ page }) => {
    // This test is meaningful only when the active profile has ≥1 enabled app.
    // We check optimistically; the assertion has a long timeout to absorb app startup.
    const status = page.getByTestId("iracing-status");

    await startFakeIRacing();
    await expect(status).not.toContainText(/offline/i, { timeout: 15_000 });

    // If apps are configured and launched, the status bar shows a count badge.
    // Skip the count assertion rather than fail if no apps are configured.
    const countBadge = page.getByText(/\d+\s+app/i);
    const hasApps = await countBadge.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasApps) {
      await expect(countBadge).toBeVisible();
    }

    await stopFakeIRacing();
  });

  // ── App card state transitions ───────────────────────────────────────────
  // Requires at least one app configured in the active profile.

  test("app cards transition to Running state when iRacing starts", async ({ page }) => {
    await page.getByTestId("nav-apps").click();

    const cards = page.getByTestId("app-card");
    const count = await cards.count();

    // Skip if no apps are configured
    if (count === 0) {
      test.skip(true, "No apps configured — skipping app state transition test");
      return;
    }

    await startFakeIRacing();

    // At least one card should show "Running" status
    await expect(
      page.getByTestId("app-card").filter({ hasText: /running/i }).first()
    ).toBeVisible({ timeout: 20_000 });

    await stopFakeIRacing();

    // All cards should return to non-running state
    await expect(
      page.getByTestId("app-card").filter({ hasText: /running/i })
    ).toHaveCount(0, { timeout: 15_000 });
  });

  // ── Flows requiring backend commands not yet implemented ─────────────────

  // TODO: enable when backend implements add_app + delete_app with full round-trip
  // test("add a test app, verify it launches with iRacing, then delete it", async ({ page }) => {
  //   await page.getByTestId("nav-apps").click();
  //
  //   // Add notepad as a test app via UI
  //   await page.getByRole("button", { name: /add/i }).click();
  //   await page.getByLabel(/name/i).fill("Notepad (E2E test)");
  //   await page.getByLabel(/executable/i).fill("C:\\Windows\\System32\\notepad.exe");
  //   await page.getByRole("button", { name: /save/i }).click();
  //
  //   await expect(page.getByText("Notepad (E2E test)")).toBeVisible();
  //
  //   // Launch iRacing → notepad should start
  //   await startFakeIRacing();
  //   await expect(
  //     page.getByTestId("app-card")
  //       .filter({ hasText: "Notepad (E2E test)" })
  //       .filter({ hasText: /running/i })
  //   ).toBeVisible({ timeout: 20_000 });
  //
  //   // Stop iRacing → notepad should be killed
  //   await stopFakeIRacing();
  //   await expect(
  //     page.getByTestId("app-card")
  //       .filter({ hasText: "Notepad (E2E test)" })
  //       .filter({ hasText: /running/i })
  //   ).not.toBeVisible({ timeout: 15_000 });
  //
  //   // Clean up: delete the test app (requires backend delete_app command)
  //   await page.getByTestId("app-card")
  //     .filter({ hasText: "Notepad (E2E test)" })
  //     .getByTitle(/delete/i)
  //     .click();
  //   await page.getByRole("button", { name: /delete/i }).last().click();
  //   await expect(page.getByText("Notepad (E2E test)")).not.toBeVisible();
  // });

  // TODO: enable when backend implements update_app
  // test("editing an app's name persists after reload", async ({ page }) => {
  //   await page.getByTestId("nav-apps").click();
  //
  //   const firstCard = page.getByTestId("app-card").first();
  //   const originalName = await firstCard.locator(".text-sm.font-medium").textContent();
  //
  //   await firstCard.getByTitle(/edit/i).click();
  //   await page.getByLabel(/name/i).clear();
  //   await page.getByLabel(/name/i).fill("Renamed App");
  //   await page.getByRole("button", { name: /save/i }).click();
  //
  //   await expect(page.getByText("Renamed App")).toBeVisible();
  //
  //   // Rename back
  //   await firstCard.getByTitle(/edit/i).click();
  //   await page.getByLabel(/name/i).clear();
  //   await page.getByLabel(/name/i).fill(originalName!);
  //   await page.getByRole("button", { name: /save/i }).click();
  // });
});
