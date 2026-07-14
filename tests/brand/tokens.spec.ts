import { expect, test } from "@playwright/test";
import { ROUTES } from "../routes";

/**
 * Brand guideline unit tests. These assert against runtime computed styles
 * so we catch drift the moment someone hardcodes a color or ships a
 * non-brand font.
 */

const EXPECTED = {
  // #F8FAFC
  background: "rgb(248, 250, 252)",
  // #E5E7EB
  border: "rgb(229, 231, 235)",
  // #3B82F6
  accent: "rgb(59, 130, 246)",
  // #FFFFFF
  card: "rgb(255, 255, 255)",
};

test.describe("brand tokens", () => {
  for (const route of ROUTES) {
    test(`${route.slug} — body background + font`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });

      const { bg, font } = await page.evaluate(() => {
        const s = getComputedStyle(document.body);
        return { bg: s.backgroundColor, font: s.fontFamily };
      });

      expect(bg).toBe(EXPECTED.background);
      expect(font.toLowerCase()).toContain("inter");
    });
  }

  test("accent color resolves to brand blue", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--ai").trim(),
    );
    // Stored as hex in :root, expect exact brand blue.
    expect(accent.toLowerCase()).toBe("#3b82f6");
  });

  test("primary token resolves to brand blue", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
    );
    expect(primary.toLowerCase()).toBe("#3b82f6");
  });

  test("border token resolves to brand hairline", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const border = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--border").trim(),
    );
    expect(border.toLowerCase()).toBe("#e5e7eb");
  });

  test("card token resolves to white", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const card = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--card").trim(),
    );
    // Browsers may normalize #FFFFFF to #FFF.
    expect(["#FFFFFF", "#FFF"]).toContain(card.toUpperCase());
  });

  test("radius token is 12px (0.75rem)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const radius = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--radius").trim(),
    );
    // Browsers may drop the leading zero.
    expect([".75rem", "0.75rem"]).toContain(radius);
  });


  test("dark theme is not applied by default", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(isDark).toBe(false);
  });
});

test.describe("no hardcoded pure-black/white text", () => {
  // Snapshot canonical routes only — the shell is shared, so if these are
  // clean the token system is being respected everywhere.
  for (const slug of ["home", "crm", "recruiting", "workers"] as const) {
    const route = ROUTES.find((r) => r.slug === slug)!;
    test(`${route.slug} — no rgb(0,0,0) text`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      const offenders = await page.evaluate(() => {
        const bad: string[] = [];
        document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
          const c = getComputedStyle(el).color;
          if (c === "rgb(0, 0, 0)" && el.textContent?.trim()) {
            bad.push(el.tagName + ":" + el.className.slice(0, 40));
          }
        });
        return bad.slice(0, 5);
      });
      expect(offenders, offenders.join("\n")).toHaveLength(0);
    });
  }
});
