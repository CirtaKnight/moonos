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
