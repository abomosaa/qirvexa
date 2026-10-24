// Isolated guest-workspace regressions. Backend replaced before import; no live writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const output = path.resolve(".impeccable/review");
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/src/backend.ts", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "export const supabase = null;",
      }),
    );
    await page.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
    await page.getByRole("button", { name: "English", exact: true }).click();
    const original = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("qirvexa.projects.v1")),
    );
    assert.equal(original.length, 12);
    assert.equal(
      await page
        .locator(".metrics article")
        .nth(2)
        .locator(".metric-value")
        .innerText(),
      "5",
    );
    const nav = (name) =>
      page
        .locator("aside nav")
        .getByRole("button", { name, exact: true })
        .click();
    await nav("Projects");
    await page.locator(".table-wrap .project-name-link").first().click();
    const url = page.url();
    const projectId = url.split("#projects/")[1];
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await page
      .getByLabel("Task title", { exact: true })
      .fill("Review visual direction");
    await page.locator('select[name="status"]').selectOption("doing");
    await page.locator('select[name="priority"]').selectOption("high");
    await page.locator('input[name="due_date"]').fill("2026-11-03");
    await page.getByRole("button", { name: "Save task", exact: true }).click();
    await page.getByText("Task saved.", { exact: true }).waitFor();
    await page
      .getByRole("button", {
        name: "Edit Review visual direction",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Task title", { exact: true })
      .fill("Review and approve visual direction");
    await page.getByRole("button", { name: "Save task", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Complete Review and approve visual direction",
        exact: true,
      })
      .click();
    await page.getByText("Task updated.", { exact: true }).waitFor();
    assert.equal(
      await page.locator(".task-check").getAttribute("aria-pressed"),
      "true",
    );
    await page.getByRole("tab", { name: "Scope & notes", exact: true }).click();
    await page
      .getByLabel("Project scope", { exact: true })
      .fill("A focused bilingual experience with clear delivery milestones.");
    await page
      .getByLabel("Working notes", { exact: true })
      .fill("Confirm the final content before implementation.");
    await page
      .getByLabel("Project brief", { exact: true })
      .fill("A reviewed brief attached to this specific project.");
    await page
      .getByRole("button", { name: "Save details", exact: true })
      .click();
    await page.getByText("Project details saved.", { exact: true }).waitFor();
    await page.reload();
    await page
      .getByRole("button", {
        name: "Reopen Review and approve visual direction",
        exact: true,
      })
      .waitFor();
    assert.equal(
      page.url().split("#projects/")[1],
      projectId,
      "sample parent IDs must survive reload",
    );
    await page.getByRole("tab", { name: "Scope & notes", exact: true }).click();
    assert.match(
      await page.getByLabel("Working notes", { exact: true }).inputValue(),
      /Confirm the final content/,
    );
    await nav("Clients");
    await page.getByRole("button", { name: "New client", exact: true }).click();
    await page
      .getByLabel("Client name as used in projects", { exact: true })
      .fill(original.find((p) => p.id === projectId).client);
    await page
      .getByLabel("Company (optional)", { exact: true })
      .fill("Example Studio");
    await page
      .getByLabel("Email", { exact: true })
      .fill("contact@example.test");
    await page
      .getByLabel("Relationship notes", { exact: true })
      .fill("Prefers a weekly project update.");
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await page.getByText("Client profile saved.", { exact: true }).waitFor();
    await page.reload();
    const client = original
      .find((p) => p.id === projectId)
      .client.split(" / ")[1];
    await page.locator(".client-entry").filter({ hasText: client }).click();
    assert.equal(
      await page.getByLabel("Email", { exact: true }).inputValue(),
      "contact@example.test",
    );
    await nav("Finances");
    assert.equal(await page.locator(".finance-summary dd").count(), 3);
    await nav("Deadlines");
    await page.locator(".agenda-row").first().click();
    await page.goto(url);
    await page
      .getByRole("button", {
        name: "Reopen Review and approve visual direction",
        exact: true,
      })
      .waitFor();
    await page.getByRole("button", { name: "العربية", exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(output, "desktop.png"),
      fullPage: true,
    });
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width}`,
      );
      if (width === 390)
        await page.screenshot({
          path: path.join(output, "mobile.png"),
          fullPage: true,
        });
    }
    // Existing project identities/data are untouched by child/profile operations.
    const after = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("qirvexa.projects.v1")),
    );
    assert.deepEqual(after, original);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: task create/edit/complete, details/client persistence, stable parent IDs, finance/deadline navigation, RTL 390/820/1440 and zero page errors. No live writes.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
