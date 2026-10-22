import { afterEach, beforeEach, expect, it, vi } from "vitest";
const capture = vi.hoisted(() => ({
  handler: null as
    | null
    | ((
        event: string,
        session: { user: { id: string }; access_token?: string } | null,
      ) => void),
}));
vi.mock("./backend", () => ({
  supabase: {
    auth: {
      onAuthStateChange(handler: typeof capture.handler) {
        capture.handler = handler;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  },
}));
import {
  getRecoveryOwner,
  subscribeRecovery,
  updateRecoveryPassword,
} from "./authRecovery";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
beforeEach(() => capture.handler?.("SIGNED_OUT", null));
it("does not authorize password recovery for a normal restored/sign-in session", () => {
  capture.handler?.("INITIAL_SESSION", { user: { id: "owner-a" } });
  capture.handler?.("SIGNED_IN", { user: { id: "owner-a" } });
  expect(getRecoveryOwner()).toBeNull();
});
it("retains an SDK-verified recovery event before the view subscribes", () => {
  capture.handler?.("PASSWORD_RECOVERY", { user: { id: "owner-a" } });
  expect(getRecoveryOwner()).toBe("owner-a");
  const listener = vi.fn();
  const unsubscribe = subscribeRecovery(listener);
  capture.handler?.("TOKEN_REFRESHED", { user: { id: "owner-a" } });
  expect(listener).not.toHaveBeenCalled();
  unsubscribe();
});
it("revokes the recovery view on account switch or sign-out", () => {
  capture.handler?.("PASSWORD_RECOVERY", { user: { id: "owner-a" } });
  capture.handler?.("SIGNED_IN", { user: { id: "owner-b" } });
  expect(getRecoveryOwner()).toBeNull();
  capture.handler?.("PASSWORD_RECOVERY", { user: { id: "owner-b" } });
  capture.handler?.("SIGNED_OUT", null);
  expect(getRecoveryOwner()).toBeNull();
});

it("binds a password mutation to the recovery grant even if another account signs in during dispatch", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-key");
  capture.handler?.("PASSWORD_RECOVERY", {
    user: { id: "owner-a" },
    access_token: "fixture-token-a",
  });
  const request = vi.fn((_url: string, init: RequestInit) => {
    capture.handler?.("SIGNED_IN", { user: { id: "owner-b" } });
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer fixture-token-a",
    );
    return Promise.resolve(new Response(JSON.stringify({ id: "owner-a" })));
  });
  vi.stubGlobal("fetch", request);
  await updateRecoveryPassword("FixturePasswordOnly", "owner-a");
  await expect(
    updateRecoveryPassword("FixturePasswordOnly", "owner-a"),
  ).rejects.toEqual({ code: "session_not_found" });
  expect(request).toHaveBeenCalledTimes(1);
});
