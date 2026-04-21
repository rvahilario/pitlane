import { test, expect } from "./fixtures";

/**
 * Smoke tests — verify the shell renders correctly.
 * These tests do not require iRacing or specific app configuration.
 */

test.describe("UI smoke", () => {
  test("shows Pitlane wordmark in the header", async ({ page }) => {
    await expect(page.getByText("Pitlane")).toBeVisible();
  });

  test("status bar is present with an iRacing status indicator", async ({ page }) => {
    await expect(page.getByTestId("iracing-status")).toBeVisible();
  });

  test("all sidebar navigation items are present", async ({ page }) => {
    await expect(page.getByTestId("nav-apps")).toBeVisible();
    await expect(page.getByTestId("nav-log")).toBeVisible();
    await expect(page.getByTestId("nav-history")).toBeVisible();
    await expect(page.getByTestId("nav-settings")).toBeVisible();
  });

  test("navigates to Log tab", async ({ page }) => {
    await page.getByTestId("nav-log").click();
    await expect(page.getByTestId("nav-log")).toHaveAttribute(
      "class",
      /text-text\b/
    );
  });

  test("navigates to Settings tab and shows content", async ({ page }) => {
    await page.getByTestId("nav-settings").click();
    // Settings screen renders a heading with the section title
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  });

  test("navigates back to Apps tab", async ({ page }) => {
    await page.getByTestId("nav-apps").click();
    await expect(page.getByTestId("nav-apps")).toBeVisible();
  });

  // TODO: enable when language switching is stable in E2E context
  // test("language selector switches to PT-BR", async ({ page }) => {
  //   await page.getByRole("button", { name: /EN/i }).click();
  //   await page.getByText("Português (BR)").click();
  //   await expect(page.getByTestId("nav-settings")).toContainText("Configurações");
  //   // Restore
  //   await page.getByRole("button", { name: /PT/i }).click();
  //   await page.getByText("English").click();
  // });
});
