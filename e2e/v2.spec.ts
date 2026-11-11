import { expect, test, type Page } from "@playwright/test";

async function boot(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("status")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toBeHidden({ timeout: 10_000 });
}

test.describe("MoonOS v2 — desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("right-click on the desktop opens the context menu with submenus", async ({ page }) => {
    await boot(page);
    await page.mouse.click(700, 500, { button: "right" });
    const menu = page.getByRole("menu").first();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /Open Terminal/ })).toBeVisible();
    await menu.getByRole("menuitem", { name: /Wallpaper/ }).hover();
    await expect(page.getByRole("menuitem", { name: "Eclipse" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Eclipse" }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("dragged icons keep their place after a reload", async ({ page }) => {
    await boot(page);
    const icon = page.locator('[data-icon="welcome"]');
    const before = await icon.boundingBox();
    await page.mouse.move(before!.x + 40, before!.y + 30);
    await page.mouse.down();
    await page.mouse.move(before!.x + 400, before!.y + 250, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400); // let the snap animation settle
    const after = await icon.boundingBox();
    expect(after!.x).toBeGreaterThan(before!.x + 200);
    await boot(page);
    const reloaded = await page.locator('[data-icon="welcome"]').boundingBox();
    // Same grid cell (cells are 92×100 px).
    expect(Math.abs(reloaded!.x - after!.x)).toBeLessThan(20);
    expect(Math.abs(reloaded!.y - after!.y)).toBeLessThan(20);
  });

  test("a multi-selection drags together", async ({ page }) => {
    await boot(page);
    const a = page.locator('[data-icon="welcome"]');
    const b = page.locator('[data-icon="about"]');
    await a.click();
    await b.click({ modifiers: ["Control"] });
    const [a0, b0] = [await a.boundingBox(), await b.boundingBox()];
    await page.mouse.move(a0!.x + 40, a0!.y + 30);
    await page.mouse.down();
    await page.mouse.move(a0!.x + 40 + 3 * 92, a0!.y + 30, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const [a1, b1] = [await a.boundingBox(), await b.boundingBox()];
    expect(a1!.x - a0!.x).toBeGreaterThan(200);
    expect(b1!.x - b0!.x).toBeGreaterThan(200);
    expect(Math.abs(b1!.y - a1!.y - (b0!.y - a0!.y))).toBeLessThan(4);
  });

  test("terminal easter egg unlocks an achievement", async ({ page }) => {
    await boot(page);
    await page.keyboard.press("Alt+t");
    const input = page.getByLabel("Terminal input");
    await input.fill("sudo hire-me");
    await input.press("Enter");
    await expect(page.getByText("🏆 Excellent decision").first()).toBeVisible();
  });

  test("Alt+L locks and any key unlocks", async ({ page }) => {
    await boot(page);
    await page.keyboard.press("Alt+l");
    await expect(page.getByRole("dialog", { name: /Locked/ })).toBeVisible();
    await page.waitForTimeout(500);
    await page.keyboard.press("Space");
    await expect(page.getByRole("dialog", { name: /Locked/ })).toBeHidden();
  });

  test("Moonword accepts a guess", async ({ page }) => {
    await boot(page, "/?open=moonword");
    const win = page.getByRole("dialog", { name: "Moonword" });
    await expect(win).toBeVisible();
    for (const k of "ORBIT") await win.getByRole("button", { name: k, exact: true }).click();
    await win.getByRole("button", { name: "Enter" }).click();
    await expect(win.getByText("O", { exact: true }).first()).toBeVisible();
  });

  test("Agenda, Trophies and Games open", async ({ page }) => {
    await boot(page);
    for (const name of ["Agenda", "Trophies", "Games"]) {
      await page.locator(`[data-icon="${name.toLowerCase()}"]`).dblclick();
      await expect(page.getByRole("dialog", { name })).toBeVisible();
    }
  });

  test("crawlable project page renders without the OS", async ({ page }) => {
    await page.goto("/projects/moonos");
    await expect(page.getByRole("heading", { level: 1, name: "MoonOS" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open in MoonOS/ })).toHaveAttribute("href", "/?open=project/moonos");
  });
});

test.describe("MoonOS v2 — mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("long-press on a home icon opens its menu", async ({ page }) => {
    await boot(page);
    const icon = page.getByRole("button", { name: "About me" }).first();
    const box = (await icon.boundingBox())!;
    const point = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, pointerType: "touch", bubbles: true };
    await icon.dispatchEvent("pointerdown", point);
    await page.waitForTimeout(700);
    await expect(page.getByRole("menuitem", { name: "Get info" })).toBeVisible();
  });
});
