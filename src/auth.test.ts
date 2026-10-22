import { afterEach, describe, expect, it, vi } from "vitest";
import { authErrorMessage, loadAuthOptions } from "./auth";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("public authentication configuration", () => {
  it("only enables explicitly configured providers, never truthy strings or absent flags", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "browser-publishable");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            external: { email: true, google: "false", github: false },
          }),
        ),
      ),
    );
    expect(await loadAuthOptions(new AbortController().signal)).toEqual({
      email: true,
      google: false,
      github: false,
      signup: false,
    });
  });
  it("rejects malformed or failed settings rather than showing unusable OAuth actions", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "browser-publishable");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    );
    await expect(loadAuthOptions(new AbortController().signal)).rejects.toThrow(
      "invalid_settings",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 503 })),
    );
    await expect(loadAuthOptions(new AbortController().signal)).rejects.toThrow(
      "settings_unavailable",
    );
  });
  it("does not expose raw server messages containing tokens or internal details", () => {
    expect(
      authErrorMessage(
        { code: "unknown", message: "SECRET_INTERNAL_DETAIL" },
        false,
      ),
    ).not.toContain("SECRET");
    expect(authErrorMessage({ code: "invalid_credentials" }, false)).toBe(
      "Email or password is incorrect.",
    );
    expect(authErrorMessage({ code: "email_not_confirmed" }, true)).toContain(
      "تأكيد",
    );
  });
});
