// Layout acceptance for every workspace route, both languages, and three shipped widths.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const base = process.env.BASE_URL || "http://127.0.0.1:5176";
  const output = path.resolve(".impeccable/review");
  fs.mkdirSync(output, { recursive: true });
  let checks = 0;
  try {
    for (const lang of ["ar", "en"]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
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
      for (const width of [390, 820, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const view of [
          "overview",
          "projects",
          "deadlines",
          "clients",
          "finance",
          "assistant",
          "settings",
        ]) {
          await page.goto(base + "/#" + view);
          await page.locator("main h1").waitFor();
          await page.evaluate(() => document.fonts.ready);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${lang}/${width}/${view} overflow`,
          );
          assert.equal(
            await page.locator("html").getAttribute("dir"),
            lang === "ar" ? "rtl" : "ltr",
          );
          checks++;
          if (
            width === 1440 &&
            lang === "ar" &&
            ["overview", "finance"].includes(view)
          )
            await page.screenshot({
              path: path.join(output, view + "-ar-desktop.png"),
              fullPage: true,
            });
          if (width === 390 && lang === "en" && view === "overview")
            await page.screenshot({
              path: path.join(output, "overview-en-mobile.png"),
              fullPage: true,
            });
        }
        await page.goto(base + "/#projects");
        const id = await page.evaluate(
          () => JSON.parse(localStorage.getItem("qirvexa.projects.v1"))[0].id,
        );
        await page.goto(base + "/#projects/" + id);
        await page.locator(".project-summary").waitFor();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${lang}/${width}/project overflow`,
        );
        await page
          .getByRole("tab", {
            name: lang === "ar" ? "النطاق والملاحظات" : "Scope & notes",
            exact: true,
          })
          .click();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${lang}/${width}/scope overflow`,
        );
        checks += 2;
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    fs.writeFileSync(
      path.join(output, "responsive-results.json"),
      JSON.stringify(
        {
          passed: true,
          checks,
          languages: ["ar", "en"],
          widths: [390, 820, 1440],
          externalNetworkBlocked: true,
        },
        null,
        2,
      ),
    );
    console.log(
      `PASS: ${checks} route/language/viewport layout checks; zero overflow or page errors; external network blocked.`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
