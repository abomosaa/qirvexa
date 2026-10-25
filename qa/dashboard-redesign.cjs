// Local-only interaction, motion and screenshot evidence. No production writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.BASE_URL || "http://127.0.0.1:5177";
const output = path.resolve(".impeccable/review");
async function isolate(page, lang) {
  await page.addInitScript(
    (lang) => localStorage.setItem("qirvexa.lang", lang),
    lang,
  );
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.endsWith("/src/backend.ts"))
      return route.fulfill({
        contentType: "application/javascript",
        body: "export const supabase=null;",
      });
    return url.startsWith(new URL(base).origin)
      ? route.continue()
      : route.abort();
  });
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await isolate(page, "en");
    await page.goto(base);
    await page.locator(".dashboard").waitFor();
    const records = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("qirvexa.projects.v1")),
    );
    assert.equal(records.length, 12);
    assert.equal(
      await page.locator(".workflow-total strong").innerText(),
      "12",
    );
    assert.equal(await page.locator(".client-value-row").count(), 4);
    const legibility = await page.evaluate(() => {
      const badge = document.querySelector(".badge.neutral");
      const color = getComputedStyle(badge);
      const luminance = (css) => {
        const values = css
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((n) => n / 255)
          .map((n) =>
            n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
          );
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      };
      const foreground = luminance(color.color),
        background = luminance(color.backgroundColor);
      return {
        badgeContrast:
          (Math.max(foreground, background) + 0.05) /
          (Math.min(foreground, background) + 0.05),
        smallLabels: Array.from(
          document.querySelectorAll(
            ".dashboard .metric-label, .dashboard .metrics p, .dashboard .panel-title p",
          ),
        ).filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12).length,
        smallButtons: Array.from(
          document.querySelectorAll(".dashboard button"),
        ).filter(
          (el) =>
            el.getBoundingClientRect().height < 32 ||
            el.getBoundingClientRect().width < 32,
        ).length,
      };
    });
    assert.ok(
      legibility.badgeContrast >= 4.5,
      `delivery badge contrast ${legibility.badgeContrast}`,
    );
    assert.equal(legibility.smallLabels, 0);
    assert.equal(legibility.smallButtons, 0);
    assert.equal(
      await page
        .locator(".client-value-track i")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.getByRole("button", { name: "1M", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "1M", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    const currentMonth = records.filter(
      (p) =>
        new Date(p.created_at).getMonth() === new Date().getMonth() &&
        new Date(p.created_at) <= new Date(),
    ).length;
    assert.equal(
      await page.locator(".workflow-total strong").innerText(),
      String(currentMonth),
    );
    await page.getByRole("button", { name: "6M", exact: true }).click();
    await page.locator(".metric-bottom button").nth(0).click();
    assert.ok(page.url().endsWith("#finance"));
    await page
      .locator("aside nav")
      .getByRole("button", { name: "Overview", exact: true })
      .click();
    await page.locator(".metric-bottom button").nth(3).click();
    assert.ok(page.url().endsWith("#clients"));
    await page
      .locator("aside nav")
      .getByRole("button", { name: "Overview", exact: true })
      .click();
    await page
      .getByRole("searchbox", { name: "Quick project search", exact: true })
      .fill("Waraq");
    await page.getByRole("button", { name: "Run search", exact: true }).click();
    assert.ok(page.url().endsWith("#projects"));
    assert.equal(await page.locator(".table-wrap tbody tr").count(), 2);
    assert.match(await page.locator(".table-wrap tbody").innerText(), /Waraq/);
    await page.locator(".table-wrap .project-name-link").first().click();
    await page.getByRole("tab", { name: "Scope & notes", exact: true }).click();
    await page
      .getByLabel("Project scope", { exact: true })
      .fill("Unsaved draft must remain here");
    const route = page.url();
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Run search", exact: true }).click();
    assert.equal(page.url(), route);
    assert.equal(
      await page.getByLabel("Project scope", { exact: true }).inputValue(),
      "Unsaved draft must remain here",
    );
    await page.close();
    const captures = [];
    for (const lang of ["ar", "en"]) {
      for (const width of [390, 820, 1440]) {
        const shot = await browser.newPage({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        });
        await isolate(shot, lang);
        await shot.goto(base);
        await shot.locator(".dashboard").waitFor();
        await shot.evaluate(() => document.fonts.ready);
        await shot.mouse.move(0, 0);
        assert.ok(
          await shot.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        const name = `dashboard-${lang}-${width}`;
        await shot.screenshot({
          path: path.join(output, `${name}.png`),
          fullPage: true,
        });
        await shot.screenshot({
          path: path.join(output, `${name}-viewport.png`),
          fullPage: false,
        });
        captures.push(name);
        if (width === 390) {
          await shot
            .getByRole("button", {
              name: lang === "ar" ? "فتح القائمة" : "Open navigation",
              exact: true,
            })
            .click();
          assert.match(
            await shot.locator("aside").getAttribute("class"),
            /is-open/,
          );
          await shot
            .locator("aside")
            .getByRole("button", {
              name: lang === "ar" ? "إغلاق القائمة" : "Close navigation",
              exact: true,
            })
            .click();
          assert.doesNotMatch(
            await shot.locator("aside").getAttribute("class"),
            /is-open/,
          );
        }
        await shot.close();
      }
    }
    const motion = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
    });
    await isolate(motion, "en");
    await motion.goto(base);
    await motion.locator(".client-value-track i").first().waitFor();
    assert.equal(
      await motion
        .locator(".client-value-track i")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "client-share",
    );
    await motion
      .getByRole("button", { name: "New project", exact: true })
      .click();
    assert.equal(
      await motion
        .locator("dialog")
        .evaluate((el) => getComputedStyle(el).animationName),
      "workspace-dialog",
    );
    await motion.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await motion
        .locator("dialog")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    assert.equal(
      await motion
        .locator(".client-value-track i")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await motion.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(output, "dashboard-redesign-results.json"),
      JSON.stringify(
        {
          passed: true,
          captures,
          periodFiltering: true,
          globalSearch: true,
          globalSearchRespectsUnsavedDraft: true,
          reducedMotion: true,
          drawerClose: true,
          externalNetworkBlocked: true,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: period filters, real record totals, global search, draft guard, bilingual mobile drawer, normal/reduced motion, 6 responsive captures; no external requests.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
