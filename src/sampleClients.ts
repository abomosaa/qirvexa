import type { ClientProfile } from "./workspaceModel";

// Illustrative contacts: reserved example.com mailboxes and masked, non-dialable phones.
export function sampleClients(): ClientProfile[] {
  return [
    [
      "صالح الزهراني",
      "Saleh Alzahrani",
      "مدار للتصميم",
      "saleh.alzahrani",
      "الرياض · هوية بصرية وموقع تعريفي",
    ],
    [
      "نورة القحطاني",
      "Noura Alqahtani",
      "استوديو ورق",
      "noura.alqahtani",
      "جدة · متجر للمنتجات الورقية",
    ],
    [
      "عبدالله العتيبي",
      "Abdullah Alotaibi",
      "روافد للحلول",
      "abdullah.alotaibi",
      "الدمام · بوابة خدمات العملاء",
    ],
    [
      "ريم الدوسري",
      "Reem Aldosari",
      "مساحة نقطة",
      "reem.aldosari",
      "الخبر · تجربة مستخدم لتطبيق",
    ],
    [
      "خالد الغامدي",
      "Khalid Alghamdi",
      "وصل للأعمال",
      "khalid.alghamdi",
      "الرياض · لوحة عمليات داخلية",
    ],
    [
      "سارة الحربي",
      "Sara Alharbi",
      "بدايات",
      "sara.alharbi",
      "المدينة · موقع خدمات واستشارات",
    ],
  ].map(([name, english, company, mailbox, context], index) => ({
    id: crypto.randomUUID(),
    name,
    company,
    email: `${mailbox}@example.com`,
    phone: `+966 5X XXX XX${String(index + 10)}`,
    notes: `${english} · ${context}\nملف نموذجي خيالي / Fictional sample contact. Not for communication.`,
    updated_at: new Date().toISOString(),
  }));
}
