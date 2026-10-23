# Authentication / تسجيل الدخول

<div dir="rtl" align="right">

يدعم المصدر البريد وكلمة المرور، وإنشاء الحساب وتأكيده، واستعادة كلمة المرور، وGoogle وGitHub عند إعداد المزود. الاستعراض دون حساب يظل متاحًا. لا تنتقل بيانات الضيف تلقائيًا إلى حساب سحابي.

**حالة 23 أكتوبر 2026:** مزود Email مفعّل مع تأكيد البريد. Google مفعّل وتأكد دخوله فعليًا في Qirvexa مع حفظ مشروع سحابي وتعديله وبقائه بعد إعادة التحميل، ثم الخروج لوضع الضيف دون ظهور المشروع السحابي في البحث؛ GitHub معطّل. تأكد أيضًا دخول Tavoryxa بعد تصحيح عنوان العودة وحفظ طلب سحابي تجريبي وعزله عن الطلبات المحلية عند الخروج. إنشاء حساب بالبريد وإرسال الاستعادة محجوبان، وتعطل إعداد Brevo عند تحقق SMS وأُجّل لحين تواصل المستخدم مع الدعم.

</div>

The source implements email/password sign-in, signup, password recovery and configured Google/GitHub OAuth. Guest mode stays available and never silently uploads local records. As of 2026-10-23, email/confirmation and Google are enabled; GitHub is disabled. Qirvexa's real Google sign-in, cloud project create/edit/reload and logout/guest-return checks passed. Tavoryxa's corrected Google callback, simulated cloud-order reload and logout/local-order separation also passed. Public signup/reset delivery remains gated. Brevo SMS verification is blocked and deferred pending user contact with support.

## Configuration / الإعداد

- Put only the Supabase URL and browser publishable key in ignored `.env.local`.
- Keep `VITE_EMAIL_DELIVERY_ENABLED=false` until real confirmation/reset delivery tests pass. Set it to `true` only after that test, then rebuild and deploy. Confirm email stays ON.
- Supabase default SMTP sends only to project-team addresses and is unsuitable for public signup. The selected custom sender is Brevo Free (300 emails/day). Use `smtp-relay.brevo.com`, port `587`, the account's SMTP login and an SMTP key (not an API key), entered directly in Supabase by its owner. Verify the sender and transactional activation first. Free-email sender addresses can be temporarily rewritten to a Brevo domain; actual delivery must still be tested. Never share credentials in chat.
- Configure each OAuth provider in Supabase. Google needs a Web OAuth client; use only `openid`, email and profile scopes. The callback is the project's `/auth/v1/callback` URL. The browser never receives Client Secret.
- Allow exact deployed bare origins, trailing-slash origins and `/?auth=recovery` URLs in Supabase Auth redirect URLs. Use no broad wildcard just for convenience. The shared allowlist currently contains the six entries listed below.
- The browser reads `/auth/v1/settings` with the publishable key, exposing only configured provider actions. An unavailable settings request keeps provider actions closed and permits retry.

<div dir="rtl" align="right">

تُدخل أسرار SMTP وOAuth داخل لوحة Supabase فقط بواسطة صاحب الحساب. تُفعّل بوابة إرسال البريد بعد اختبار فعلي ثم يُعاد البناء. تظهر أزرار المزودين حسب الإعداد الفعلي، لا حسب أسماء مضافة شكليًا. روابط الاستعادة تحتاج عنوان عودة دقيقًا، وتُفتح في المتصفح الذي بدأ طلب الاستعادة.

</div>

## Google and redirect snapshot — 2026-10-23

Google audience remains **Testing**, not In Production, with no brand-verification claim. Only basic identity scopes are intended. Google's [documented identity exception](https://support.google.com/cloud/answer/15549945?hl=en) permits users outside the test list for name/email/profile-only requests; additional scopes would require reassessment.

The main agent discovered that Tavoryxa's first Google callback fell back to Qirvexa. Adding each trailing-slash origin changed the shared Supabase Auth redirect allowlist from four exact entries to six:

```text
https://qirvexa.qirvexa.workers.dev
https://qirvexa.qirvexa.workers.dev/
https://qirvexa.qirvexa.workers.dev/?auth=recovery
https://tavoryxa.qirvexa.workers.dev
https://tavoryxa.qirvexa.workers.dev/
https://tavoryxa.qirvexa.workers.dev/?auth=recovery
```

The corrected Tavoryxa flow passed a real Google round trip and simulated cloud-order reload. Signing out showed only the prior guest/local order, without the new cloud order. Qirvexa logout returned to Demo visitor; searching for the newly created cloud project returned zero guest matches. These checks establish the observed owner/guest transitions in both demos; real email confirmation/reset delivery remains unverified.

## Recovery and isolation / الاستعادة والعزل

An SDK-verified `PASSWORD_RECOVERY` event is latched before React mounts. A URL parameter alone does not authorize password change. The mutation uses an immutable bearer from that verified grant; a cross-tab account switch cannot redirect it to the new account. Sign-out/account changes clear subsequent recovery authorization. Tokens remain in memory and existing SDK session storage, never in application logs or saved form data. Password fields are cleared when the credential task ends/unmounts.

The existing owner-based RLS remains the data boundary for projects and briefs. No schema change or email-confirmation bypass is used for these forms.

اختير Brevo المجاني بحد 300 رسالة يوميًا. يبقى إرسال التسجيل والاستعادة مغلقًا حتى توثيق المرسل وربط SMTP واختبار وصول الرسالتين فعليًا؛ قد يستبدل Brevo عنوان المرسل المجاني مؤقتًا بعنوان من نطاقه.

Sources: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google), [Brevo SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP), [Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan).
