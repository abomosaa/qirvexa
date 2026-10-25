import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCheck,
  FolderKanban,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { metrics, revenueSeries, type Project } from "./model";
import { financeSummary } from "./workspaceModel";
import { WorkAgenda, WorkspaceState } from "./Workspace";
import type { WorkspaceStore } from "./useWorkspace";

type Props = {
  ar: boolean;
  projects: Project[];
  store: WorkspaceStore;
  months: number;
  setMonths: (months: number) => void;
  openProject: (id: string) => void;
  openView: (
    view: "projects" | "deadlines" | "clients" | "finance" | "assistant",
  ) => void;
};

const nameOf = (name: string, ar: boolean) =>
  ar ? name.split(" / ")[0] : name.split(" / ")[1] || name;

export default function Dashboard({
  ar,
  projects,
  store,
  months,
  setMonths,
  openProject,
  openView,
}: Props) {
  const t = (a: string, e: string) => (ar ? a : e);
  const money = (value: number) =>
    new Intl.NumberFormat(ar ? "ar-SA-u-nu-latn" : "en", {
      maximumFractionDigits: 2,
    }).format(value);
  const stats = metrics(projects);
  const finance = financeSummary(projects);
  const paidPercent = finance.total
    ? Math.round((finance.paid / finance.total) * 100)
    : 0;
  const series = revenueSeries(projects, ar ? "ar-SA" : "en-GB").slice(
    months && months < 6 ? -months : -6,
  );
  const counts = (["active", "review", "done"] as const).map((status) => ({
    status,
    label:
      status === "active"
        ? t("قيد التنفيذ", "In progress")
        : status === "review"
          ? t("قيد المراجعة", "In review")
          : t("مكتمل", "Completed"),
    count: projects.filter((p) => p.status === status).length,
  }));
  const clients = Array.from(new Set(projects.map((p) => p.client)))
    .map((name) => ({
      name,
      projects: projects.filter((p) => p.client === name).length,
      amount: projects
        .filter((p) => p.client === name)
        .reduce((sum, p) => sum + p.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const summaries = [
    {
      label: t("معلّم بالتحصيل", "Marked paid"),
      value: money(stats.revenue),
      suffix: t("ر.س", "SAR"),
      icon: Wallet,
      tone: "green",
      note: t("من المشاريع المدفوعة", "From paid project records"),
      action: () => openView("finance"),
    },
    {
      label: t("قيمة العمل الجاري", "Active pipeline"),
      value: money(stats.pipeline),
      suffix: t("ر.س", "SAR"),
      icon: BriefcaseBusiness,
      tone: "blue",
      note: t("قيد التنفيذ والمراجعة", "In progress and in review"),
      action: () => openView("finance"),
    },
    {
      label: t("مشاريع جارية", "Open projects"),
      value: money(stats.active),
      suffix: "",
      icon: FolderKanban,
      tone: "amber",
      note: t("ضمن الفترة المحددة", "In the selected period"),
      action: () => openView("projects"),
    },
    {
      label: t("عملاء فريدون", "Unique clients"),
      value: money(stats.clients),
      suffix: "",
      icon: Users,
      tone: "violet",
      note: t("من سجلات المشاريع", "From project records"),
      action: () => openView("clients"),
    },
  ];
  return (
    <div className="dashboard">
      <section
        className="metrics overview-metrics"
        aria-label={t("ملخص الأرقام", "Key metrics")}
      >
        {summaries.map((s) => (
          <article className={`metric-card metric-${s.tone}`} key={s.label}>
            <div className="metric-label">
              <span>{s.label}</span>
              <span className="metric-symbol">
                <s.icon />
              </span>
            </div>
            <div className="metric-value">
              {s.value}
              <small>{s.suffix}</small>
            </div>
            <div className="metric-bottom">
              <p>{s.note}</p>
              <button
                className="icon-button"
                onClick={s.action}
                aria-label={`${t("عرض", "View")} ${s.label}`}
              >
                <ArrowUpRight />
              </button>
            </div>
          </article>
        ))}
      </section>
      <WorkspaceState store={store} ar={ar} />
      <div className="dashboard-analysis">
        <section className="panel financial-chart">
          <div className="panel-title">
            <div>
              <h2>{t("قيمة العمل", "Project value")}</h2>
              <p>
                {t(
                  "حسب شهر إنشاء المشروع · بالريال السعودي",
                  "By project creation month · SAR",
                )}
              </p>
            </div>
            <div
              className="chart-periods"
              aria-label={t("فترة الرسم", "Chart period")}
            >
              {[1, 3, 6].map((n) => (
                <button
                  key={n}
                  className="text-button"
                  aria-pressed={months === n}
                  onClick={() => setMonths(n)}
                >
                  {t(`${n} ش`, `${n}M`)}
                </button>
              ))}
              <button
                className="text-button"
                aria-pressed={months === 0}
                onClick={() => setMonths(0)}
              >
                {t("الكل", "All")}
              </button>
            </div>
          </div>
          <div className="finance-chart-summary">
            <strong className="tabular">
              {money(finance.total)} <small>{t("ر.س", "SAR")}</small>
            </strong>
            <span>
              {t(
                "إجمالي قيمة السجلات المصفّاة",
                "Total value of filtered records",
              )}
            </span>
            <div className="chart-legend">
              <span>
                <i />
                {t("قيمة المشروع", "Project value")}
              </span>
              <span>
                <i />
                {t("معلّم بالتحصيل", "Marked paid")}
              </span>
            </div>
          </div>
          <div
            className="chart dashboard-value-chart"
            dir="ltr"
            role="img"
            aria-label={t(
              "القيمة حسب شهر إنشاء المشروع، وليست تواريخ تحصيل الدفعات. القيم الدقيقة متاحة بجدول المشاريع.",
              "Value by project creation month, not payment receipt date. Exact values are in the projects table.",
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={series}
                margin={{ top: 15, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#e8edf0"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#637282", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#637282", fontSize: 12 }}
                  width={48}
                  tickFormatter={(n) => `${n / 1000}k`}
                />
                <Tooltip
                  formatter={(v, name) => [
                    `${money(Number(v))} ${t("ر.س", "SAR")}`,
                    name === "total"
                      ? t("قيمة المشروع", "Project value")
                      : t("معلّم بالتحصيل", "Marked paid"),
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#dce3e8",
                    fontFamily: "inherit",
                    fontSize: 12,
                  }}
                />
                <Bar
                  name="total"
                  dataKey="total"
                  fill="#a9c2dc"
                  maxBarSize={34}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reduceMotion}
                  animationDuration={420}
                />
                <Line
                  name="paid"
                  type="monotone"
                  dataKey="paid"
                  stroke="#1d8065"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={!reduceMotion}
                  animationDuration={420}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-record-totals">
            <div>
              <span>{t("معلّم بالتحصيل", "Marked paid")}</span>
              <strong className="tabular">
                {money(finance.paid)} <small>{t("ر.س", "SAR")}</small>
              </strong>
            </div>
            <div>
              <span>{t("غير محصل", "Outstanding")}</span>
              <strong className="tabular">
                {money(finance.outstanding)} <small>{t("ر.س", "SAR")}</small>
              </strong>
            </div>
            <div>
              <span>{t("نسبة القيمة المحصلة", "Value marked paid")}</span>
              <strong className="tabular">{paidPercent}%</strong>
            </div>
          </div>
          <p className="chart-data-note">
            {t(
              "التحصيل حسب العلامة المسجلة، وليس كشفًا بنكيًا. «الكل» يعرض رسم آخر 6 أشهر وملخص جميع السجلات.",
              "Paid status is recorded manually. “All” charts the last 6 months and summarizes all records.",
            )}
          </p>
        </section>
        <section className="panel workflow-panel">
          <div className="panel-title">
            <div>
              <h2>{t("حالة المشاريع", "Project status")}</h2>
              <p>
                {t("من أول خطوة إلى التسليم", "From first step to delivery")}
              </p>
            </div>
            <FolderKanban />
          </div>
          <div className="workflow-total">
            <strong className="tabular">{money(projects.length)}</strong>
            <span>{t("مشروع في العرض الحالي", "projects in this view")}</span>
          </div>
          <div className="workflow-track" aria-hidden="true">
            {counts.map((c) => (
              <span
                className={c.status}
                key={c.status}
                style={{ flex: c.count }}
              />
            ))}
          </div>
          <div className="workflow-states">
            {counts.map((c) => (
              <div key={c.status}>
                <span className={`state-dot ${c.status}`} />
                <span>{c.label}</span>
                <strong className="tabular">{c.count}</strong>
                <small className="tabular">
                  {projects.length
                    ? Math.round((c.count / projects.length) * 100)
                    : 0}
                  %
                </small>
              </div>
            ))}
          </div>
          <div className="workflow-completed">
            <CheckCheck />
            <div>
              <strong>
                {t(
                  `${counts[2].count} مشاريع مكتملة`,
                  `${counts[2].count} completed projects`,
                )}
              </strong>
              <p>
                {t(
                  "تعكس الحالة المحفوظة لكل مشروع.",
                  "Based on each project’s saved status.",
                )}
              </p>
            </div>
          </div>
          <button
            className="text-button workflow-link"
            onClick={() => openView("projects")}
          >
            {t("إدارة المشاريع", "Manage projects")}
            <ArrowUpRight />
          </button>
        </section>
      </div>
      <div className="dashboard-secondary">
        <WorkAgenda
          ar={ar}
          projects={projects}
          store={store}
          openProject={openProject}
          compact
        />
        <section className="panel client-value-panel">
          <div className="panel-title">
            <div>
              <h2>{t("قيمة العمل حسب العميل", "Value by client")}</h2>
              <p>
                {t(
                  "أعلى 4 عملاء من السجلات المصفّاة",
                  "Top 4 clients from filtered records",
                )}
              </p>
            </div>
            <button className="text-button" onClick={() => openView("clients")}>
              {t("عرض الكل", "View all")}
              <ArrowUpRight />
            </button>
          </div>
          <div className="client-value-list">
            {clients.length ? (
              clients.map((c, index) => (
                <div className="client-value-row" key={c.name}>
                  <span className={`client-monogram client-tone-${index}`}>
                    {nameOf(c.name, ar).slice(0, 1)}
                  </span>
                  <div>
                    <strong>{nameOf(c.name, ar)}</strong>
                    <small>
                      {t(`${c.projects} مشاريع`, `${c.projects} projects`)}
                    </small>
                  </div>
                  <strong className="tabular">
                    {money(c.amount)} <small>{t("ر.س", "SAR")}</small>
                  </strong>
                  <span className="client-value-track" aria-hidden="true">
                    <i
                      style={
                        {
                          "--value-share": `${finance.total ? (c.amount / finance.total) * 100 : 0}%`,
                        } as CSSProperties
                      }
                    />
                  </span>
                </div>
              ))
            ) : (
              <p className="workspace-empty">
                {t(
                  "تظهر القيم عند إضافة مشاريع.",
                  "Add projects to see client values.",
                )}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
