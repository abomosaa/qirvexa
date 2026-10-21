# Changelog / سجل التغييرات

## 2026-10-22

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
