# Changelog / سجل التغييرات

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
