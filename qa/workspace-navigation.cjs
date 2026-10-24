// Reproduces the review's lost drafts and incorrect Home/End behavior in an isolated guest browser.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/src/backend.ts", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "export const supabase=null;",
      }),
    );
    await page.goto(process.env.BASE_URL || "http://127.0.0.1:5176");
    await page.getByRole("button", { name: "English", exact: true }).click();
    const nav = (name) =>
      page
        .locator("aside nav")
        .getByRole("button", { name, exact: true })
        .click();
    await nav("Projects");
    await page.locator(".table-wrap .project-name-link").first().click();
    const projectUrl = page.url();
    const tasks = page.getByRole("tab", { name: /^Tasks/ });
    const details = page.getByRole("tab", {
      name: "Scope & notes",
      exact: true,
    });
    const scope = page.getByLabel("Project scope", { exact: true });
    await tasks.press("Home");
    assert.equal(await tasks.getAttribute("aria-selected"), "true");
    await tasks.press("End");
    assert.equal(await details.getAttribute("aria-selected"), "true");
    await details.press("End");
    assert.equal(await details.getAttribute("aria-selected"), "true");
    await details.press("Home");
    assert.equal(await tasks.getAttribute("aria-selected"), "true");
    await details.click();
    await scope.fill("Unsaved scope must survive tab changes.");
    await tasks.click();
    assert.equal(await scope.isVisible(), false);
    await details.click();
    assert.equal(
      await scope.inputValue(),
      "Unsaved scope must survive tab changes.",
    );
    let dialogs = 0;
    page.on("dialog", async (dialog) => {
      dialogs++;
      await dialog.dismiss();
    });
    await nav("Overview");
    assert.equal(page.url(), projectUrl);
    assert.equal(
      await scope.inputValue(),
      "Unsaved scope must survive tab changes.",
    );
    await page
      .getByRole("button", { name: "Develop the brief with AI", exact: true })
      .click();
    assert.equal(page.url(), projectUrl);
    assert.equal(
      await scope.inputValue(),
      "Unsaved scope must survive tab changes.",
    );
    await page.evaluate(() => {
      location.hash = "finance";
    });
    await page.waitForURL(projectUrl);
    assert.equal(
      await scope.inputValue(),
      "Unsaved scope must survive tab changes.",
    );
    assert.equal(
      dialogs,
      3,
      "sidebar, AI and direct hash navigation each protect the draft",
    );
    await tasks.click();
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await page
      .getByLabel("Task title", { exact: true })
      .fill("Unsaved task retained separately");
    await details.click();
    await page
      .getByRole("button", { name: "Save details", exact: true })
      .click();
    await page.getByText("Project details saved.", { exact: true }).waitFor();
    await nav("Overview");
    assert.equal(
      page.url(),
      projectUrl,
      "saving details must not clear a separate dirty task",
    );
    await tasks.click();
    assert.equal(
      await page.getByLabel("Task title", { exact: true }).inputValue(),
      "Unsaved task retained separately",
    );
    await page.getByRole("button", { name: "Save task", exact: true }).click();
    await page.getByText("Task saved.", { exact: true }).waitFor();
    await nav("Clients");
    await page.locator(".client-entry").first().click();
    const email = page.getByLabel("Email", { exact: true });
    await email.fill("unsaved@example.test");
    await nav("Overview");
    assert.ok(page.url().endsWith("#clients"));
    await page.locator(".client-entry").nth(1).click();
    assert.equal(
      await email.inputValue(),
      "unsaved@example.test",
      "changing client protects unsaved profile",
    );
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await page.getByText("Client profile saved.", { exact: true }).waitFor();
    await nav("Overview");
    assert.ok(page.url().endsWith("#overview"));
    assert.deepEqual(errors, []);
    console.log(
      "PASS: retained scope/task drafts, Home/End, protected sidebar/hash/AI/client navigation, independent dirty forms and save clearing. Isolated guest only.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
