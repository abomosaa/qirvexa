// Isolated browser regression: replaces only the browser's Supabase module.
// No fixture users or writes are sent to a live cloud service.
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
        body: `
 const wait=key=>new Promise(resolve=>window[key]=resolve);
 window.__fixtures={};
 const rows=table=>({data:table==='qirvexa_projects'?(window.__fixtures[window.__owner]||[]):[],error:null});
 export const supabase={auth:{getSession:()=>wait('__initial'),onAuthStateChange:cb=>{window.__auth=(e,s)=>{window.__owner=s?.user.id||null;cb(e,s)};return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>({error:null})},from:table=>({
 select:()=>({order:()=>{const p=Promise.resolve(rows(table));p.limit=()=>p;return p}}),
 upsert:record=>{window.__projectRecord=record;return{select:()=>({single:()=>wait('__saveProject')})}},
 delete:()=>({eq:()=>wait('__deleteProject')}),
 insert:record=>{window.__insertRecord=record;return{select:()=>Array.isArray(record)?wait('__seedProjects'):{single:()=>wait('__saveBrief')}}}
 })};
 `,
      }),
    );
    await page.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
    await page.waitForFunction(() => window.__auth && window.__initial);
    const session = (id) => ({
      user: { id, email: `${id}@example.test` },
      access_token: "browser-only-stub",
    });
    const a = session("user-a"),
      b = session("user-b");
    async function auth(s, fixtures = []) {
      await page.evaluate(
        ({ s, fixtures }) => {
          if (s) window.__fixtures[s.user.id] = fixtures;
          window.__auth(s ? "SIGNED_IN" : "SIGNED_OUT", s);
        },
        { s, fixtures },
      );
      await page.waitForTimeout(70);
    }
    async function nav(label) {
      await page
        .locator("aside nav")
        .getByRole("button", { name: label, exact: false })
        .click();
    }
    const record = {
      id: "00000000-0000-4000-8000-000000000001",
      user_id: "user-a",
      name: "Private A record",
      client: "Private client",
      category: "web",
      status: "active",
      amount: 100,
      paid: false,
      due_date: "2026-12-01",
      created_at: new Date().toISOString(),
    };
    // A late restored session must not overwrite a newer sign-in event.
    await auth(b);
    await page.evaluate(
      (a) => window.__initial({ data: { session: a }, error: null }),
      a,
    );
    await nav("الحساب والإعدادات");
    await page.getByText("user-b@example.test", { exact: true }).waitFor();
    // A project save result must not populate another account or reopen its dialog.
    await auth(a);
    await nav("المشاريع");
    await page.getByRole("button", { name: "مشروع جديد", exact: true }).click();
    await page.locator("dialog input[name=name]").fill("Private A record");
    await page.locator("dialog input[name=client]").fill("Private client");
    await page.locator("dialog input[name=amount]").fill("100");
    await page.locator("dialog input[name=due_date]").fill("2026-12-01");
    await page
      .locator("dialog")
      .getByRole("button", { name: "حفظ المشروع", exact: true })
      .click();
    await page.waitForFunction(() => window.__saveProject);
    await auth(b);
    await page.evaluate(
      (record) => window.__saveProject({ data: record, error: null }),
      record,
    );
    await page.waitForTimeout(70);
    assert.equal(
      await page.getByText("Private A record", { exact: true }).count(),
      0,
    );
    assert.equal(await page.locator("dialog").count(), 0);
    // Loading examples under A must not append them under B.
    await auth(a);
    await page
      .getByRole("button", { name: "تحميل بيانات مثال", exact: true })
      .click();
    await page.waitForFunction(() => window.__seedProjects);
    await auth(b);
    await page.evaluate(
      (record) => window.__seedProjects({ data: [record], error: null }),
      record,
    );
    await page.waitForTimeout(70);
    assert.equal(
      await page.getByText("Private A record", { exact: true }).count(),
      0,
    );
    // A deletion completing after account change must not clear the next account's busy save.
    await auth(a, [record]);
    await page
      .getByRole("button", { name: "حذف Private A record", exact: true })
      .click();
    await page
      .locator("dialog")
      .getByRole("button", { name: "حذف المشروع", exact: true })
      .click();
    await page.waitForFunction(() => window.__deleteProject);
    await auth(b);
    await page.getByRole("button", { name: "مشروع جديد", exact: true }).click();
    await page.locator("dialog input[name=name]").fill("B pending");
    await page.locator("dialog input[name=client]").fill("B client");
    await page.locator("dialog input[name=amount]").fill("200");
    await page.locator("dialog input[name=due_date]").fill("2026-12-01");
    await page
      .locator("dialog")
      .getByRole("button", { name: "حفظ المشروع", exact: true })
      .click();
    await page.evaluate(() => window.__deleteProject({ error: null }));
    await page.waitForTimeout(70);
    assert.equal(
      await page
        .locator("dialog")
        .getByRole("button", { name: "حفظ المشروع", exact: true })
        .isDisabled(),
      true,
    );
    await auth(a); // Invalidates B's still-pending save and closes its dialog.
    // Private saved briefs cannot reappear under another account.
    await nav("مساعد الموجز");
    await page
      .getByRole("button", { name: "افتح مثالًا جاهزًا", exact: true })
      .click();
    await page.getByRole("button", { name: "حفظ الموجز", exact: true }).click();
    await page.waitForFunction(() => window.__saveBrief);
    await auth(b);
    await page.evaluate(() =>
      window.__saveBrief({
        data: {
          id: "private-a-brief",
          title: "Private A brief",
          content: "Private A content",
          created_at: new Date().toISOString(),
        },
        error: null,
      }),
    );
    await page.waitForTimeout(70);
    assert.equal(await page.locator(".saved-brief").count(), 0);
    assert.equal(await page.locator("#brief").count(), 0);
    // AI responses and private prompts cannot cross an auth transition.
    let pendingAI;
    await page.route("**/api/brief", (route) => {
      pendingAI = route;
    });
    await auth(a);
    await page
      .locator("#idea")
      .fill("Private A project idea with sufficient detail");
    await page
      .getByRole("button", {
        name: "أنشئ موجزًا بالذكاء الاصطناعي",
        exact: true,
      })
      .click();
    for (let i = 0; i < 100 && !pendingAI; i++) await page.waitForTimeout(10);
    assert.ok(pendingAI, "AI request missing");
    await auth(b);
    await pendingAI.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ brief: "Private A generated brief" }),
    });
    await page.waitForTimeout(70);
    assert.equal(await page.locator("#brief").count(), 0);
    assert.equal(await page.locator("#idea").inputValue(), "");
    assert.deepEqual(errors, []);
    console.log(
      "Qirvexa auth isolation passed: late restore, save/delete/seed/brief races and AI result after account change; zero page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
