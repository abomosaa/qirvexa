import type { Project } from "./model";

export type TaskStatus = "todo" | "doing" | "done";
export type Task = {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  priority: "low" | "normal" | "high";
  due_date: string | null;
  created_at: string;
  updated_at: string;
};
export type ProjectDetails = {
  project_id: string;
  description: string;
  notes: string;
  brief: string;
  updated_at: string;
};
export type ClientProfile = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  updated_at: string;
};
export type Workspace = {
  tasks: Task[];
  details: ProjectDetails[];
  clients: ClientProfile[];
};
export const emptyWorkspace = (): Workspace => ({
  tasks: [],
  details: [],
  clients: [],
});
export const emptyDetails = (project_id: string): ProjectDetails => ({
  project_id,
  description: "",
  notes: "",
  brief: "",
  updated_at: "",
});
const text = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max;
export const validDate = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const v = value as Workspace;
  return (
    Array.isArray(v.tasks) &&
    v.tasks.length <= 20000 &&
    v.tasks.every(
      (t) =>
        t &&
        text(t.id, 100) &&
        text(t.project_id, 100) &&
        text(t.title, 200) &&
        !!t.title.trim() &&
        ["todo", "doing", "done"].includes(t.status) &&
        ["low", "normal", "high"].includes(t.priority) &&
        (t.due_date === null || validDate(t.due_date)) &&
        text(t.created_at, 60) &&
        text(t.updated_at, 60),
    ) &&
    Array.isArray(v.details) &&
    v.details.every(
      (d) =>
        d &&
        text(d.project_id, 100) &&
        text(d.description, 6000) &&
        text(d.notes, 12000) &&
        text(d.brief, 20000) &&
        text(d.updated_at, 60),
    ) &&
    Array.isArray(v.clients) &&
    v.clients.every(
      (c) =>
        c &&
        text(c.id, 100) &&
        text(c.name, 100) &&
        !!c.name.trim() &&
        text(c.company, 160) &&
        text(c.email, 254) &&
        text(c.phone, 60) &&
        text(c.notes, 6000) &&
        text(c.updated_at, 60),
    )
  );
}
export function localDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function taskProgress(tasks: Task[]) {
  const done = tasks.filter((t) => t.status === "done").length;
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}
export function financeSummary(projects: Project[]) {
  const cents = (n: number) => Math.round(n * 100);
  const total = projects.reduce((sum, p) => sum + cents(p.amount), 0);
  const paid = projects
    .filter((p) => p.paid)
    .reduce((sum, p) => sum + cents(p.amount), 0);
  return {
    total: total / 100,
    paid: paid / 100,
    outstanding: (total - paid) / 100,
    unpaid: projects.filter((p) => !p.paid).length,
  };
}
export function agenda(projects: Project[], tasks: Task[], now = new Date()) {
  const today = localDay(now);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const items = [
    ...projects
      .filter((p) => p.status !== "done")
      .map((p) => ({
        id: p.id,
        project: p,
        title: p.name,
        date: p.due_date,
        kind: "project" as const,
      })),
    ...tasks
      .filter(
        (t) => t.status !== "done" && t.due_date && byId.has(t.project_id),
      )
      .map((t) => ({
        id: t.id,
        project: byId.get(t.project_id)!,
        title: t.title,
        date: t.due_date!,
        kind: "task" as const,
      })),
  ]
    .filter((i) => validDate(i.date))
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
    );
  return items.map((i) => ({
    ...i,
    overdue: i.date < today,
    today: i.date === today,
  }));
}
export function clientNames(projects: Project[], profiles: ClientProfile[]) {
  return [
    ...new Set([
      ...projects.map((p) => p.client),
      ...profiles.map((c) => c.name),
    ]),
  ].sort((a, b) => a.localeCompare(b));
}
