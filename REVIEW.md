# Review / تقرير المراجعة

## Dashboard redesign acceptance — 2026-10-25 / قبول تصميم اللوحة

The dashboard now uses a compact forest sidebar and sticky top bar, readable independent summaries, a value/marked-paid chart with working period controls, a status breakdown, next-action agenda, client-value ranking and a denser project table with actual task completion. All displayed totals come from filtered project records. “Marked paid” remains a manually stored status, and the chart groups projects by creation month rather than payment receipt date. The guest notice explicitly identifies the fictional sample data and device-only storage.

Validated locally: production build; 25 unit tests; 54 route/language/viewport checks; existing task/project-details/client CRUD and persistence fixture; and `qa/dashboard-redesign.cjs`. The latter checks period counts against actual records, finance/client summary destinations, global project search, cancellation of navigation with unsaved scope text, mobile drawer close in both languages, normal/reduced motion, label/control sizes and delivery-badge contrast. External network requests are blocked and browser data is isolated; these checks do not make live account or database writes. The root also inspected the running Arabic dashboard through the browser.

The final settled screenshot matrix is `.impeccable/review/dashboard-{ar,en}-{390,820,1440}.png` with matching `-viewport.png` captures. New dashboard secondary labels are at least 12px; action areas are at least 32px. A first external audit found a 4.37:1 neutral delivery badge and small labels; both were corrected and the computed-style regression now requires at least 4.5:1 for that badge. Tables retain contained horizontal scrolling at intermediate widths. The source detector ran once and reported advisory token differences against the earlier design documentation; the final design documents record the new system. The production build retains its existing large JavaScript chunk warning.

<div dir="rtl" align="right">

أُعيد ترتيب اللوحة بقائمة جانبية وترويسة ثابتة وملخصات واضحة ورسم مالي وحالات المشاريع والمواعيد والعملاء وجدول مهام عملي. جميع القيم مشتقة من السجلات المصفّاة، وحالة التحصيل يدوية وليست دليل دفع بنكي. يوضح وضع الضيف خيالية بيانات المثال والحفظ المحلي.

نجح البناء و25 اختبارًا و54 فحصًا للمسارات واللغتين وثلاثة أحجام، واختبارات البحث والفترات والتنقل وحماية المسودات وتقليل الحركة. فُحصت مساحات الأزرار وحجم النص والتباين بعد إصلاح ملاحظات المراجعة. الاختبارات معزولة ولا تعدّل البيانات الحية، ولم يُختبر دخول OAuth أو توليد AI حي مجددًا ضمن هذا التغيير.

</div>

## Workspace acceptance — 2026-10-24 / قبول التوسعة

Live Workers AI generated an Arabic brief from a generic fictional studio idea. The lead attached it to the same named cloud test project and verified the saved text after reload; a read-only SQL aggregate confirmed one completed task and one project-details record with a brief. Previous project/order fingerprints still matched. No pre-existing project, amount or order was modified.

Public acceptance found an initial-session routing issue: a project URL stayed in the address bar but auth restoration cleared the selected project. Initial restoration now retains that project ID, while subsequent account switches still clear it; the account-isolation fixture tests both behaviors. A real Google login and cloud task create/complete/reload were verified in the existing named test project. The task persisted; old project rows remained unchanged.

The final responsive packet passed 54 route/language/viewport combinations, including both project tabs. The Impeccable source detector reported zero primary findings and 116 advisories concerning palette/type-ramp documentation; this is not an empty findings array or a claim of complete visual certification. Initial chart animation was disabled so data is visible immediately and captures do not show an incomplete line.

25 source tests and production build passed. Isolated browser packets passed task create/edit/complete, project details and client persistence, stable parent IDs, finance/deadline navigation, new task account-switch isolation, unsaved draft retention/canceled page+AI+hash/client navigation, Home/End, existing authentication races, forms and real-SDK PKCE recovery. Arabic/English layout checks include 390/820/1440px. These fixture runs make no live writes.

The independent store author reproduced loss of an unsaved scope draft and incorrect Home/End behavior. The review completed retained panels, stable empty-details identity, independent task/details dirty states, guarded page/client navigation and a dedicated `qa/workspace-navigation.cjs` regression. All targeted checks passed afterward. Root manually verified task completion/reload in a local guest browser too.

Root applied the additive `qirvexa_workspace_depth` migration and passed seven transaction-rolled-back ownership/integrity assertions. Existing 14 projects, one store order and eight product rows retained identical fingerprints; new tables had no residual test rows. No anonymous SELECT or authenticated TRUNCATE grants on the new tables. The existing Auth leaked-password warning remains; email delivery is still deferred. Cloud frontend acceptance is recorded after deployment separately.

<div dir="rtl" align="right">نجح 25 اختبارًا والبناء وفحوص المتصفح للمشاريع والمهام والعملاء والحسابات والمسودات ولوحة المفاتيح. أُصلح بواسطة المراجعة فقدان المسودات الذي كشفه مراجعة المتجر وأعاد الاختبارات. نجحت فحوص الملكية في قاعدة البيانات مع إلغاء بيانات الاختبار؛ بقيت السجلات السابقة كما هي. لا تعني الفحوص المحلية وحدها التحقق من النسخة المنشورة؛ يضاف دليل النشر مستقلًا.</div>

## Live Google verification — 2026-10-23 / التحقق الفعلي من Google

<div dir="rtl" align="right">

تأكد تسجيل دخول Google فعليًا من واجهة Qirvexa وظهور مساحة العمل السحابية للحساب. بدأت المساحة فارغة دون استيراد سجلات الضيف. أُنشئ المشروع الخيالي «مشروع عرض — دخول Google» بقيمة 1,200 ريال وموعد تسليم 1 نوفمبر 2026، ثم عُدلت حالته إلى «قيد المراجعة» وبقي بعد إعادة التحميل والجلسة مسجلة. حمّل المستخدم الأمثلة أثناء الاختبار وبقي المشروع الذي أُضيف محفوظًا. لم يُسجل بريد صاحب الحساب في هذا التقرير.

نجح تسجيل الخروج من Qirvexa وعادت الواجهة إلى «زائر تجريبي». أعاد البحث عن المشروع السحابي الجديد صفر نتائج في وضع الضيف. تأكد أيضًا دخول Google فعليًا في Tavoryxa بعد تصحيح عنوان العودة، وحفظ طلب سحابي تجريبي وبقاؤه بعد إعادة التحميل؛ عند الخروج ظهرت الطلبات المحلية السابقة وحدها. Google مفعّل وGitHub معطّل. بوابة البريد ما زالت false؛ تعطل إعداد Brevo عند تحقق SMS وأُجّل لحين تواصل المستخدم مع الدعم.

</div>

Verified through the live Qirvexa UI: real Google sign-in, an initially empty owner cloud workspace with no guest import, creation of `مشروع عرض — دخول Google` for a fictional client (1,200 SAR, due 2026-11-01), status changed to review, and persistence after reload while signed in. The user concurrently loaded samples; the newly created project remained present. No account email is recorded here.

Fresh shared-configuration discovery: Tavoryxa's first callback fell back to Qirvexa. The configuration was updated with the trailing-slash origin URL for each demo; the Supabase Auth allowlist now contains six exact URLs (the previous four plus the two slash origins). The corrected Tavoryxa Google round trip then passed: simulated cloud order `#B8290AF4` persisted after reload. On sign-out, only the prior local order `#68DA4835` remained visible, without the new cloud order. These are related store checks, not Qirvexa purchase features. See [the exact redirect entries](supabase/AUTH.md).

Current provider state: Google enabled, GitHub disabled, `VITE_EMAIL_DELIVERY_ENABLED=false`. Brevo setup is blocked at SMS verification and deferred pending user contact with support; no real signup/confirmation/reset delivery is claimed. Google audience remains **Testing**. Google's [identity-only exception](https://support.google.com/cloud/answer/15549945?hl=en) removes the test-list requirement for basic name/email/profile sign-in; this does not establish brand verification or In Production status.

Qirvexa logout/guest return also passed: the UI returned to Demo visitor, and searching for the newly created cloud project returned zero guest matches. Clearing that search restores access to the guest examples. Live screenshots `qirvexa-google-cloud-project.png` and `google-six-redirects.png` are retained in the workspace's research artifacts outside this repository. Real email delivery remains unverified. This was a documentation-only update; the 19 passing tests and build below are historical results, not rerun on 2026-10-23.

## Authentication update — 2026-10-22 / تحديث الحسابات

Historical snapshot; the 2026-10-23 live Google evidence above supersedes its pending OAuth status. / لقطة سابقة؛ نتيجة دخول Google في 23 أكتوبر تحل محل حالة الانتظار أدناه.

Implemented email/password sign-in, signup/confirmation, forgot-password, verified-owner password recovery and configured Google/GitHub actions. `VITE_EMAIL_DELIVERY_ENABLED` remains false until real delivery tests. No live Google/email round trip is claimed. / نُفذت نماذج الحسابات والمزودين، مع إبقاء بوابة البريد معطلة حتى اختبار الإرسال الحقيقي.

Published auth source: `a4057d3`, Cloudflare version `a5471849-2abd-4302-ac7b-4acae725c83d`; [CI run 39772094916](https://github.com/abomosaa/qirvexa/actions/runs/39772094916) passed. The deployed Arabic sign-in/signup views were inspected; Google/GitHub actions are absent while disabled and signup is correctly delivery-gated. Brevo is the selected SMTP provider; account/sender setup and real confirmation/reset delivery remain pending. / نُشرت واجهة الحسابات وفُحصت بوابة التسجيل؛ لم يُختبر دخول حقيقي أو إرسال رسائل بعد.

Passed: 19 unit tests, frontend build/typecheck, Worker typecheck, isolated `qa/auth-forms.cjs`, installed-SDK `qa/auth-pkce.cjs`, and prior `qa/auth-isolation.cjs`. The form packet checks provider flags, spoofed recovery URL, safe errors, signup confirmation/duplicate lock, reset redirect and a fixed-owner recovery write during account switching. All browser credentials/responses are fixtures; no real user/mail/cloud writes are made. New auth captures at 390/820/1440px have no horizontal overflow. / الاختبارات معزولة دون حسابات حقيقية أو إرسال بريد، وفُحص تجاوب النماذج دون تجاوز أفقي.

A fresh reviewer found that singleton `updateUser()` could read a different tab's current session. The recovery mutation now captures the verified owner's bearer before dispatch and the reviewer marked this finding resolved. Impeccable reports advisory palette/type documentation drift; its pre-existing sidecar was not repaired as a side effect of this feature. / أُصلح تبديل الحساب أثناء الاستعادة وأكد المراجع الحل. تنبيهات توثيق الألوان والخطوط إرشادية ولم يُعاد بناء ملف التصميم الجانبي ضمن هذه الميزة.

<div dir="rtl" align="right">

حالة 21 أكتوبر 2026: عرض منشور مع مخطط سحابي مطبّق ومختبر. اختُبر توليد موجز عربي فعلي من الواجهة المنشورة، إضافة إلى اختبارات Worker المعزولة. عزل البيانات لا يثبت اكتمال دخول GitHub؛ تفعيل مقدم الخدمة ما زال معلقًا.

</div>

Snapshot: 2026-10-21. Recorded implementation evidence and remaining external checks:

| Area            | Evidence                                                                                                          | Limit                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Build           | Build and typecheck passed                                                                                        | Local build, not production launch                                             |
| Tests           | 12 Vitest tests passed: six business-data, six Worker boundary                                                    | AI/bindings stubbed                                                            |
| Guest browser   | Create, edit, status + paid, reload, delete, sample-brief save passed                                             | Device-local mode                                                              |
| Auth races      | `qa/auth-isolation.cjs` passed stale-response/account-switch checks                                               | Mocked browser auth, no real OAuth round trip                                  |
| Responsive      | No horizontal page overflow at 390/820/1440px                                                                     | Representative widths                                                          |
| Webforge        | Latest score 99 overall; no high accessibility issues                                                             | Arabic skip-link finding was a false positive; not accessibility certification |
| Impeccable      | Manual detector findings `[]`                                                                                     | Tool metric, not full certification                                            |
| Database        | Both migrations applied to Supabase `ieyjlrgehdhsapnmvyvp`; security advisors `[]`                                | GitHub provider flow still unverified                                          |
| Ownership       | Rollback-transaction assertions passed owner reads and cross-user project/order isolation                         | Database boundary checks, not full cloud sessions                              |
| Shared checkout | Fake unit price ignored; notebook quantity 2 = 14,800 halalas; idempotence and negative-quantity rejection passed | Tavoryxa RPC evidence, not a Qirvexa purchase feature                          |

![Reviewed desktop fold](qa/screenshots/capture/shots/desktop-fold.png)

Public deployment: https://qirvexa.qirvexa.workers.dev . Verification confirmed actual Arabic model output through the published UI, plus a direct authenticated Cloudflare API call recorded in `qa/live-ai.json`. Health alone was not used as proof of inference. Open: configure and verify the visitor GitHub OAuth provider/redirects. Social metadata is intentionally minimal.

Fresh visual review inspected desktop/tablet/mobile images. Its one finding was a missing small-screen chart legend. The legend was restored, the same two screenshots were recaptured, and the reviewer scored that finding resolved; this is a narrow visual verdict, not certification of every application state. / رُوجعت الصور وطلب إبقاء دليل ألوان الرسم على الشاشات الصغيرة. أُصلح ذلك وأُعيد التصوير، وأكد المراجع حل ملاحظته ضمن هذا النطاق.

The Worker limits output to 750 tokens, ideas to 2,000 characters, streamed bodies to 12,000 bytes, and requests to five per IP/minute. It fails explicitly. Vite has no API; Worker testing needs `npm run build` then `npm run dev:worker`.

Guest data remains local and is not uploaded on sign-in. All sample clients, amounts, and the ready-made brief are fictional. Portfolio/CV copy may describe this published prototype and its verified AI integration; real visitor authentication still needs the open provider checks. This evidence does not establish readiness for production accounting.
