import { supabase } from "./backend";

// Capture the SDK-verified event before React mounts. A URL marker never authorizes recovery.
let recoveryOwner: string | null = null;
let recoveryToken: string | null = null;
const listeners = new Set<() => void>();
function setOwner(owner: string | null) {
  if (owner === recoveryOwner) return;
  recoveryOwner = owner;
  listeners.forEach((listener) => listener());
}
const recoveryListener = supabase?.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    recoveryToken = session?.access_token ?? null;
    setOwner(session?.user.id ?? null);
  } else if (!session || (recoveryOwner && session.user.id !== recoveryOwner)) {
    recoveryToken = null;
    setOwner(null);
  } else if (event === "TOKEN_REFRESHED" && session.user.id === recoveryOwner)
    recoveryToken = session.access_token;
});
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    recoveryListener?.data.subscription.unsubscribe(),
  );
export const getRecoveryOwner = () => recoveryOwner;
export function subscribeRecovery(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function finishRecovery() {
  recoveryToken = null;
  setOwner(null);
  const url = new URL(location.href);
  url.searchParams.delete("auth");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

// Bind the write to the verified grant. A singleton SDK may otherwise read a
// different account after waiting for a lock shared between browser tabs.
export async function updateRecoveryPassword(
  password: string,
  expectedOwner: string,
) {
  const token = recoveryToken;
  if (!token || recoveryOwner !== expectedOwner)
    throw { code: "session_not_found" };
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw { code: "session_not_found" };
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  if (!response.ok)
    throw { code: typeof value?.code === "string" ? value.code : "" };
  if (value?.id !== expectedOwner) throw { code: "session_not_found" };
}
