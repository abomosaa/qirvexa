# Database / قاعدة البيانات

Apply `schema.sql` to a new demo project only. It creates app-prefixed tables with owner-specific RLS and explicit grants. GitHub provider setup is external: create an OAuth app pointing to `https://PROJECT.supabase.co/auth/v1/callback`, enable it in Supabase, and allow each deployed origin in Auth redirect URLs. No SMTP is required for GitHub sign-in. Public frontend keys are not admin credentials.

<div dir="rtl" align="right">

يُطبق schema.sql على مشروع عرض جديد فقط. ينشئ جداول خاصة بالتطبيق بسياسات ملكية لكل مستخدم. دخول GitHub يحتاج تفعيل التطبيق في إعدادات Supabase وإضافة روابط العودة المحلية والمنشورة. لا يحتاج مزود بريد أو نطاقًا مدفوعًا. مفاتيح الواجهة العامة لا تمنح صلاحيات الإدارة.

</div>
