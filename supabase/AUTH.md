# Authentication / تسجيل الدخول

<div dir="rtl" align="right">

يدعم المصدر البريد وكلمة المرور، وإنشاء الحساب وتأكيده، واستعادة كلمة المرور، وGoogle وGitHub عند إعداد المزود. الاستعراض دون حساب يظل متاحًا. لا تنتقل بيانات الضيف تلقائيًا إلى حساب سحابي.

**حالة الإعداد:** مزود Email مفعّل مع تأكيد البريد. Google وGitHub غير مفعّلين وقت الفحص. إنشاء حساب بالبريد وإرسال الاستعادة محجوبان حتى ربط SMTP واختبار وصول الرسائل؛ وجود النماذج لا يثبت أن الإرسال أو OAuth يعمل فعليًا.

</div>

The source implements email/password sign-in, signup, password recovery and configured Google/GitHub OAuth. Guest mode stays available and never silently uploads local records. At the recorded configuration check, email and confirmation are enabled, while Google/GitHub are disabled. Public signup/reset delivery and actual OAuth round trips remain external checks.

## Configuration / الإعداد

- Put only the Supabase URL and browser publishable key in ignored `.env.local`.
- Keep `VITE_EMAIL_DELIVERY_ENABLED=false` until real confirmation/reset delivery tests pass. Set it to `true` only after that test, then rebuild and deploy. Confirm email stays ON.
- Supabase default SMTP sends only to project-team addresses and is unsuitable for public signup. Connect a suitable custom SMTP sender. A dedicated Gmail account may use an eligible App Password entered directly into Supabase by its owner; quotas and account restrictions apply. Do not enter the account's ordinary password or share secrets in chat.
- Configure each OAuth provider in Supabase. Google needs a Web OAuth client; use only `openid`, email and profile scopes. The callback is the project's `/auth/v1/callback` URL. The browser never receives Client Secret.
- Allow the exact deployed origin and its `/?auth=recovery` URL in Supabase Auth redirect URLs. Use no broad wildcard just for convenience.
- The browser reads `/auth/v1/settings` with the publishable key, exposing only configured provider actions. An unavailable settings request keeps provider actions closed and permits retry.

<div dir="rtl" align="right">

تُدخل أسرار SMTP وOAuth داخل لوحة Supabase فقط بواسطة صاحب الحساب. تُفعّل بوابة إرسال البريد بعد اختبار فعلي ثم يُعاد البناء. تظهر أزرار المزودين حسب الإعداد الفعلي، لا حسب أسماء مضافة شكليًا. روابط الاستعادة تحتاج عنوان عودة دقيقًا، وتُفتح في المتصفح الذي بدأ طلب الاستعادة.

</div>

## Recovery and isolation / الاستعادة والعزل

An SDK-verified `PASSWORD_RECOVERY` event is latched before React mounts. A URL parameter alone does not authorize password change. The mutation uses an immutable bearer from that verified grant; a cross-tab account switch cannot redirect it to the new account. Sign-out/account changes clear subsequent recovery authorization. Tokens remain in memory and existing SDK session storage, never in application logs or saved form data. Password fields are cleared when the credential task ends/unmounts.

The existing owner-based RLS remains the data boundary for projects and briefs. No schema change or email-confirmation bypass is used for these forms.

Sources: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google), [Google App Passwords](https://support.google.com/accounts/answer/185833).
