# Database / قاعدة البيانات

Apply `schema.sql` to a new demo project only. It creates app-prefixed tables with owner-specific RLS and explicit grants. Authentication uses the existing Supabase client and policies; no schema change is needed for email or Google/GitHub. See [AUTH.md](AUTH.md) for provider, SMTP and recovery setup. Public frontend keys are not admin credentials.

<div dir="rtl" align="right">

يُطبق schema.sql على مشروع عرض جديد فقط. ينشئ جداول خاصة بالتطبيق بسياسات ملكية لكل مستخدم. دخول البريد وGoogle وGitHub يستخدم العميل والسياسات نفسها دون تغيير المخطط؛ إعداد المزودين والبريد والاستعادة موضح في AUTH.md. مفاتيح الواجهة العامة لا تمنح صلاحيات الإدارة.

</div>
