export type AuthOptions = {
  email: boolean;
  google: boolean;
  github: boolean;
  signup: boolean;
};
export async function loadAuthOptions(
  signal: AbortSignal,
): Promise<AuthOptions> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("not_configured");
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
    signal,
  });
  if (!response.ok) throw new Error("settings_unavailable");
  const value = await response.json();
  if (!value || typeof value.external !== "object" || !value.external)
    throw new Error("invalid_settings");
  return {
    email: value.external.email === true,
    google: value.external.google === true,
    github: value.external.github === true,
    signup: value.disable_signup === false,
  };
}

export function authErrorMessage(error: unknown, ar: boolean): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, [string, string]> = {
    invalid_credentials: [
      "البريد أو كلمة المرور غير صحيحين.",
      "Email or password is incorrect.",
    ],
    email_not_confirmed: [
      "افتح رسالة تأكيد البريد قبل الدخول.",
      "Confirm your email before signing in.",
    ],
    weak_password: [
      "اختر كلمة مرور أطول وأصعب في التخمين.",
      "Choose a longer, harder-to-guess password.",
    ],
    over_email_send_rate_limit: [
      "وصلنا لحد إرسال الرسائل مؤقتًا. حاول لاحقًا.",
      "Email sending is temporarily limited. Try again later.",
    ],
    over_request_rate_limit: [
      "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.",
      "Too many attempts. Wait a moment and try again.",
    ],
    email_address_not_authorized: [
      "تعذر إرسال رسالة لهذا البريد حاليًا. استخدم طريقة دخول أخرى أو حاول لاحقًا.",
      "Email delivery is unavailable for this address. Use another sign-in method or try later.",
    ],
  };
  const pair = messages[code];
  return pair
    ? pair[ar ? 0 : 1]
    : ar
      ? "تعذر إكمال الطلب. تحقق من الاتصال وحاول مجددًا."
      : "Could not complete the request. Check your connection and try again.";
}
