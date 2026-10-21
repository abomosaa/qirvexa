# Qirvexa

<div dir="rtl" align="right">

لوحة إدارة مشاريع ثنائية اللغة، بالعربية أولًا، مع أداة لتحويل فكرة قصيرة إلى موجز قابل للتعديل. مشروع معرض أعمال بهوية وبيانات خيالية؛ لا تمثل الأرقام إيرادات أو عملاء حقيقيين.

إضافة المشاريع وتعديلها وحذفها، تغيير الحالة والسداد، البحث والتصفية، تصدير CSV، ملخص العملاء ورسوم مشتقة من السجلات المعروضة. يحفظ وضع الضيف التغييرات على هذا الجهاز، ولا يرفعها تسجيل الدخول تلقائيًا.

اجتازت فحوص البناء والمنطق وتجربة الضيف التحقق. طُبّق مخطط Supabase وفُحص عزل المستخدمين. نُشر التطبيق وعمل توليد AI فعلي بالعربية عبر واجهته المنشورة في 21 أكتوبر 2026. تفعيل دخول GitHub للزوار لم يكتمل بعد ويظهر ذلك في الواجهة. المثال الجاهز منفصل وموسوم بأنه مكتوب مسبقًا.

</div>

An Arabic-first, bilingual project dashboard with an editable brief assistant. This portfolio prototype uses fictional identity and records. Project CRUD, status/paid tracking, search/date filters, derived charts, CSV export, client rollup, settings, and saved briefs are implemented. Guest data persists on the device and is not automatically uploaded on sign-in.

Supabase schema and ownership checks are verified. Public deployment and real Arabic AI generation through the published interface were verified on 2026-10-21. Visitor GitHub sign-in remains disabled pending provider setup; the prewritten sample is separately labeled.

[Live demo / العرض المباشر](https://qirvexa.qirvexa.workers.dev) · [Source / المصدر](https://github.com/abomosaa/qirvexa)

![Arabic desktop dashboard](qa/screenshots/capture/shots/desktop-fold.png)

## Run / التشغيل

Use Node.js compatible with Vite 8, then:

```sh
npm ci
npm run dev
```

Vite serves the interface and local demo. It has no Worker API. To exercise `/api/brief`, build and run Wrangler:

```sh
npm run build
npm run dev:worker
```

Cloudflare AI requires an authorized account/binding. A health response proves binding presence, not completed inference.

## Configuration / الإعداد

Copy `.env.example` to ignored `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; never put a service-role key in the frontend. Rebuild after changing Vite variables.

Keep `VITE_GITHUB_AUTH_ENABLED=false` until the Supabase GitHub provider, OAuth app and redirect allowlist are configured and tested. This flow needs no SMTP or purchased domain. See [database setup](supabase/README.md) and [schema](supabase/schema.sql).

The Worker uses `@cf/meta/llama-3.1-8b-instruct-fp8`, with 750 output tokens, a 2,000-character idea limit, a 12,000-byte streamed-body cap, same-origin checks, and five requests per IP per minute. Failures return explicit errors; the prewritten sample never substitutes for model output.

## Verification / التحقق

```sh
npm run typecheck
npm test
npm run build
```

Recorded: 12 passing Vitest tests (six business-data tests, six Worker tests with stubs), browser guest CRUD/status/paid/reload/sample-save checks, mocked auth-race isolation in `qa/auth-isolation.cjs`, and no page overflow at 390/820/1440px. See [REVIEW.md](REVIEW.md) for scope and open checks.

## Reuse / إعادة الاستخدام

React, TypeScript, Vite, Recharts, Lucide, self-hosted IBM Plex fonts, Supabase, and a Cloudflare Worker. Use [DESIGN.md](DESIGN.md) for visual extensions, [PRODUCT.md](PRODUCT.md) for product constraints, and [CHANGELOG.md](CHANGELOG.md) for history. Replace fictional data before real use. This is a published portfolio demo, not a production accounting service. GitHub Actions validates tests/builds; cloud deployment is manual with `npm run build` then `npm run deploy` after authenticating Wrangler.
