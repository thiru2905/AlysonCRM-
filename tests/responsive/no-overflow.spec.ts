import { expect, test } from "@playwright/test";
import { ROUTES } from "../routes";

/**
 * Guard against horizontal overflow on any route at any viewport.
 * A page that scrolls sideways almost always means something wasn't
 * made responsive.
 */
for (const route of ROUTES) {
  test(`no horizontal overflow — ${route.slug}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.fonts?.status === "loaded");
    const { scrollW, clientW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    // Allow 1px for subpixel rounding.
    expect(scrollW, `${route.path} scrollWidth ${scrollW} > clientWidth ${clientW}`).toBeLessThanOrEqual(clientW + 1);
  });
}
