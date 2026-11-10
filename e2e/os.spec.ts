import { expect, test, type Page } from "@playwright/test";

/** Boot, then skip the animation. */
async function boot(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("status")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toBeHidden({ timeout: 10_000 });
}

async function expectNoPageScroll(page: Page) {
  const m = await page.evaluate(() => {
    window.scrollTo(0, 1000);
    return { sh: document.scrollingElement!.scrollHeight, ih: innerHeight, y: scrollY };
  });
  expect(m.sh).toBeLessThanOrEqual(m.ih);
  expect(m.y).toBe(0);
}

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("boots to a desktop that never scrolls", async ({ page }) => {
    await boot(page);
    await expect(page.getByRole("list", { name: "Desktop" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Dock" })).toBeVisible();
    await expectNoPageScroll(page);
  });

  test("terminal runs commands and opens apps", async ({ page }) => {
    await boot(page);
    await page.locator('[data-dock="terminal"]').click();
    const input = page.getByLabel("Terminal input");
    await input.fill("whoami");
    await input.press("Enter");
    await expect(page.getByRole("dialog", { name: "Terminal" })).toContainText("Computer Science");
    await input.fill("open about");
    await input.press("Enter");
    await expect(page.getByRole("dialog", { name: "About me" })).toBeVisible();
  });

  test("windows can be maximized and closed", async ({ page }) => {
    await boot(page);
    await page.locator('[data-icon="about"]').dblclick();
    const win = page.getByRole("dialog", { name: "About me" });
    await win.getByRole("button", { name: "Maximize" }).click();
    await expect(win.getByRole("button", { name: "Restore" })).toBeVisible();
    await win.getByRole("button", { name: "Close" }).click();
    await expect(win).toBeHidden();
  });

  test("start menu profile opens About me", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Start menu" }).first().click();
    await page.getByRole("dialog", { name: "Start menu" }).getByRole("button", { name: /About me/ }).click();
    await expect(page.getByRole("dialog", { name: "About me" })).toBeVisible();
  });

  test("search finds a project", async ({ page }) => {
    await boot(page);
    await page.keyboard.press("Control+k");
    await page.getByRole("dialog", { name: "Search" }).getByLabel("Search").fill("moonos");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "MoonOS" })).toBeVisible();
  });

  test("deep link opens a project", async ({ page }) => {
    await boot(page, "/?open=project/moonos");
    await expect(page.getByRole("dialog", { name: "MoonOS" })).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("shows the phone home screen and opens apps full-screen", async ({ page }) => {
    await boot(page);
    await expectNoPageScroll(page);
    await page.getByRole("button", { name: "About me" }).first().click();
    const screen = page.getByRole("dialog", { name: "About me" });
    await expect(screen).toBeVisible();
    await screen.getByRole("button", { name: /Home/ }).click();
    await expect(screen).toBeHidden();
  });
});
