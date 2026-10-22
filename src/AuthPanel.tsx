import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, LogIn, Mail } from "lucide-react";
import { supabase } from "./backend";
import { updateRecoveryPassword } from "./authRecovery";
import { authErrorMessage, loadAuthOptions, type AuthOptions } from "./auth";

type Mode = "signin" | "signup" | "forgot";
export default function AuthPanel({
  ar,
  recovery = false,
  recoveryOwner,
  onRecovered,
}: {
  ar: boolean;
  recovery?: boolean;
  recoveryOwner?: string;
  onRecovered: () => void;
}) {
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [lookupError, setLookupError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(
    null,
  );
  const alive = useRef(true),
    locked = useRef(false),
    operation = useRef(0);
  const emailDelivery = import.meta.env.VITE_EMAIL_DELIVERY_ENABLED === "true";
  useEffect(() => {
    let active = true;
    alive.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setLookupError(false);
    loadAuthOptions(controller.signal)
      .then((value) => {
        if (active && !controller.signal.aborted) {
          setOptions(value);
          setLookupError(false);
        }
      })
      .catch(() => {
        if (active) setLookupError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      alive.current = false;
      operation.current++;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [retry]);
  function changeMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirm("");
    setNotice(null);
  }
  const current = (request: number) =>
    alive.current && request === operation.current;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || locked.current) return;
    if (
      !recovery &&
      (!options?.email ||
        (mode !== "signin" &&
          (!emailDelivery || (mode === "signup" && !options.signup))))
    )
      return;
    if (
      (recovery || mode === "signup") &&
      (password.length < 10 || password !== confirm)
    ) {
      setNotice({
        error: true,
        text: t(
          "استخدم 10 أحرف على الأقل، وأدخل كلمة المرور نفسها في الحقلين.",
          "Use at least 10 characters and enter the same password in both fields.",
        ),
      });
      return;
    }
    locked.current = true;
    setPending(true);
    setNotice(null);
    const request = ++operation.current;
    try {
      const result = recovery
        ? await updateRecoveryPassword(password, recoveryOwner ?? "").then(
            () => ({ error: null }),
          )
        : mode === "signin"
          ? await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })
          : mode === "signup"
            ? await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: { emailRedirectTo: location.origin },
              })
            : await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${location.origin}/?auth=recovery`,
              });
      if (!current(request)) return;
      if (result.error) throw result.error;
      setPassword("");
      setConfirm("");
      if (recovery) onRecovered();
      else if (mode !== "signin")
        setNotice({
          error: false,
          text:
            mode === "signup"
              ? t(
                  "إذا كان البريد متاحًا للتسجيل، ستصلك رسالة تأكيد. افتحها ثم سجّل الدخول.",
                  "If this email can be registered, a confirmation message will arrive. Open it, then sign in.",
                )
              : t(
                  "إذا وُجد حساب بهذا البريد، ستصلك رسالة لاستعادة كلمة المرور.",
                  "If an account exists for this email, a password reset message will arrive.",
                ),
        });
    } catch (error) {
      if (current(request))
        setNotice({ error: true, text: authErrorMessage(error, ar) });
    } finally {
      if (current(request)) {
        locked.current = false;
        setPending(false);
      }
    }
  }
  async function oauth(provider: "google" | "github") {
    if (!supabase || !options?.[provider] || locked.current) return;
    locked.current = true;
    setPending(true);
    setNotice(null);
    const request = ++operation.current;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: location.origin },
      });
      if (error) throw error;
    } catch (error) {
      if (current(request))
        setNotice({ error: true, text: authErrorMessage(error, ar) });
    } finally {
      if (current(request)) {
        locked.current = false;
        setPending(false);
      }
    }
  }
  if (!supabase)
    return (
      <p className="help-text">
        {t(
          "الحسابات غير متاحة حاليًا. يمكنك متابعة وضع العرض.",
          "Accounts are unavailable right now. You can continue with the demo.",
        )}
      </p>
    );
  const emailBlocked =
    !recovery &&
    (!options?.email ||
      (mode !== "signin" &&
        (!emailDelivery || (mode === "signup" && !options.signup))));
  return (
    <div className="auth-panel" aria-busy={pending}>
      <h3 id="auth-heading" tabIndex={-1}>
        {recovery
          ? t("كلمة مرور جديدة", "Choose a new password")
          : t("ادخل إلى مساحة عملك", "Sign in to your workspace")}
      </h3>
      {!recovery && (options?.google || options?.github) && (
        <div className="auth-providers">
          {options.google && (
            <button
              className="secondary"
              disabled={pending}
              onClick={() => oauth("google")}
            >
              <GoogleMark />
              {t("المتابعة باستخدام Google", "Continue with Google")}
            </button>
          )}
          {options.github && (
            <button
              className="secondary"
              disabled={pending}
              onClick={() => oauth("github")}
            >
              <LogIn />
              {t("المتابعة باستخدام GitHub", "Continue with GitHub")}
            </button>
          )}
          <p>{t("أو استخدم بريدك الإلكتروني", "Or use your email")}</p>
        </div>
      )}
      {!recovery && (
        <div
          className="auth-modes"
          aria-label={t("خيارات الحساب", "Account options")}
        >
          <button
            type="button"
            className="text-button"
            aria-pressed={mode === "signin"}
            disabled={pending}
            onClick={() => changeMode("signin")}
          >
            {t("تسجيل الدخول", "Sign in")}
          </button>
          <button
            type="button"
            className="text-button"
            aria-pressed={mode === "signup"}
            disabled={pending}
            onClick={() => changeMode("signup")}
          >
            {t("إنشاء حساب", "Create account")}
          </button>
        </div>
      )}
      {lookupError && !recovery && (
        <p className="auth-feedback" role="status">
          {t(
            "تعذر تحميل طرق الدخول. تحقق من الاتصال.",
            "Could not load sign-in methods. Check your connection.",
          )}{" "}
          <button
            className="text-button"
            onClick={() => setRetry((value) => value + 1)}
            disabled={pending}
          >
            {t("إعادة المحاولة", "Retry")}
          </button>
        </p>
      )}
      {!options && !lookupError && !recovery && (
        <p role="status" className="help-text">
          {t("جارٍ تحميل طرق الدخول…", "Loading sign-in methods…")}
        </p>
      )}
      <form className="auth-form" onSubmit={submit}>
        {!recovery && (
          <label>
            {t("البريد الإلكتروني", "Email address")}
            <input
              type="email"
              name="email"
              autoComplete="email"
              dir="ltr"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
            />
          </label>
        )}
        {(recovery || mode !== "forgot") && (
          <label>
            {recovery
              ? t("كلمة المرور الجديدة", "New password")
              : t("كلمة المرور", "Password")}
            <input
              type="password"
              name="password"
              autoComplete={
                mode === "signup" || recovery
                  ? "new-password"
                  : "current-password"
              }
              minLength={mode === "signup" || recovery ? 10 : 1}
              maxLength={256}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
            />
          </label>
        )}
        {(recovery || mode === "signup") && (
          <>
            <label>
              {t("تأكيد كلمة المرور", "Confirm password")}
              <input
                type="password"
                name="confirm"
                autoComplete="new-password"
                minLength={10}
                maxLength={256}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={pending}
              />
            </label>
            <p className="help-text">
              {t(
                "10 أحرف على الأقل. استخدم كلمة مرور لا تستعملها في حساب آخر.",
                "At least 10 characters. Use a password you do not use for another account.",
              )}
            </p>
          </>
        )}
        {emailBlocked && options && (
          <p className="help-text">
            {mode === "signin"
              ? t(
                  "الدخول بالبريد غير متاح حاليًا.",
                  "Email sign-in is currently unavailable.",
                )
              : t(
                  "التسجيل بالبريد واستعادة كلمة المرور غير متاحين حاليًا. يمكنك متابعة وضع العرض.",
                  "Email registration and password recovery are temporarily unavailable. You can continue with the demo.",
                )}
          </p>
        )}
        {notice && (
          <p
            className={`auth-feedback${notice.error ? " auth-error" : ""}`}
            role={notice.error ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
        <button type="submit" disabled={pending || emailBlocked}>
          {pending ? (
            <LoaderCircle className="spin" />
          ) : mode === "forgot" ? (
            <Mail />
          ) : (
            <LogIn />
          )}
          {pending
            ? t("جارٍ التنفيذ…", "Working…")
            : recovery
              ? t("حفظ كلمة المرور", "Save password")
              : mode === "signup"
                ? t("إنشاء الحساب", "Create account")
                : mode === "forgot"
                  ? t("إرسال رابط الاستعادة", "Send reset link")
                  : t("تسجيل الدخول", "Sign in")}
        </button>
        {!recovery && mode !== "forgot" && (
          <button
            className="text-button"
            type="button"
            disabled={pending}
            onClick={() => changeMode("forgot")}
          >
            {t("نسيت كلمة المرور؟", "Forgot password?")}
          </button>
        )}
        {!recovery && mode === "forgot" && (
          <button
            className="text-button"
            type="button"
            disabled={pending}
            onClick={() => changeMode("signin")}
          >
            {t("العودة لتسجيل الدخول", "Back to sign in")}
          </button>
        )}
      </form>
    </div>
  );
}
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.61 4.61 0 0 1-1.99 3.03v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.39l-3.23-2.52c-.9.6-2.04.96-3.39.96-2.61 0-4.82-1.76-5.61-4.12H3.05v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93a6.01 6.01 0 0 1 0-3.86v-2.6H3.05a10 10 0 0 0 0 9.06l3.34-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.52l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.95 5.47l3.34 2.6A5.99 5.99 0 0 1 12 5.95Z"
      />
    </svg>
  );
}
