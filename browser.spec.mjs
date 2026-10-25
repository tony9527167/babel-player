import { test, expect } from "@playwright/test";

for (const language of ["en", "zh-CN"]) {
  test(`${language}: responsive layout and independent mask controls`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${language}.html`);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 375, 390, 768, 844, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}px`).toBe(true);
      for (const button of await page.getByRole("button").all()) {
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
        const box = await button.boundingBox();
        const player = await button.locator("xpath=ancestor::*[@data-demo]").boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(player.x);
        expect(box.x + box.width).toBeLessThanOrEqual(player.x + player.width);
        if (testInfo.project.name === "iphone-webkit") {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: testInfo.outputPath(`${language}-mobile.png`), fullPage: true });
    const players = page.locator("[data-demo]");
    await players.nth(0).getByRole("button").click();
    await expect(players.nth(0).locator(".subtitle-mask")).toBeHidden();
    await expect(players.nth(1).locator(".subtitle-mask")).toBeHidden();
    await players.nth(1).getByRole("button").click();
    await expect(players.nth(1).locator(".subtitle-mask")).toBeVisible();
    await page.locator('a[href="#downloads"]').click();
    await expect(page.locator("#downloads")).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test("full product content and language links work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8765/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("language learners");
  await expect(page.locator(".download-card")).toHaveCount(2);
  await page.getByRole("link", { name: "简体中文" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await context.close();
});

test("root follows browser language, explicit language pages stay put", async ({ browser }) => {
  const context = await browser.newContext({ locale: "zh-CN" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8765/");
  await expect(page).toHaveURL(/\/zh-CN.html$/);
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en.html$/);
  await context.close();
});

test("small supporting text has sufficient contrast", async ({ page }) => {
  await page.goto("/en.html");
  const ratio = await page.evaluate(() => {
    const luminance = (color) => {
      const components = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return components.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    };
    const background = luminance(getComputedStyle(document.body).backgroundColor);
    const foreground = luminance(getComputedStyle(document.querySelector(".codec-note")).color);
    return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
