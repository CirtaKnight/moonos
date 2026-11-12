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

  test("Konshu answers locally and offers actions", async ({ page }) => {
    await boot(page, "/?open=konshu");
    const win = page.getByRole("dialog", { name: "Konshu" });
    await win.getByLabel("Message Konshu").fill("How can I contact you?");
    await win.getByLabel("Message Konshu").press("Enter");
    await expect(win.getByRole("button", { name: "Open Mail" })).toBeVisible();
  });

  test("Map, Skills, Activity and Source open", async ({ page }) => {
    await boot(page);
    for (const [id, name] of [["map", "Map"], ["skills", "Skills"], ["activity", "Activity"], ["source", "Source"]] as const) {
      await page.goto(`/?open=${id}`);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog", { name })).toBeVisible({ timeout: 10_000 });
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

test.describe("MoonOS v2 — phone home gestures", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("short screens get several pages that swipe, and icons can be dragged", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 640 });
    await boot(page);
    await expect(page.getByRole("button", { name: "Page 2" })).toBeVisible();

    // Every visible icon sits fully inside the grid (nothing hidden behind the dock).
    const fits = await page.evaluate(() => {
      const grid = document.querySelector("[data-home-grid]")!.getBoundingClientRect();
      return [...document.querySelectorAll("[data-home-id]")]
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.left >= 0 && r.left < innerWidth)
        .every((r) => r.bottom <= grid.bottom + 1);
    });
    expect(fits).toBe(true);

    // Swipe left with a touch-like pointer.
    await page.evaluate(async () => {
      const el = document.querySelector("[data-home-grid]")!;
      const r = el.getBoundingClientRect();
      const ev = (type: string, x: number) =>
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: r.top + 60, pointerId: 3, pointerType: "touch", isPrimary: true });
      el.dispatchEvent(ev("pointerdown", r.right - 30));
      for (let i = 1; i <= 8; i++) window.dispatchEvent(ev("pointermove", r.right - 30 - i * 35));
      window.dispatchEvent(ev("pointerup", r.right - 30 - 8 * 35));
    });
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    await page.waitForTimeout(500); // let the page slide finish before measuring icons

    // Long-press then move an icon onto the first slot of page 2.
    const moved = await page.evaluate(async () => {
      const visible = [...document.querySelectorAll<HTMLElement>("[data-home-id]")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.left >= 0 && r.left < innerWidth;
      });
      const [first, second] = visible;
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      const ev = (type: string, x: number, y: number) =>
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 4, pointerType: "touch", isPrimary: true });
      second.dispatchEvent(ev("pointerdown", b.left + 40, b.top + 30));
      await new Promise((r) => setTimeout(r, 600));
      for (let i = 1; i <= 6; i++) window.dispatchEvent(ev("pointermove", b.left + 40 + ((a.left - b.left) * i) / 6, a.top + 30));
      window.dispatchEvent(ev("pointerup", a.left + 40, a.top + 30));
      return { id: second.dataset.homeId!, expected: Math.round(a.left) };
    });
    // Wait for the icon to settle into its new slot (it animates there).
    await expect
      .poll(() => page.evaluate((id) => Math.round(document.querySelector(`[data-home-id="${id}"]`)!.getBoundingClientRect().left), moved.id))
      .toBe(moved.expected);
  });
});

test.describe("MoonOS v2 — window previews and memory", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("windows come back after a reload, where they were left", async ({ page }) => {
    await boot(page);
    await page.locator('[data-icon="about"]').dblclick();
    const win = page.locator('[data-window="about"]');
    await expect(win).toBeVisible();
    const bar = win.locator("> div").first();
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + 160, box.y + 15);
    await page.mouse.down();
    await page.mouse.move(box.x + 260, box.y + 75, { steps: 6 });
    await page.mouse.up();
    const left = await win.evaluate((el) => (el as HTMLElement).style.left);
    await page.waitForTimeout(600); // saved after a short debounce

    await boot(page);
    await expect(page.locator('[data-window="about"]')).toBeVisible();
    expect(await page.locator('[data-window="about"]').evaluate((el) => (el as HTMLElement).style.left)).toBe(left);
  });

  test("hovering a running app shows previews in the dock and the taskbar", async ({ page }) => {
    for (const layout of ["dock", "taskbar"] as const) {
      await page.goto("/");
      await page.evaluate((l) => {
        localStorage.clear();
        localStorage.setItem("ck-os-settings", JSON.stringify({ state: { layout: l, hasBooted: true, restoreWindows: false }, version: 4 }));
      }, layout);
      await boot(page);
      await page.locator('[data-icon="terminal"]').dblclick();
      await expect(page.locator('[data-window="terminal"]')).toBeVisible();
      await page.locator('[data-dock="terminal"]').first().hover();
      const preview = page.getByRole("group", { name: "Terminal windows" });
      await expect(preview).toBeVisible();
      await expect(preview.getByRole("button", { name: /Show Terminal/ })).toBeVisible();
      await preview.getByRole("button", { name: /Close Terminal/ }).click();
      await expect(page.locator('[data-window="terminal"]')).toHaveCount(0);
    }
  });
});

test.describe("MoonOS v2 — layout, fullscreen and pinned apps", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("taskbar on big screens, dock on tablet sizes, by default", async ({ page }) => {
    // Fullscreen off for this test: a fullscreen browser window can't be resized.
    await page.addInitScript(() => localStorage.setItem("ck-os-settings", JSON.stringify({ state: { fullscreen: false }, version: 5 })));
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page);
    await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByRole("navigation", { name: "Dock" })).toBeVisible();
  });

  test("goes fullscreen on the key press that skips the boot", async ({ page }) => {
    await boot(page);
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    // Leaving fullscreen is respected: the next click doesn't force it back.
    await page.evaluate(() => document.exitFullscreen());
    await page.mouse.click(400, 300);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  });

  test("pinned apps can be unpinned and pinned again from menus", async ({ page }) => {
    await boot(page);
    await page.locator('[data-dock="gallery"]').click({ button: "right" });
    await page.getByRole("menuitem", { name: /Unpin from/ }).click();
    await expect(page.locator('[data-dock="gallery"]')).toHaveCount(0);
    await page.locator('[data-icon="games"]').click({ button: "right" });
    await page.getByRole("menuitem", { name: /Pin to/ }).click();
    await expect(page.locator('[data-dock="games"]')).toHaveCount(1);
  });
});
