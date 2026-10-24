import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { Project } from "./model";
import {
  agenda,
  clientNames,
  emptyDetails,
  financeSummary,
  localDay,
  taskProgress,
  type ClientProfile,
  type Task,
} from "./workspaceModel";
import type { WorkspaceStore } from "./useWorkspace";

type Shared = {
  ar: boolean;
  projects: Project[];
  store: WorkspaceStore;
  openProject: (id: string) => void;
};
const nameOf = (name: string, ar: boolean) =>
  ar ? name.split(" / ")[0] : name.split(" / ")[1] || name;
const money = (n: number, ar: boolean) =>
  new Intl.NumberFormat(ar ? "ar-SA-u-nu-latn" : "en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
const dateOf = (d: string, ar: boolean) =>
  new Intl.DateTimeFormat(ar ? "ar-SA-u-nu-latn" : "en", {
    day: "numeric",
    month: "short",
    calendar: "gregory",
  }).format(new Date(`${d}T12:00:00`));

export function WorkspaceState({
  store,
  ar,
}: {
  store: WorkspaceStore;
  ar: boolean;
}) {
  if (store.loading)
    return (
      <p className="workspace-state" role="status">
        {ar ? "جارٍ تحميل تفاصيل العمل…" : "Loading workspace details…"}
      </p>
    );
  if (!store.error) return null;
  return (
    <div className="workspace-state error-state" role="alert">
      <p>
        {ar
          ? "تعذر تحميل المهام وملفات العملاء. سجلات المشاريع الحالية محفوظة؛ أعد المحاولة للمتابعة."
          : "Tasks and client profiles could not load. Existing projects are safe; retry to continue."}
      </p>
      <button className="secondary" onClick={store.retry}>
        {ar ? "إعادة المحاولة" : "Retry"}
      </button>
    </div>
  );
}

export function WorkAgenda({
  ar,
  projects,
  store,
  openProject,
  compact = false,
}: Shared & { compact?: boolean }) {
  const [filter, setFilter] = useState("all");
  const all = agenda(projects, store.tasks);
  const items = all.filter(
    (i) => filter === "all" || (filter === "late" ? i.overdue : i.today),
  );
  const shown = compact ? items.slice(0, 3) : items;
  return (
    <section className="panel work-agenda">
      <div className="panel-title">
        <div>
          <h2>{ar ? "الخطوة القادمة" : "What needs your attention"}</h2>
          <p>
            {ar
              ? "المواعيد والمهام المرتبطة بعملك، بترتيب الأولوية الزمنية."
              : "Project deliveries and tasks, ordered by their due date."}
          </p>
        </div>
        <CalendarDays />
      </div>
      {!compact && (
        <div
          className="segmented"
          aria-label={ar ? "تصفية المواعيد" : "Filter deadlines"}
        >
          {[
            ["all", ar ? "كل المواعيد" : "All deadlines"],
            ["late", ar ? "متأخر" : "Overdue"],
            ["today", ar ? "اليوم" : "Today"],
          ].map(([id, label]) => (
            <button
              className="text-button"
              aria-pressed={filter === id}
              key={id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {shown.length ? (
        <div className="agenda-list">
          {shown.map((i) => (
            <button
              className="agenda-row"
              key={`${i.kind}-${i.id}`}
              onClick={() => openProject(i.project.id)}
            >
              <span className={`deadline-date ${i.overdue ? "late" : ""}`}>
                <CalendarDays />
                <strong>{dateOf(i.date, ar)}</strong>
              </span>
              <span className="agenda-copy">
                <strong>{nameOf(i.title, ar)}</strong>
                <small>
                  {i.kind === "task"
                    ? nameOf(i.project.name, ar)
                    : nameOf(i.project.client, ar)}
                </small>
              </span>
              <span
                className={`badge ${i.overdue ? "overdue" : i.today ? "active" : "neutral"}`}
              >
                {i.overdue
                  ? ar
                    ? "متأخر"
                    : "Overdue"
                  : i.today
                    ? ar
                      ? "اليوم"
                      : "Today"
                    : i.kind === "task"
                      ? ar
                        ? "مهمة"
                        : "Task"
                      : ar
                        ? "تسليم"
                        : "Delivery"}
              </span>
              <ArrowUpRight />
            </button>
          ))}
        </div>
      ) : (
        <div className="workspace-empty">
          <CheckCheck />
          <h3>{ar ? "لا توجد مواعيد مفتوحة هنا" : "No open deadlines here"}</h3>
          <p>
            {ar
              ? "أضف موعدًا لمشروع أو مهمة ليظهر في هذه القائمة."
              : "Add a project or task due date to see the next action here."}
          </p>
        </div>
      )}
      {compact && all.length > shown.length && (
        <p className="workspace-foot">
          {ar
            ? `${all.length - shown.length} مواعيد أخرى في صفحة المواعيد`
            : `${all.length - shown.length} more in Deadlines`}
        </p>
      )}
    </section>
  );
}

export function ProjectWorkspace({
  project,
  ar,
  store,
  onBack,
  onEdit,
  onAI,
  onDirtyChange,
}: {
  project: Project;
  ar: boolean;
  store: WorkspaceStore;
  onBack: () => void;
  onEdit: () => void;
  onAI: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const t = (a: string, e: string) => (ar ? a : e);
  const [editing, setEditing] = useState<Task | null>(null);
  const [taskEditor, setTaskEditor] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("tasks");
  const [taskFilter, setTaskFilter] = useState("all");
  const [dirty, setDirty] = useState(false);
  const dirtyFields = useRef({ task: false, details: false });
  const [initialDetails] = useState(() => emptyDetails(project.id));
  function markDirty(field: "task" | "details", value: boolean) {
    dirtyFields.current[field] = value;
    const next = dirtyFields.current.task || dirtyFields.current.details;
    setDirty(next);
    onDirtyChange(next);
  }
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const details =
    store.details.find((d) => d.project_id === project.id) ?? initialDetails;
  const tasks = store.tasks.filter((task) => task.project_id === project.id);
  const progress = taskProgress(tasks);
  const disabled = store.loading || store.error || store.saving;
  function canResetTask() {
    if (
      dirtyFields.current.task &&
      !confirm(t("تجاهل تعديلات المهمة؟", "Discard task changes?"))
    )
      return false;
    markDirty("task", false);
    return true;
  }
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function saveTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    const task: Task = {
      id: editing?.id ?? crypto.randomUUID(),
      project_id: project.id,
      title,
      status: String(data.get("status")) as Task["status"],
      priority: String(data.get("priority")) as Task["priority"],
      due_date: String(data.get("due_date")) || null,
      created_at: editing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const ok = await store.saveTask(task);
    setNotice(
      ok
        ? t("حُفظت المهمة.", "Task saved.")
        : t(
            "لم تُحفظ المهمة. راجع الاتصال وحاول مجددًا.",
            "Task was not saved. Check your connection and retry.",
          ),
    );
    if (ok) {
      setTaskEditor(false);
      setEditing(null);
      markDirty("task", false);
    }
  }
  async function saveDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const ok = await store.saveDetails({
      ...details,
      description: String(data.get("description") ?? ""),
      notes: String(data.get("notes") ?? ""),
      brief: String(data.get("brief") ?? ""),
      updated_at: new Date().toISOString(),
    });
    setNotice(
      ok
        ? t("حُفظت تفاصيل المشروع.", "Project details saved.")
        : t(
            "لم تُحفظ التفاصيل. النص ما زال في النموذج؛ حاول مجددًا.",
            "Details were not saved. Your text remains in the form; retry.",
          ),
    );
    if (ok) markDirty("details", false);
  }
  return (
    <div className="project-workspace">
      <button className="text-button back-link" onClick={onBack}>
        <ArrowRight />
        {t("كل المشاريع", "All projects")}
      </button>
      <section className="project-summary panel">
        <div>
          <span className={`badge ${project.status}`}>
            {project.status === "done"
              ? t("مكتمل", "Complete")
              : project.status === "review"
                ? t("قيد المراجعة", "In review")
                : t("قيد التنفيذ", "In progress")}
          </span>
          <h2>{nameOf(project.client, ar)}</h2>
          <p>
            {t("علاقة العميل بهذا المشروع", "The client behind this project")}
          </p>
        </div>
        <dl>
          <div>
            <dt>{t("قيمة المشروع", "Project value")}</dt>
            <dd>
              {money(project.amount, ar)} <small>{t("ر.س", "SAR")}</small>
            </dd>
          </div>
          <div>
            <dt>{t("التسليم", "Due date")}</dt>
            <dd>{dateOf(project.due_date, ar)}</dd>
          </div>
          <div>
            <dt>{t("إنجاز المهام", "Task completion")}</dt>
            <dd>
              {progress.done} / {progress.total}
            </dd>
          </div>
        </dl>
        <button className="secondary" onClick={onEdit}>
          <Pencil />
          {t("تعديل المشروع", "Edit project")}
        </button>
      </section>
      <WorkspaceState store={store} ar={ar} />
      <div
        className="detail-tabs"
        role="tablist"
        aria-label={t("تفاصيل المشروع", "Project workspace")}
      >
        {[
          ["tasks", t("المهام", "Tasks")],
          ["details", t("النطاق والملاحظات", "Scope & notes")],
        ].map(([id, label]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            aria-controls={`project-tab-${id}`}
            id={`project-tab-button-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? "tasks"
                    : e.key === "End"
                      ? "details"
                      : tab === "tasks"
                        ? "details"
                        : "tasks";
                setTab(next);
                requestAnimationFrame(() =>
                  document
                    .getElementById(`project-tab-button-${next}`)
                    ?.focus(),
                );
              }
            }}
            className="text-button"
            key={id}
            onClick={() => setTab(id)}
          >
            {label}
            {id === "tasks" && <span>{tasks.length}</span>}
          </button>
        ))}
      </div>
      {notice && (
        <p className="workspace-feedback" role="status">
          {notice}
        </p>
      )}
      <>
        <section
          hidden={tab !== "tasks"}
          id="project-tab-tasks"
          role="tabpanel"
          aria-labelledby="project-tab-button-tasks"
          className="panel task-panel"
        >
          <div className="panel-title">
            <div>
              <h2>{t("من الفكرة إلى التسليم", "From plan to delivery")}</h2>
              <p>
                {t(
                  "قسّم العمل إلى خطوات واضحة. التقدم محسوب من المهام المكتملة.",
                  "Break the work into clear steps. Progress reflects completed tasks.",
                )}
              </p>
            </div>
            <button
              disabled={disabled}
              onClick={() => {
                if (taskEditor && !editing) return;
                if (!canResetTask()) return;
                setEditing(null);
                setTaskEditor(true);
              }}
            >
              <Plus />
              {t("إضافة مهمة", "Add task")}
            </button>
          </div>
          {!!tasks.length && (
            <div className="task-toolbar">
              <progress
                value={progress.done}
                max={progress.total}
                aria-label={t("تقدم المهام", "Task progress")}
              />
              <span>{progress.percent}%</span>
              <label>
                <span className="sr-only">
                  {t("تصفية المهام", "Task filter")}
                </span>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                >
                  <option value="all">{t("كل المهام", "All tasks")}</option>
                  <option value="todo">{t("لم تبدأ", "To do")}</option>
                  <option value="doing">{t("قيد العمل", "In progress")}</option>
                  <option value="done">{t("مكتملة", "Done")}</option>
                </select>
              </label>
            </div>
          )}
          {taskEditor && (
            <form
              className="inline-editor"
              onSubmit={saveTask}
              onChange={() => markDirty("task", true)}
              key={editing?.id ?? "new"}
            >
              <div className="inline-editor-title">
                <h3>
                  {editing
                    ? t("تعديل المهمة", "Edit task")
                    : t("مهمة جديدة", "New task")}
                </h3>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("إغلاق محرر المهمة", "Close task editor")}
                  onClick={() => {
                    if (canResetTask()) {
                      setTaskEditor(false);
                    }
                  }}
                >
                  <X />
                </button>
              </div>
              <label className="full">
                {t("عنوان المهمة", "Task title")}
                <input
                  autoFocus
                  name="title"
                  required
                  maxLength={200}
                  defaultValue={editing?.title}
                  disabled={disabled}
                />
              </label>
              <div className="workspace-form-row">
                <label>
                  {t("الحالة", "Status")}
                  <select
                    name="status"
                    defaultValue={editing?.status ?? "todo"}
                    disabled={disabled}
                  >
                    <option value="todo">{t("لم تبدأ", "To do")}</option>
                    <option value="doing">
                      {t("قيد العمل", "In progress")}
                    </option>
                    <option value="done">{t("مكتملة", "Done")}</option>
                  </select>
                </label>
                <label>
                  {t("الأولوية", "Priority")}
                  <select
                    name="priority"
                    defaultValue={editing?.priority ?? "normal"}
                    disabled={disabled}
                  >
                    <option value="low">{t("منخفضة", "Low")}</option>
                    <option value="normal">{t("عادية", "Normal")}</option>
                    <option value="high">{t("مرتفعة", "High")}</option>
                  </select>
                </label>
                <label>
                  {t("الموعد (اختياري)", "Due date (optional)")}
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={editing?.due_date ?? ""}
                    disabled={disabled}
                  />
                </label>
              </div>
              <button disabled={disabled}>
                <Check />
                {store.saving
                  ? t("جارٍ الحفظ…", "Saving…")
                  : t("حفظ المهمة", "Save task")}
              </button>
            </form>
          )}
          <div className="task-list">
            {tasks
              .filter(
                (task) => taskFilter === "all" || task.status === taskFilter,
              )
              .map((task) => (
                <div
                  className={`task-row ${task.status === "done" ? "is-done" : ""}`}
                  key={task.id}
                >
                  <button
                    className="task-check"
                    aria-label={`${task.status === "done" ? t("إعادة فتح", "Reopen") : t("إكمال", "Complete")} ${task.title}`}
                    aria-pressed={task.status === "done"}
                    disabled={disabled}
                    onClick={async () => {
                      const ok = await store.saveTask({
                        ...task,
                        status: task.status === "done" ? "todo" : "done",
                        updated_at: new Date().toISOString(),
                      });
                      setNotice(
                        ok
                          ? t("حُدثت المهمة.", "Task updated.")
                          : t(
                              "تعذر تحديث المهمة. حاول مجددًا.",
                              "Could not update task. Retry.",
                            ),
                      );
                    }}
                  >
                    {task.status === "done" && <Check />}
                  </button>
                  <div className="task-copy">
                    <strong>{task.title}</strong>
                    <span>
                      {task.due_date
                        ? dateOf(task.due_date, ar)
                        : t("دون موعد", "No due date")}
                      {task.priority === "high" && (
                        <b>{t("أولوية مرتفعة", "High priority")}</b>
                      )}
                      {task.due_date &&
                        task.due_date < localDay() &&
                        task.status !== "done" && (
                          <b className="late-text">{t("متأخرة", "Overdue")}</b>
                        )}
                    </span>
                  </div>
                  <span className="task-stage">
                    {task.status === "doing"
                      ? t("قيد العمل", "In progress")
                      : task.status === "done"
                        ? t("مكتملة", "Done")
                        : t("لم تبدأ", "To do")}
                  </span>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`${t("تعديل", "Edit")} ${task.title}`}
                      disabled={disabled}
                      onClick={() => {
                        if (taskEditor && editing?.id === task.id) return;
                        if (!canResetTask()) return;
                        setEditing(task);
                        setTaskEditor(true);
                      }}
                    >
                      <Pencil />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`${t("حذف", "Delete")} ${task.title}`}
                      disabled={disabled}
                      onClick={() => setDeleting(task)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {!tasks.length && !store.loading && !store.error && (
            <div className="workspace-empty">
              <ClipboardList />
              <h3>
                {t(
                  "كل إنجاز يبدأ بخطوة",
                  "Every delivery starts with one step",
                )}
              </h3>
              <p>
                {t(
                  "قسّم العمل إلى خطوات صغيرة، واجعل لكل خطوة هدفًا واضحًا.",
                  "Break the work into small steps, each with a clear outcome.",
                )}
              </p>
              <div className="starter-tasks">
                <span>
                  {t(
                    "اختر خطوة بداية أو أضف مهمتك الخاصة:",
                    "Choose a starter step, or add your own task:",
                  )}
                </span>
                {[
                  t("تحديد المخرجات", "Define deliverables"),
                  t("مراجعة اتجاه التصميم", "Review design direction"),
                  t("تجهيز قائمة التسليم", "Prepare delivery checklist"),
                ].map((title) => (
                  <button
                    className="secondary"
                    disabled={disabled}
                    key={title}
                    onClick={async () => {
                      const now = new Date().toISOString();
                      const ok = await store.saveTask({
                        id: crypto.randomUUID(),
                        project_id: project.id,
                        title,
                        status: "todo",
                        priority: "normal",
                        due_date: null,
                        created_at: now,
                        updated_at: now,
                      });
                      setNotice(
                        ok
                          ? t(
                              "أُضيفت الخطوة إلى مهام هذا المشروع.",
                              "Starter step added to this project's tasks.",
                            )
                          : t(
                              "لم تُحفظ الخطوة. حاول مجددًا.",
                              "Step was not saved. Retry.",
                            ),
                      );
                    }}
                  >
                    <Plus />
                    {title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!!tasks.length &&
            !tasks.some(
              (task) => taskFilter === "all" || task.status === taskFilter,
            ) && (
              <div className="workspace-empty">
                <p>
                  {t("لا توجد مهام بهذه الحالة.", "No tasks with this status.")}
                </p>
                <button
                  className="text-button"
                  onClick={() => setTaskFilter("all")}
                >
                  {t("عرض كل المهام", "Show all tasks")}
                </button>
              </div>
            )}
          {deleting && (
            <div className="delete-confirm" role="alert">
              <p>
                {t("حذف هذه المهمة نهائيًا؟", "Permanently delete this task?")}{" "}
                <strong>{deleting.title}</strong>
              </p>
              <button
                className="destructive"
                disabled={disabled}
                onClick={async () => {
                  const ok = await store.deleteTask(deleting);
                  setNotice(
                    ok
                      ? t("حُذفت المهمة.", "Task deleted.")
                      : t(
                          "لم تُحذف المهمة؛ حاول مجددًا.",
                          "Task was not deleted; retry.",
                        ),
                  );
                  if (ok) setDeleting(null);
                }}
              >
                {t("حذف المهمة", "Delete task")}
              </button>
              <button
                className="secondary"
                disabled={store.saving}
                onClick={() => setDeleting(null)}
              >
                {t("إلغاء", "Cancel")}
              </button>
            </div>
          )}
        </section>
        <section
          hidden={tab !== "details"}
          id="project-tab-details"
          role="tabpanel"
          aria-labelledby="project-tab-button-details"
          className="panel project-notes"
        >
          <div className="panel-title">
            <div>
              <h2>{t("مساحة واضحة للعمل", "A clear brief for the work")}</h2>
              <p>
                {t(
                  "النطاق والملاحظات خاصة بمساحة عملك.",
                  "Scope and notes stay private to your workspace.",
                )}
              </p>
            </div>
            <button className="secondary" onClick={onAI}>
              <ArrowUpRight />
              {t("طوّر الموجز بالمساعد", "Develop the brief with AI")}
            </button>
          </div>
          <form
            key={`${project.id}-${details.updated_at}`}
            onSubmit={saveDetails}
            onChange={() => markDirty("details", true)}
          >
            <label>
              {t("نطاق المشروع", "Project scope")}
              <textarea
                name="description"
                aria-label={t("نطاق المشروع", "Project scope")}
                maxLength={6000}
                rows={5}
                defaultValue={details.description}
                placeholder={t(
                  "الهدف، المخرجات وما يقع خارج النطاق…",
                  "Goals, deliverables and what is out of scope…",
                )}
                disabled={disabled}
              />
            </label>
            <label>
              {t("ملاحظات العمل", "Working notes")}
              <textarea
                name="notes"
                aria-label={t("ملاحظات العمل", "Working notes")}
                maxLength={12000}
                rows={5}
                defaultValue={details.notes}
                placeholder={t(
                  "قرارات، أسئلة وتفاصيل للمتابعة…",
                  "Decisions, questions and things to follow up…",
                )}
                disabled={disabled}
              />
            </label>
            <label>
              {t("موجز المشروع", "Project brief")}
              <textarea
                name="brief"
                aria-label={t("موجز المشروع", "Project brief")}
                maxLength={20000}
                rows={7}
                defaultValue={details.brief}
                placeholder={t(
                  "اكتب موجزًا أو اربطه من المساعد بعد مراجعته.",
                  "Write a brief or attach one from the assistant after review.",
                )}
                disabled={disabled}
              />
            </label>
            <button disabled={disabled}>
              <Check />
              {store.saving
                ? t("جارٍ الحفظ…", "Saving…")
                : t("حفظ التفاصيل", "Save details")}
            </button>
          </form>
        </section>
      </>
    </div>
  );
}

export function ClientDirectory({
  ar,
  projects,
  store,
  openProject,
  onDirtyChange,
}: Shared & { onDirtyChange: (dirty: boolean) => void }) {
  const t = (a: string, e: string) => (ar ? a : e);
  const [selected, setSelected] = useState<string | null>(null);
  const [newClient, setNewClient] = useState(false);
  const [query, setQuery] = useState("");
  const dirty = useRef(false);
  function markDirty(value: boolean) {
    dirty.current = value;
    onDirtyChange(value);
  }
  function canChange() {
    if (
      dirty.current &&
      !confirm(
        t(
          "تجاهل تعديلات ملف العميل غير المحفوظة؟",
          "Discard unsaved client profile changes?",
        ),
      )
    )
      return false;
    markDirty(false);
    return true;
  }
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      onDirtyChange(false);
    };
  }, [onDirtyChange]);
  const [notice, setNotice] = useState("");
  const names = clientNames(projects, store.clients);
  const profile = store.clients.find((c) => c.name === selected);
  const related = projects.filter((p) => p.client === selected);
  const total = financeSummary(related);
  const disabled = store.loading || store.error || store.saving;
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = selected ?? String(data.get("name") ?? "").trim();
    if (!name) return;
    if (!selected && store.clients.some((c) => c.name === name)) {
      setSelected(name);
      setNewClient(false);
      setNotice(
        t(
          "هذا الملف موجود؛ يمكنك تعديله هنا.",
          "This profile already exists. Edit it here.",
        ),
      );
      return;
    }
    const record: ClientProfile = {
      id:
        profile?.id ??
        store.clients.find((c) => c.name === name)?.id ??
        crypto.randomUUID(),
      name,
      company: String(data.get("company") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      notes: String(data.get("notes") ?? ""),
      updated_at: new Date().toISOString(),
    };
    const ok = await store.saveClient(record);
    setNotice(
      ok
        ? t("حُفظ ملف العميل.", "Client profile saved.")
        : t(
            "لم يُحفظ الملف. راجع الاتصال وحاول مجددًا.",
            "Profile was not saved. Check your connection and retry.",
          ),
    );
    if (ok) {
      markDirty(false);
      setSelected(name);
      setNewClient(false);
    }
  }
  return (
    <div className="client-workspace">
      <WorkspaceState store={store} ar={ar} />
      {notice && (
        <p className="workspace-feedback" role="status">
          {notice}
        </p>
      )}
      <section className="panel client-directory">
        <div className="panel-title">
          <div>
            <h2>{t("علاقات تستحق المتابعة", "Your client relationships")}</h2>
            <p>
              {t(
                "بيانات التواصل والملاحظات ومشاريع كل عميل في مكان واحد.",
                "Contact details, notes and every client's projects in one place.",
              )}
            </p>
          </div>
          <button
            disabled={disabled}
            onClick={() => {
              if (!canChange()) return;
              setSelected(null);
              setNewClient(true);
            }}
          >
            <Plus />
            {t("ملف عميل", "New client")}
          </button>
        </div>
        <label className="client-search">
          <Search />
          <span className="sr-only">{t("ابحث عن عميل", "Search clients")}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ابحث عن اسم العميل…", "Search client name…")}
          />
        </label>
        <div className="client-directory-list">
          {names
            .filter((n) =>
              n.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
            )
            .map((name) => {
              const list = projects.filter((p) => p.client === name);
              const summary = financeSummary(list);
              return (
                <button
                  className={
                    selected === name ? "client-entry selected" : "client-entry"
                  }
                  key={name}
                  onClick={() => {
                    if (!canChange()) return;
                    setSelected(name);
                    setNewClient(false);
                  }}
                >
                  <span className="client-initial">
                    {nameOf(name, ar).slice(0, 1)}
                  </span>
                  <span>
                    <strong>{nameOf(name, ar)}</strong>
                    <small>
                      {list.length} {t("مشاريع", "projects")}
                    </small>
                  </span>
                  <span className="client-value">
                    {money(summary.total, ar)} <small>{t("ر.س", "SAR")}</small>
                  </span>
                  <ArrowUpRight />
                </button>
              );
            })}
        </div>
        {!names.length && (
          <div className="workspace-empty">
            <h3>{t("ابدأ بعلاقة عمل", "Start with a client relationship")}</h3>
            <p>
              {t(
                "أضف ملف عميل، أو أنشئ مشروعًا باسم العميل ليظهر هنا.",
                "Add a client profile, or create a project with a client name to see it here.",
              )}
            </p>
          </div>
        )}
        {!!names.length &&
          !names.some((n) =>
            n.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          ) && (
            <p className="workspace-empty">
              {t("لا توجد أسماء تطابق البحث.", "No names match your search.")}
            </p>
          )}
      </section>
      {(selected || newClient) && (
        <section className="panel client-profile">
          <div className="panel-title">
            <div>
              <h2>
                {selected
                  ? nameOf(selected, ar)
                  : t("ملف عميل جديد", "New client profile")}
              </h2>
              <p>
                {t(
                  "معلومات خاصة لا تُرسل تلقائيًا إلى العميل.",
                  "Private information. Nothing is sent to your client.",
                )}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label={t("إغلاق الملف", "Close profile")}
              onClick={() => {
                if (!canChange()) return;
                setSelected(null);
                setNewClient(false);
              }}
            >
              <X />
            </button>
          </div>
          <form
            onChange={() => markDirty(true)}
            key={`${selected ?? "new-client"}-${profile?.updated_at ?? ""}`}
            onSubmit={save}
          >
            {!selected && (
              <label>
                {t(
                  "اسم العميل كما في المشروع",
                  "Client name as used in projects",
                )}
                <input
                  name="name"
                  required
                  maxLength={100}
                  list="existing-client-names"
                  disabled={disabled}
                />
                <datalist id="existing-client-names">
                  {names.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </label>
            )}
            <label>
              {t("المنشأة (اختياري)", "Company (optional)")}
              <input
                name="company"
                maxLength={160}
                defaultValue={profile?.company}
                disabled={disabled}
              />
            </label>
            <div className="workspace-form-row">
              <label>
                {t("البريد الإلكتروني", "Email")}
                <input
                  type="email"
                  dir="ltr"
                  name="email"
                  maxLength={254}
                  defaultValue={profile?.email}
                  disabled={disabled}
                />
              </label>
              <label>
                {t("الهاتف", "Phone")}
                <input
                  type="tel"
                  dir="ltr"
                  name="phone"
                  maxLength={60}
                  defaultValue={profile?.phone}
                  disabled={disabled}
                />
              </label>
            </div>
            <label>
              {t("ملاحظات العلاقة", "Relationship notes")}
              <textarea
                name="notes"
                aria-label={t("ملاحظات العلاقة", "Relationship notes")}
                rows={5}
                maxLength={6000}
                defaultValue={profile?.notes}
                disabled={disabled}
              />
            </label>
            <button disabled={disabled}>
              <Check />
              {store.saving
                ? t("جارٍ الحفظ…", "Saving…")
                : t("حفظ الملف", "Save profile")}
            </button>
          </form>
          {profile && (
            <div className="client-profile-delete">
              <button
                className="text-button danger"
                disabled={disabled}
                onClick={async () => {
                  if (
                    !confirm(
                      t(
                        "حذف معلومات الاتصال والملاحظات المحفوظة؟ ستبقى جميع المشاريع كما هي.",
                        "Delete saved contact details and notes? All projects will remain unchanged.",
                      ),
                    )
                  )
                    return;
                  const ok = await store.deleteClient(profile);
                  setNotice(
                    ok
                      ? t(
                          "حُذفت معلومات الملف. المشاريع لم تتغير.",
                          "Saved profile details deleted. Projects are unchanged.",
                        )
                      : t(
                          "تعذر حذف المعلومات. حاول مجددًا.",
                          "Could not delete profile details. Retry.",
                        ),
                  );
                }}
              >
                <Trash2 />
                {t("حذف معلومات الملف", "Delete saved profile details")}
              </button>
            </div>
          )}
          {selected && (
            <div className="client-projects">
              <h3>{t("المشاريع المرتبطة", "Linked projects")}</h3>
              <p>
                {t("متبقي غير معلّم بالتحصيل", "Not marked paid")}:{" "}
                {money(total.outstanding, ar)} {t("ر.س", "SAR")}
              </p>
              {related.map((p) => (
                <button
                  className="text-button"
                  key={p.id}
                  onClick={() => openProject(p.id)}
                >
                  {nameOf(p.name, ar)}
                  <ArrowUpRight />
                </button>
              ))}
              {!related.length && (
                <p>
                  {t(
                    "لم تُربط مشاريع بهذا الاسم بعد.",
                    "No projects use this client name yet.",
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function FinanceView({
  ar,
  projects,
  openProject,
}: Pick<Shared, "ar" | "projects" | "openProject">) {
  const t = (a: string, e: string) => (ar ? a : e);
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState("value");
  const total = financeSummary(projects);
  const rows = projects
    .filter((p) => scope === "all" || (scope === "paid" ? p.paid : !p.paid))
    .sort((a, b) =>
      sort === "due"
        ? a.due_date.localeCompare(b.due_date)
        : b.amount - a.amount,
    );
  return (
    <div className="finance-workspace">
      <section className="panel finance-summary">
        <div className="panel-title">
          <div>
            <h2>{t("قيمة العمل، بوضوح", "A clear view of project value")}</h2>
            <p>
              {t(
                "ملخص مستمد من سجلاتك وحالة التحصيل التي أدخلتها.",
                "A summary of your projects and the paid status you recorded.",
              )}
            </p>
          </div>
          <Wallet />
        </div>
        <dl>
          {[
            [t("إجمالي قيمة المشاريع", "Total project value"), total.total],
            [t("معلّم بالتحصيل", "Marked paid"), total.paid],
            [t("متبقي غير محصل", "Not marked paid"), total.outstanding],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {money(Number(value), ar)} <small>{t("ر.س", "SAR")}</small>
              </dd>
            </div>
          ))}
        </dl>
        <p className="finance-disclosure">
          {t(
            "تُحسب قيمة المشروع كاملة حسب خيار «تم التحصيل». لا يوجد سجل دفعات جزئية أو تواريخ تحصيل، ولا تمثل هذه الصفحة نظام فواتير أو معالجة مدفوعات.",
            "Each full project amount follows its recorded paid flag. Partial payments and receipt dates are not tracked; this is not invoicing or payment processing.",
          )}
        </p>
      </section>
      <section className="panel finance-ledger">
        <div className="panel-title">
          <div>
            <h2>{t("متابعة المستحقات", "Follow up the outstanding work")}</h2>
            <p>
              {total.unpaid}{" "}
              {t("مشاريع غير معلّمة بالتحصيل", "projects not marked paid")}
            </p>
          </div>
          <div className="finance-filters">
            <label>
              <span className="sr-only">
                {t("حالة التحصيل", "Payment status")}
              </span>
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="all">{t("كل المشاريع", "All projects")}</option>
                <option value="unpaid">
                  {t("غير محصل", "Not marked paid")}
                </option>
                <option value="paid">{t("محصل", "Marked paid")}</option>
              </select>
            </label>
            <label>
              <span className="sr-only">
                {t("ترتيب المستحقات", "Sort projects")}
              </span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="value">
                  {t("الأعلى قيمة", "Highest value")}
                </option>
                <option value="due">{t("موعد التسليم", "Due date")}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="finance-rows">
          {rows.map((p) => (
            <button
              className="finance-row"
              key={p.id}
              onClick={() => openProject(p.id)}
            >
              <span>
                <strong>{nameOf(p.name, ar)}</strong>
                <small>{nameOf(p.client, ar)}</small>
              </span>
              <span className="finance-row-date">{dateOf(p.due_date, ar)}</span>
              <span className={`badge ${p.paid ? "active" : "review"}`}>
                {p.paid ? t("محصل", "Marked paid") : t("غير محصل", "Unpaid")}
              </span>
              <strong>
                {money(p.amount, ar)} <small>{t("ر.س", "SAR")}</small>
              </strong>
              <ArrowUpRight />
            </button>
          ))}
        </div>
        {!rows.length && (
          <div className="workspace-empty">
            <h3>
              {t(
                "لا توجد مشاريع بهذه الحالة",
                "No projects with this paid status",
              )}
            </h3>
            <p>
              {t(
                "أضف مشروعًا أو اختر حالة مختلفة لعرض المبالغ.",
                "Add a project or change the status filter to see project values.",
              )}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
