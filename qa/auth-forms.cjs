// Isolated form regressions. All auth modules/endpoints are browser fixtures;
// no real users, credentials, messages or cloud writes are created.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/src/backend.ts", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `
      const listeners = new Set(); window.__authCalls = []; window.__owner = null;
      window.__emit = (event,session) => {window.__owner=session?.user.id??null;listeners.forEach(cb=>cb(event,session));};
      export const supabase = {auth:{
        getSession:async()=>({data:{session:null},error:null}),
        onAuthStateChange:cb=>{listeners.add(cb);return{data:{subscription:{unsubscribe(){listeners.delete(cb)}}}}},
        signInWithPassword:async input=>{window.__authCalls.push(['signin',input]);return{error:{code:'invalid_credentials',message:'DO_NOT_DISPLAY_RAW_SERVER_DETAIL'}}},
        signUp: input=>{window.__authCalls.push(['signup',input]);return new Promise(resolve=>window.__finishSignup=()=>resolve({data:{session:null},error:null}));},
        resetPasswordForEmail:async(email,options)=>{window.__authCalls.push(['reset',email,options]);return{error:null}},
        signInWithOAuth:async input=>{window.__authCalls.push(['oauth',input]);return{error:null}},
        signOut:async()=>{window.__emit('SIGNED_OUT',null);return{error:null}}
      },from:()=>({select:()=>({order:()=>{const promise=Promise.resolve({data:[],error:null});promise.limit=()=>promise;return promise;}})})};
    `,
      }),
    );
    await page.route("**/auth/v1/settings", (route) =>
      route.fulfill({
        json: {
          external: { email: true, google: true, github: false },
          disable_signup: false,
        },
      }),
    );
    // Enable mail controls only in this intercepted test module, never in a
    // deployed env or real service. Exercise delivery-gated branches with stubs.
    await page.route("**/src/AuthPanel.tsx*", async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      const body = source.replace(
        /const emailDelivery = [^;]+;/,
        "const emailDelivery = true;",
      );
      assert.notEqual(
        body,
        source,
        "QA must explicitly enable only its stubbed mail controls",
      );
      await route.fulfill({ response, body });
    });
    await page.goto(
      `${process.env.BASE_URL || "http://127.0.0.1:5173"}/?auth=recovery#settings`,
    );
    await page.getByRole("button", { name: "English", exact: true }).click();
    const panel = page.locator(".auth-panel"),
      form = panel.locator("form");
    await panel
      .getByRole("button", { name: "Continue with Google", exact: true })
      .waitFor();
    assert.equal(
      await panel
        .getByRole("button", { name: "Continue with GitHub", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await panel
        .getByRole("heading", { name: "Choose a new password", exact: true })
        .count(),
      0,
      "URL marker alone cannot authorize recovery",
    );
    await panel
      .getByRole("button", { name: "Continue with Google", exact: true })
      .click();
    assert.equal(
      await page.evaluate(() => window.__authCalls[0][1].provider),
      "google",
    );
    await form
      .getByLabel("Email address", { exact: true })
      .fill("demo@example.test");
    await form
      .getByLabel("Password", { exact: true })
      .fill("FixturePasswordOnly");
    await form.locator("button[type=submit]").click();
    await form.getByRole("alert").waitFor();
    assert.match(
      await form.getByRole("alert").innerText(),
      /Email or password is incorrect/,
    );
    assert.doesNotMatch(await form.innerText(), /DO_NOT_DISPLAY/);
    await panel
      .locator(".auth-modes")
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await form
      .getByLabel("Password", { exact: true })
      .fill("FixturePasswordOnly");
    await form
      .getByLabel("Confirm password", { exact: true })
      .fill("DifferentFixtureOnly");
    await form.locator("button[type=submit]").click();
    assert.equal(
      await page.evaluate(
        () => window.__authCalls.filter((call) => call[0] === "signup").length,
      ),
      0,
    );
    await form
      .getByLabel("Confirm password", { exact: true })
      .fill("FixturePasswordOnly");
    await form.locator("button[type=submit]").click();
    await page.waitForFunction(() => window.__finishSignup);
    assert.equal(await form.locator("button[type=submit]").isDisabled(), true);
    await page.evaluate(() => window.__finishSignup());
    await form
      .getByText(
        "If this email can be registered, a confirmation message will arrive. Open it, then sign in.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await form.getByLabel("Password", { exact: true }).inputValue(),
      "",
    );
    await panel
      .getByRole("button", { name: "Forgot password?", exact: true })
      .click();
    await form.locator("button[type=submit]").click();
    await form
      .getByText(
        "If an account exists for this email, a password reset message will arrive.",
        { exact: true },
      )
      .waitFor();
    const redirect = await page.evaluate(
      () =>
        window.__authCalls.find((call) => call[0] === "reset")[2].redirectTo,
    );
    assert.equal(redirect, new URL("/?auth=recovery", page.url()).href);
    let bearer = null;
    await page.route("**/auth/v1/user", async (route) => {
      bearer = route.request().headers().authorization;
      await page.evaluate(() =>
        window.__emit("SIGNED_IN", {
          user: { id: "owner-b", email: "b@example.test" },
          access_token: "fixture-token-b",
        }),
      );
      await route.fulfill({ json: { id: "owner-a" } });
    });
    await page.evaluate(() =>
      window.__emit("PASSWORD_RECOVERY", {
        user: { id: "owner-a", email: "a@example.test" },
        access_token: "fixture-token-a",
      }),
    );
    await page
      .getByRole("heading", { name: "Choose a new password", exact: true })
      .waitFor();
    await page
      .getByLabel("New password", { exact: true })
      .fill("NewFixturePasswordOnly");
    await page
      .getByLabel("Confirm password", { exact: true })
      .fill("NewFixturePasswordOnly");
    await page
      .getByRole("button", { name: "Save password", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "b@example.test", exact: true })
      .waitFor();
    assert.equal(
      bearer,
      "Bearer fixture-token-a",
      "password write must remain bound to recovered owner A",
    );
    assert.equal(
      await page
        .getByRole("heading", { name: "Choose a new password", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: configured providers, URL recovery denial, password errors, signup confirmation/validation/lock, reset redirect and account-bound recovery write. No live auth calls.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
