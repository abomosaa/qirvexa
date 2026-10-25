# Changelog / سجل التغييرات

## 2026-10-25 — Professional operations dashboard / لوحة عمل احترافية

- Rebuilt the dashboard around compact navigation, a sticky top bar, working global project search, four record-derived summaries, a combined value/marked-paid chart and a project-state panel. Velzon informed the information hierarchy; no template code or assets were copied. / إعادة بناء اللوحة بتنقل منظم وبحث سريع فعلي وملخصات ورسم مالي وحالات مشاريع من السجلات، بالاستفادة من ترتيب المرجع دون نسخ شفرته أو أصوله.
- Added working chart periods, top-client value summaries and task progress in project rows, preserving deadlines, project/client editing, CSV export, AI briefs and unsaved-draft guards. / إضافة فترات للرسم وملخص العملاء وتقدم المهام مع الحفاظ على الوظائف والمسودات.
- Added bounded chart, client-value, dialog and confirmation motion with a tested reduced-motion path. Raised new operational labels to at least 12px, action areas to at least 32px and corrected delivery-badge contrast. / إضافة حركة هادفة للرسم والقيم والنوافذ والتأكيد، مع دعم تقليل الحركة وتحسين وضوح النصوص والتباين ومساحات الضغط.
- Passed the production build, 25 unit tests, 54 route/language/viewport checks, guest workspace CRUD and the new dashboard interaction/motion fixture. Fixtures block external requests and make no live database writes. / نجاح البناء و25 اختبارًا و54 فحص تجاوب واختبارات إدارة العمل والبحث والمسودات والحركة دون كتابة في البيانات الحية.

## 2026-10-24 — Deeper workspace / مساحة عمل أعمق

- Added project task CRUD, status/priority/due dates, progress, scope/notes/briefs, client profiles, deadlines and finance views; all old IDs and records preserved. / إضافة مهام وتفاصيل المشروع وملفات العملاء والمواعيد والمتابعة المالية مع حفظ السجلات السابقة.
- Added owner-protected Supabase child tables and composite ownership references; guest storage remains separate. / إضافة جداول محمية بالملكية مع فصل حفظ الضيف عن الحساب.
- Replaced repeated demo chrome with accurate device/account state, compact overview and mobile project cards. / تحسين الواجهة وإزالة تكرار عبارات العرض مع توضيح مكان الحفظ.
- Mutual review found lost unsaved notes and incorrect Home/End behavior; fixed retained forms, separate dirty states and protected navigation, with regression tests. / إصلاح ضياع المسودات والتنقل بلوحة المفاتيح وإضافة فحوص تمنع عودة المشكلة.

## 2026-10-23

- Verified real Google sign-in through Qirvexa and cloud project creation, edit to review, and reload persistence. The cloud workspace began empty without importing guest records; concurrently loading samples preserved the new fictional project. / تأكد دخول Google فعليًا وإنشاء مشروع سحابي وتعديل حالته وبقاؤه بعد إعادة التحميل، دون نقل بيانات الضيف تلقائيًا، مع بقاء المشروع عند تحميل الأمثلة.
- Recorded the shared redirect fix: two trailing-slash origins added, bringing the exact Supabase allowlist to six URLs after Tavoryxa's first callback fell back to Qirvexa. Tavoryxa then passed real Google sign-in, simulated cloud-order reload and guest/local-order separation. Qirvexa sign-out returned to Demo visitor with zero guest search matches for the new cloud project. / توثيق إضافة عنواني الأصل بشرطة مائلة إلى قائمة العودة فأصبحت ستة عناوين دقيقة؛ تأكد دخول المتجر وحفظ طلبه السحابي وعزله عن المحلي، وعادت Qirvexa لوضع الضيف دون ظهور المشروع السحابي في البحث.
- Google is enabled with audience Testing; GitHub remains disabled. Public email signup/reset stays gated while Brevo SMS verification is blocked and deferred pending support. Updated documentation only; no new unit/build run. / Google مفعّل بوضع Testing وGitHub معطّل؛ يظل إرسال البريد محجوبًا مع تأجيل عائق تحقق Brevo إلى الدعم. تحديث توثيق فقط دون إعادة اختبارات البناء والمنطق.

## 2026-10-22

- Added bilingual email/password, signup, forgot-password and verified recovery forms. OAuth buttons follow live provider settings; public email registration/recovery stay gated until SMTP delivery is verified. / إضافة نماذج البريد وإنشاء الحساب والاستعادة باللغتين، مع ربط أزرار المزودين بإعداداتهم الفعلية وبقاء إرسال البريد محجوبًا حتى التحقق.
- Bound password recovery to its verified owner token; a fresh review found and verified the account-switch fix. Nineteen unit tests plus isolated form and prior isolation browser packets pass. / ربط الاستعادة برمز المالك المتحقق منه وإصلاح تبديل الحساب أثناء الطلب؛ نجح 19 اختبارًا واختبارا النماذج والعزل في المتصفح.

- Formatted source and configuration with pinned Prettier 3.9.10, with local and CI format checks. The post-format run passed 12 tests, the frontend build and Worker typecheck; dependency audit found zero vulnerabilities. / تنسيق المصدر والإعدادات بأداة مثبتة الإصدار مع فحص محلي وفي CI؛ نجحت الاختبارات الاثنا عشر والبناء وفحص أنواع Worker بعد التنسيق، ولم يرصد فحص الاعتماديات ثغرات.

## 2026-10-21 — Portfolio prototype / نموذج معرض الأعمال

<div dir="rtl" align="right">

تنفيذ واجهة عربية RTL وإنجليزية، إدارة المشاريع والتصفية والبحث، مؤشرات ورسوم مشتقة من البيانات، تصدير CSV، العملاء والإعدادات. أُضيف حفظ الضيف محليًا ومحرر موجزات مع مثال جاهز موسوم بوضوح.

أُضيف مخطط Supabase بسياسات ملكية وعزل المستخدمين وWorker لطلب موجز محدود من Cloudflare AI. اجتازت فحوص البناء و12 اختبارًا وتجربة الضيف؛ فحوص المصادقة المعزولة تستخدم محاكاة. نُشر التطبيق وفُحص استدلال فعلي من الواجهة. دخول GitHub للزوار ينتظر إعداد مقدم الخدمة.

</div>

- Implemented Arabic RTL/English project CRUD, status/paid tracking, search/date filters, derived charts, CSV export, client rollup, and settings.
- Added local guest persistence, editable/saved briefs, and a labeled prewritten example.
- Added Supabase ownership policies and cloud persistence paths, with stale auth/request guards and explicit cloud errors.
- Added a bounded Cloudflare AI endpoint and rate/input/body guards.
- Recorded passing build/typecheck, 12 tests, guest browser flows, mocked auth isolation, responsive review, and database ownership assertions.
- Captured actual design tokens and reusable component previews. Published on Cloudflare and verified actual Arabic inference through the deployed interface; visitor GitHub OAuth remains pending.
