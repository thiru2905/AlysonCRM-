import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "../routes";

/**
 * Visual regression: capture every route at the current project's viewport
 * and diff against the committed baseline. Baselines live per-project so
 * mobile/tablet/desktop each get their own PNG.
 */
async function prepare(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.fonts?.status === "loaded");
  // Freeze any pulse/ping animations we didn't cover via reducedMotion.
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  });
  await page.waitForTimeout(150);
}

for (const route of ROUTES) {
  test(`visual — ${route.slug}`, async ({ page }) => {
    await prepare(page, route.path);
    await expect(page).toHaveScreenshot(`${route.slug}.png`, { fullPage: true });
  });
}
