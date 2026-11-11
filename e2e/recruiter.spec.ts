import { expect, test } from "@playwright/test";

test.describe("Recruiter mode", () => {
  test("the boot screen links to the one-page view", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Recruiter\? One-page view/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/recruiter$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("the one-page PDF is a real single-page PDF", async ({ page, request }) => {
    await page.goto("/recruiter");
    const href = await page.getByRole("link", { name: /One-page PDF/ }).getAttribute("href");
    expect(href).toBe("/recruiter/resume.pdf");
    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    const body = (await res.body()).toString("latin1");
    expect(body.startsWith("%PDF")).toBe(true);
    expect(body.match(/\/Type \/Page\b/g)?.length).toBe(1);
  });

  test("the page never scrolls horizontally", async ({ page }) => {
    await page.goto("/recruiter");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Desktop shortcuts to recruiters and Konshu", () => {
  test("the shell shows a recruiter button, Konshu pops in the corner, folders sit top-right", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-recruiter-button]").first()).toHaveAttribute("href", "/recruiter");

    const konshu = page.locator("[data-konshu-corner]");
    await expect(konshu).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/keeper of this sky/)).toBeVisible({ timeout: 8_000 });

    if (!isMobile) {
      const folder = (await page.locator('[data-icon="project:moonos"]').boundingBox())!;
      const width = page.viewportSize()!.width;
      expect(width - (folder.x + folder.width)).toBeLessThan(40);
      expect(folder.y).toBeLessThan(120);
    }

    await konshu.click();
    await expect(page.getByPlaceholder(/Ask/i)).toBeVisible();
  });
});
