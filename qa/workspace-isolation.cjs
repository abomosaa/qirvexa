// New child-record race guard; all backend operations are isolated browser fixtures.
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
      const listeners=new Set();
      const session=id=>({user:{id,email:id+'@example.test'},access_token:'fixture-only'});
      window.__emit=id=>listeners.forEach(cb=>cb(id?'SIGNED_IN':'SIGNED_OUT',id?session(id):null));
      const project=id=>({id:'project-'+id,user_id:id,name:'Project '+id,client:'Client '+id,category:'web',status:'active',amount:100,paid:false,due_date:'2026-12-01',created_at:new Date().toISOString()});
      export const supabase={auth:{getSession:async()=>({data:{session:session('A')},error:null}),onAuthStateChange:cb=>{listeners.add(cb);return{data:{subscription:{unsubscribe:()=>listeners.delete(cb)}}}}},from:table=>{
        let owner='';const result=()=>Promise.resolve({data:table==='qirvexa_projects'?[project(owner)]:[],error:null});
        const query={select:()=>query,eq:(column,value)=>{if(column==='user_id')owner=value;return query},order:()=>query,range:result,limit:result,
          upsert:record=>({select:()=>({single:()=>new Promise(resolve=>{window.__taskPayload=record;window.__finishTask=()=>resolve({data:record,error:null})})})})};return query;
      }};
    `,
      }),
    );
    await page.goto(
      (process.env.BASE_URL || "http://127.0.0.1:5173") +
        "/#projects/project-A",
    );
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page.locator(".project-summary").waitFor();
    assert.equal(
      await page
        .getByRole("heading", { name: "Project A", exact: true })
        .count(),
      1,
      "initial account restoration preserves an owned project deep link",
    );
    const open = async (id) => {
      await page
        .locator("aside nav")
        .getByRole("button", { name: "Projects", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Project " + id, exact: true })
        .click();
    };
    const add = async (title) => {
      await page.getByRole("button", { name: "Add task", exact: true }).click();
      await page.getByLabel("Task title", { exact: true }).fill(title);
      await page
        .getByRole("button", { name: "Save task", exact: true })
        .click();
      await page.waitForFunction(
        (title) => window.__taskPayload?.title === title,
        title,
      );
    };
    await open("A");
    await add("Private A pending task");
    assert.equal(await page.evaluate(() => window.__taskPayload.user_id), "A");
    await page.evaluate(() => window.__emit("B"));
    await page
      .getByRole("button", { name: "Project B", exact: true })
      .waitFor();
    await page.evaluate(() => window.__finishTask());
    await open("B");
    assert.equal(
      await page.getByText("Private A pending task", { exact: true }).count(),
      0,
    );
    await add("Private B current task");
    assert.equal(await page.evaluate(() => window.__taskPayload.user_id), "B");
    await page.evaluate(() => window.__finishTask());
    await page.getByText("Task saved.", { exact: true }).waitFor();
    await page.getByText("Private B current task", { exact: true }).waitFor();
    await page.evaluate(() => window.__emit(null));
    await page
      .locator(".storage-label")
      .filter({ hasText: "On this device" })
      .waitFor();
    assert.equal(
      await page.getByText("Private B current task", { exact: true }).count(),
      0,
    );
    const local = await page.evaluate(() =>
      localStorage.getItem("qirvexa.workspace.v1"),
    );
    assert.ok(!local || !local.includes("Private B current task"));
    assert.deepEqual(errors, []);
    console.log(
      "PASS: new task write bound to owner, late A result excluded from B, B write still usable, cloud children never copied to guest storage. Fixtures only.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
