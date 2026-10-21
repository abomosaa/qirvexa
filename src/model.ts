export type Status = "active" | "review" | "done";
export type Project = {
  id: string;
  user_id?: string;
  name: string;
  client: string;
  category: string;
  status: Status;
  amount: number;
  paid: boolean;
  due_date: string;
  created_at: string;
};
export type Brief = {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  created_at: string;
};
export type Filters = { query: string; status: string; months: number };

export function sampleProjects(now = new Date()): Project[] {
  const names = [
    ["متجر أوراق / Waraq store", "أوراق / Waraq", "commerce", 15600],
    ["هوية مدار / Madar identity", "مدار / Madar", "design", 8200],
    ["تطبيق تواصل / Wasl app", "وصل / Wasl", "app", 24000],
    ["بوابة عملاء / Client portal", "روافد / Rawafid", "web", 12600],
    ["موقع استوديو / Studio website", "نقطة / Nuqta", "web", 9400],
    ["لوحة المخزون / Inventory", "أوراق / Waraq", "app", 18700],
    ["حملة الصيف / Summer campaign", "مدار / Madar", "design", 6400],
    ["تجربة الحجز / Booking UX", "وصل / Wasl", "design", 11200],
    ["متجر الأدوات / Tools shop", "روافد / Rawafid", "commerce", 13400],
    ["واجهة الفريق / Team workspace", "نقطة / Nuqta", "app", 22500],
    ["مكتبة التصميم / Design library", "مدار / Madar", "design", 7100],
    ["صفحة الخدمات / Service page", "روافد / Rawafid", "web", 5600],
  ] as const;
  return names.map(([name, client, category, amount], i) => {
    const created = new Date(
      now.getFullYear(),
      now.getMonth() - Math.floor(i / 2),
      4 + (i % 2) * 10,
      12,
    );
    const due = new Date(
      now.getFullYear(),
      now.getMonth() + (i < 5 ? 0 : -Math.floor(i / 2)),
      24 + (i % 5),
      12,
    );
    return {
      id: crypto.randomUUID(),
      name,
      client,
      category,
      status: i < 3 ? "active" : i < 5 ? "review" : "done",
      amount,
      paid: i >= 5,
      created_at: created.toISOString(),
      due_date: due.toISOString().slice(0, 10),
    };
  });
}
export function filterProjects(
  projects: Project[],
  filters: Filters,
  now = new Date(),
): Project[] {
  const start = new Date(
    now.getFullYear(),
    now.getMonth() - filters.months + 1,
    1,
  );
  const query = filters.query.trim().toLocaleLowerCase();
  return projects.filter(
    (p) =>
      (filters.status === "all" || p.status === filters.status) &&
      (!query || `${p.name} ${p.client}`.toLocaleLowerCase().includes(query)) &&
      (!filters.months ||
        (new Date(p.created_at) >= start && new Date(p.created_at) <= now)),
  );
}
export function metrics(projects: Project[]) {
  return {
    revenue: projects.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0),
    pipeline: projects
      .filter((p) => p.status !== "done")
      .reduce((s, p) => s + p.amount, 0),
    active: projects.filter((p) => p.status !== "done").length,
    clients: new Set(projects.map((p) => p.client)).size,
  };
}
export function revenueSeries(
  projects: Project[],
  locale: string,
  now = new Date(),
) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const sameMonth = projects.filter((p) => {
      const c = new Date(p.created_at);
      return (
        c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      );
    });
    return {
      name: new Intl.DateTimeFormat(locale, {
        month: "short",
        calendar: "gregory",
      }).format(d),
      paid: sameMonth.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0),
      total: sameMonth.reduce((s, p) => s + p.amount, 0),
    };
  });
}
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function projectsCSV(projects: Project[]) {
  return (
    "\uFEFF" +
    [
      ["Project", "Client", "Status", "Amount SAR", "Paid", "Due date"],
      ...projects.map((p) => [
        p.name,
        p.client,
        p.status,
        p.amount,
        p.paid ? "Yes" : "No",
        p.due_date,
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
export function download(
  name: string,
  content: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function readLocal<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function isProjects(value: unknown): value is Project[] {
  return (
    Array.isArray(value) &&
    value.length <= 10000 &&
    value.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.client === "string" &&
        typeof p.category === "string" &&
        ["active", "review", "done"].includes(p.status) &&
        typeof p.amount === "number" &&
        Number.isFinite(p.amount) &&
        p.amount >= 0 &&
        typeof p.paid === "boolean" &&
        typeof p.due_date === "string" &&
        !Number.isNaN(Date.parse(p.created_at)),
    )
  );
}
