import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Sparkles,
  Settings,
  ArrowUpRight,
  ArrowDownToLine,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Pencil,
  Trash2,
  LogOut,
  Check,
  Cloud,
  HardDrive,
  Leaf,
  Wallet,
  Copy,
  LoaderCircle,
  CalendarDays,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./backend";
import AuthPanel from "./AuthPanel";
import { readOwnerRows, useWorkspace } from "./useWorkspace";
import {
  ClientDirectory,
  FinanceView,
  ProjectWorkspace,
  WorkAgenda,
  WorkspaceState,
} from "./Workspace";
import { emptyDetails, taskProgress } from "./workspaceModel";
import Dashboard from "./Dashboard";
import {
  finishRecovery,
  getRecoveryOwner,
  subscribeRecovery,
} from "./authRecovery";
import {
  download,
  filterProjects,
  isProjects,
  projectsCSV,
  readLocal,
  sampleProjects,
  type Brief,
  type Project,
  type Status,
} from "./model";

type View =
  | "overview"
  | "projects"
  | "deadlines"
  | "clients"
  | "finance"
  | "assistant"
  | "settings";
const views: View[] = [
  "overview",
  "projects",
  "deadlines",
  "clients",
  "finance",
  "assistant",
  "settings",
];
const icons = {
  overview: LayoutDashboard,
  projects: FolderKanban,
  deadlines: CalendarDays,
  clients: Users,
  finance: Wallet,
  assistant: Sparkles,
  settings: Settings,
};
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    return () => {
      d?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close / إغلاق"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function splitName(name: string, ar: boolean) {
  const parts = name.split(" / ");
  return ar ? parts[0] : parts[1] || parts[0];
}

export default function App() {
  const [lang, setLang] = useState<"ar" | "en">(() => {
    try {
      return localStorage.getItem("qirvexa.lang") === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });
  const ar = lang === "ar";
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const [view, setView] = useState<View>(() =>
    views.includes(location.hash.slice(1).split("/")[0] as View)
      ? (location.hash.slice(1).split("/")[0] as View)
      : "overview",
  );
  const [menu, setMenu] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const workspace = useWorkspace(session);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () =>
      location.hash.startsWith("#projects/") ? location.hash.slice(10) : null,
  );
  const [aiProjectId, setAiProjectId] = useState("");
  const workspaceDirty = useRef(false);
  const acceptedRoute = useRef(location.hash || "#overview");
  const onWorkspaceDirty = useCallback((dirty: boolean) => {
    workspaceDirty.current = dirty;
  }, []);
  const [projectLoadError, setProjectLoadError] = useState(false);
  const [projects, setProjects] = useState<Project[]>(() =>
    readLocal("qirvexa.projects.v1", sampleProjects(), isProjects),
  );
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [months, setMonths] = useState(6);
  const [sort, setSort] = useState<"created_at" | "amount" | "name">(
    "created_at",
  );
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [prompt, setPrompt] = useState("");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isExample, setIsExample] = useState(false);
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const recoveryOwner = useSyncExternalStore(
    subscribeRecovery,
    getRecoveryOwner,
  );
  const recoveryActive = Boolean(session && recoveryOwner === session.user.id);
  useEffect(() => {
    if (recoveryOwner) {
      setView("settings");
      location.hash = "settings";
      setMenu(false);
    }
  }, [recoveryOwner]);
  const alive = useRef(true),
    authEpoch = useRef(0),
    currentUserId = useRef<string | null>(null);
  const identityResolved = useRef(false);
  const currentRequest = () => ({
    epoch: authEpoch.current,
    owner: currentUserId.current,
  });
  const isCurrent = (request: { epoch: number; owner: string | null }) =>
    alive.current &&
    request.epoch === authEpoch.current &&
    request.owner === currentUserId.current;
  const labels = {
    overview: t("نظرة عامة", "Overview"),
    projects: t("المشاريع", "Projects"),
    deadlines: t("المواعيد", "Deadlines"),
    clients: t("العملاء", "Clients"),
    finance: t("المتابعة المالية", "Finances"),
    assistant: t("مساعد الموجز", "Brief assistant"),
    settings: t("الحساب والإعدادات", "Account & settings"),
  };
  const money = (n: number) =>
    new Intl.NumberFormat(ar ? "ar-SA" : "en-SA", {
      maximumFractionDigits: 2,
      numberingSystem: "latn",
    }).format(n);
  const date = (v: string) =>
    new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
      day: "numeric",
      month: "short",
      calendar: "gregory",
    }).format(new Date(v));
  const statusLabel = (s: Status) =>
    s === "active"
      ? t("قيد التنفيذ", "In progress")
      : s === "review"
        ? t("قيد المراجعة", "In review")
        : t("مكتمل", "Completed");
  function notify(s: string) {
    setMessage(s);
  }
  function canLeaveRoute(next: string) {
    if (next === acceptedRoute.current) return true;
    if (
      workspaceDirty.current &&
      !confirm(
        t(
          "لديك تعديلات غير محفوظة. تجاهلها ومغادرة الصفحة؟",
          "You have unsaved changes. Discard them and leave this page?",
        ),
      )
    )
      return false;
    workspaceDirty.current = false;
    acceptedRoute.current = next;
    return true;
  }
  function navigate(v: View) {
    if (!canLeaveRoute(`#${v}`)) return false;
    setView(v);
    setSelectedProjectId(null);
    location.hash = v;
    setMenu(false);
    return true;
  }
  function openProject(id: string) {
    if (!canLeaveRoute(`#projects/${id}`)) return;
    setSelectedProjectId(id);
    setView("projects");
    location.hash = `projects/${id}`;
    setMenu(false);
    requestAnimationFrame(() => document.getElementById("main")?.focus());
  }
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? "rtl" : "ltr";
    try {
      localStorage.setItem("qirvexa.lang", lang);
    } catch {
      /* UI remains usable if storage is restricted. */
    }
  }, [lang, ar]);
  useEffect(() => {
    const handler = () => {
      const [route, id] = location.hash.slice(1).split("/");
      const v = route as View;
      if (views.includes(v)) {
        if (!canLeaveRoute(location.hash)) {
          history.replaceState(history.state, "", acceptedRoute.current);
          return;
        }
        setView(v);
        setSelectedProjectId(v === "projects" && id ? id : null);
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [ar]);
  useEffect(() => {
    alive.current = true;
    const client = supabase;
    if (!client)
      return () => {
        alive.current = false;
        authEpoch.current++;
      };
    let active = true;
    const initialEpoch = authEpoch.current;
    function applySession(next: Session | null) {
      if (!active) return;
      const owner = next?.user.id ?? null;
      const restoreProject =
        !identityResolved.current &&
        owner &&
        location.hash.startsWith("#projects/")
          ? location.hash.slice(10)
          : null;
      identityResolved.current = true;
      if (owner !== currentUserId.current) {
        workspaceDirty.current = false;
        authEpoch.current++;
        currentUserId.current = owner;
        setProjects([]);
        setSelectedProjectId(restoreProject);
        setAiProjectId("");
        setBriefs([]);
        setBrief("");
        setPrompt("");
        setIsExample(false);
        setActiveBriefId(null);
        setEditing(null);
        setDeleting(null);
        setBusy(false);
        setGenerating(false);
        setMessage("");
        setLoading(Boolean(next));
      }
      setSession(next);
      setAuthReady(true);
    }
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && initialEpoch === authEpoch.current) {
          applySession(data.session);
          if (error)
            setMessage(
              t(
                "تعذر استعادة الجلسة؛ يمكنك استخدام وضع العرض.",
                "Could not restore the session. You can use the demo.",
              ),
            );
        }
      })
      .catch(() => {
        if (active && initialEpoch === authEpoch.current) {
          setAuthReady(true);
          setMessage(
            t(
              "تعذر استعادة الجلسة؛ يمكنك استخدام وضع العرض.",
              "Could not restore the session. You can use the demo.",
            ),
          );
        }
      });
    const { data } = client.auth.onAuthStateChange((_event, next) =>
      applySession(next),
    );
    return () => {
      active = false;
      alive.current = false;
      authEpoch.current++;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    const request = currentRequest();
    setBrief("");
    setPrompt("");
    setEditing(null);
    setDeleting(null);
    if (!session || !supabase) {
      setProjectLoadError(false);
      const localProjects = readLocal(
        "qirvexa.projects.v1",
        sampleProjects(),
        isProjects,
      );
      setProjects(localProjects);
      // Persist first-visit sample IDs so new child tasks survive a reload.
      // Existing storage, including an unreadable original, is never replaced here.
      try {
        if (localStorage.getItem("qirvexa.projects.v1") === null)
          localStorage.setItem(
            "qirvexa.projects.v1",
            JSON.stringify(localProjects),
          );
      } catch {
        /* Device storage is reported when a mutation is attempted. */
      }
      setBriefs(
        readLocal(
          "qirvexa.briefs.v1",
          [],
          (v): v is Brief[] =>
            Array.isArray(v) &&
            v.every(
              (b) =>
                b &&
                typeof b.id === "string" &&
                typeof b.title === "string" &&
                typeof b.content === "string" &&
                typeof b.created_at === "string",
            ),
        ),
      );
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setProjectLoadError(false);
    setProjects([]);
    setBriefs([]);
    Promise.all([
      readOwnerRows<Project>("qirvexa_projects", session.user.id),
      supabase
        .from("qirvexa_briefs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ])
      .then(([p, b]) => {
        if (!active || !isCurrent(request)) return;
        if (p.error || b.error) {
          setProjectLoadError(true);
          notify(
            t(
              "تعذر تحميل بيانات حسابك. تحقق من الاتصال وأعد تحميل الصفحة.",
              "Could not load your account data. Check your connection and reload.",
            ),
          );
        } else {
          setProjects(p.data || []);
          setBriefs(b.data || []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active && isCurrent(request)) {
          setLoading(false);
          setProjectLoadError(true);
          notify(
            t(
              "تعذر تحميل بيانات حسابك. تحقق من الاتصال وأعد تحميل الصفحة.",
              "Could not load your account data. Check your connection and reload.",
            ),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);
  function saveGuest(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      notify(
        t(
          "تعذر حفظ البيانات على هذا الجهاز. التغييرات متاحة حتى إغلاق الصفحة.",
          "Device storage is unavailable. Changes last until this page closes.",
        ),
      );
    }
  }
  function updateLocal(next: Project[]) {
    setProjects(next);
    saveGuest("qirvexa.projects.v1", next);
  }
  const filtered = useMemo(
    () => filterProjects(projects, { query, status, months }),
    [projects, query, status, months],
  );
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const compare =
          sort === "amount"
            ? a.amount - b.amount
            : String(a[sort]).localeCompare(String(b[sort]));
        return asc ? compare : -compare;
      }),
    [filtered, sort, asc],
  );
  useEffect(() => setPage(1), [query, status, months]);
  const pages = Math.max(1, Math.ceil(sorted.length / 6));
  const currentPage = Math.min(page, pages);
  const shown = sorted.slice((currentPage - 1) * 6, currentPage * 6);
  function login() {
    navigate("settings");
    requestAnimationFrame(() =>
      document.getElementById("auth-heading")?.focus(),
    );
  }
  async function logout() {
    const request = currentRequest();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (!isCurrent(request)) return;
      if (error) {
        notify(
          t(
            "تعذر تسجيل الخروج. حاول مجددًا.",
            "Could not sign out. Try again.",
          ),
        );
        return;
      }
    }
    setSession(null);
    setBrief("");
    setPrompt("");
  }
  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = currentRequest();
    if (busy || (session?.user.id ?? null) !== request.owner) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const client = String(form.get("client") || "").trim();
    const amount = Number(form.get("amount"));
    const due_date = String(form.get("due_date"));
    if (
      !name ||
      !client ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 999999999 ||
      !due_date
    ) {
      notify(
        t(
          "راجع الاسم والعميل والقيمة والتاريخ.",
          "Check the project name, client, amount and date.",
        ),
      );
      return;
    }
    setBusy(true);
    const old = editing !== "new" ? editing : null;
    const record: Project = {
      id: old?.id || crypto.randomUUID(),
      name,
      client,
      amount,
      due_date,
      category: String(form.get("category")),
      status: String(form.get("status")) as Status,
      paid: form.get("paid") === "on",
      created_at: old?.created_at || new Date().toISOString(),
    };
    if (session && supabase) {
      const payload = { ...record, user_id: session.user.id };
      const { data, error } = await supabase
        .from("qirvexa_projects")
        .upsert(payload)
        .select()
        .single();
      if (!isCurrent(request)) return;
      if (error) {
        notify(
          t(
            "لم يُحفظ المشروع. تحقق من الاتصال وحاول مجددًا.",
            "Project was not saved. Check your connection and try again.",
          ),
        );
        setBusy(false);
        return;
      }
      setProjects((p) =>
        old ? p.map((x) => (x.id === record.id ? data : x)) : [data, ...p],
      );
    } else
      updateLocal(
        old
          ? projects.map((p) => (p.id === record.id ? record : p))
          : [record, ...projects],
      );
    setBusy(false);
    setEditing(null);
    notify(t("حُفظ المشروع.", "Project saved."));
  }
  async function removeProject() {
    const request = currentRequest();
    if (!deleting || busy || (session?.user.id ?? null) !== request.owner)
      return;
    setBusy(true);
    if (session && supabase) {
      const { error } = await supabase
        .from("qirvexa_projects")
        .delete()
        .eq("id", deleting.id);
      if (!isCurrent(request)) return;
      if (error) {
        notify(
          t(
            "تعذر حذف المشروع؛ حاول مجددًا.",
            "Could not delete this project. Try again.",
          ),
        );
        setBusy(false);
        return;
      }
      setProjects((p) => p.filter((x) => x.id !== deleting.id));
    } else updateLocal(projects.filter((p) => p.id !== deleting.id));
    setDeleting(null);
    setBusy(false);
  }
  async function seed() {
    const request = currentRequest();
    if (busy || (session?.user.id ?? null) !== request.owner) return;
    setBusy(true);
    const examples = sampleProjects();
    if (session && supabase) {
      const { data, error } = await supabase
        .from("qirvexa_projects")
        .insert(examples.map((p) => ({ ...p, user_id: session.user.id })))
        .select();
      if (!isCurrent(request)) return;
      if (error)
        notify(
          t(
            "تعذر إضافة الأمثلة. حاول مجددًا.",
            "Could not add samples. Try again.",
          ),
        );
      else setProjects((p) => [...(data || []), ...p]);
    } else updateLocal(examples);
    setBusy(false);
  }
  async function generate() {
    const request = currentRequest();
    if (
      generating ||
      prompt.trim().length < 10 ||
      (session?.user.id ?? null) !== request.owner
    )
      return;
    setGenerating(true);
    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ idea: prompt.trim(), language: lang }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await response.json().catch(() => ({}));
      if (!isCurrent(request)) return;
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? t(
                "وصلت إلى حد الطلبات. انتظر دقيقة وحاول مجددًا.",
                "Request limit reached. Wait a minute and retry.",
              )
            : t(
                "المساعد غير متاح الآن أو انتهت حصته المجانية. حاول لاحقًا؛ يمكنك فتح مثال جاهز.",
                "The assistant is unavailable or its free quota is exhausted. Try later or open the sample.",
              ),
        );
      }
      if (typeof data.brief !== "string" || !data.brief.trim())
        throw new Error(
          t(
            "لم تصل نتيجة صالحة. حاول مرة أخرى.",
            "No usable result was returned. Try again.",
          ),
        );
      setBrief(data.brief);
      setIsExample(false);
      setActiveBriefId(null);
    } catch (error) {
      if (isCurrent(request))
        notify(
          error instanceof Error && error.name !== "TimeoutError"
            ? error.message
            : t(
                "استغرق الطلب وقتًا طويلًا. حاول مجددًا.",
                "The request timed out. Please retry.",
              ),
        );
    } finally {
      if (isCurrent(request)) setGenerating(false);
    }
  }
  function example() {
    if (
      brief.trim() &&
      !confirm(
        t(
          "استبدال المسودة الحالية بالمثال الجاهز؟",
          "Replace the current draft with the prewritten sample?",
        ),
      )
    )
      return;
    setActiveBriefId(null);
    setIsExample(true);
    setPrompt(
      t(
        "أريد موقعًا لاستوديو تصوير يعرض الأعمال ويسمح بطلب جلسة.",
        "I need a photography studio website with a portfolio and a session enquiry.",
      ),
    );
    setBrief(
      t(
        "الهدف\nعرض أعمال الاستوديو وتسهيل طلب جلسة.\n\nالنطاق المقترح\n• معرض أعمال مصنف.\n• صفحة خدمات وتفاصيل كل جلسة.\n• نموذج طلب مع نوع الجلسة والموعد المفضل.\n\nالمخرجات\nتصميم متجاوب، واجهة عربية وإنجليزية، ولوحة لمتابعة الطلبات.\n\nمعايير القبول\nيصل الزائر إلى نموذج الطلب من أي صفحة، وتظهر رسالة تأكيد واضحة بعد الإرسال.\n\nأسئلة قبل التنفيذ\nهل تؤكد المواعيد يدويًا؟ ومن يوفر الصور والنصوص؟",
        "Goal\nShow the studio’s work and make session enquiries simple.\n\nProposed scope\n• A categorized portfolio.\n• Services and session details.\n• An enquiry form with session type and preferred date.\n\nDeliverables\nA responsive bilingual website and an enquiry dashboard.\n\nAcceptance criteria\nVisitors can reach the form from any page and see a clear confirmation after submission.\n\nOpen questions\nAre bookings confirmed manually? Who provides photography and copy?",
      ),
    );
  }
  async function saveBrief(asCopy = false) {
    const request = currentRequest();
    if (!brief.trim() || busy || (session?.user.id ?? null) !== request.owner)
      return;
    setBusy(true);
    const record: Brief = {
      id: !asCopy && activeBriefId ? activeBriefId : crypto.randomUUID(),
      title: prompt.slice(0, 100) || t("موجز مشروع", "Project brief"),
      content: brief.slice(0, 20000),
      created_at:
        !asCopy && activeBriefId
          ? (briefs.find((b) => b.id === activeBriefId)?.created_at ??
            new Date().toISOString())
          : new Date().toISOString(),
    };
    if (session && supabase) {
      const { data, error } = await supabase
        .from("qirvexa_briefs")
        .upsert({ ...record, user_id: session.user.id })
        .select()
        .single();
      if (!isCurrent(request)) return;
      if (error)
        notify(
          t(
            "تعذر حفظ الموجز. حاول مجددًا.",
            "Could not save the brief. Try again.",
          ),
        );
      else {
        setBriefs((b) => [data, ...b.filter((item) => item.id !== data.id)]);
        setActiveBriefId(data.id);
        notify(t("حُفظ الموجز في حسابك.", "Brief saved to your account."));
      }
    } else {
      const next = [
        record,
        ...briefs.filter((item) => item.id !== record.id),
      ].slice(0, 50);
      setActiveBriefId(record.id);
      setBriefs(next);
      saveGuest("qirvexa.briefs.v1", next);
      notify(t("حُفظ الموجز على هذا الجهاز.", "Brief saved on this device."));
    }
    setBusy(false);
  }
  function table() {
    return (
      <section className="panel project-panel">
        <div className="panel-title">
          <div>
            <h2>
              {t("المشاريع", "Projects")}{" "}
              <span className="section-count">{filtered.length}</span>
            </h2>
            <p>
              {t(
                "تفاصيل العمل، في مكان واحد.",
                "The work, down to the details.",
              )}
            </p>
          </div>
          <button className="text-button" onClick={() => setEditing("new")}>
            <Plus />
            {t("إضافة مشروع", "Add project")}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th
                  aria-sort={
                    sort === "name"
                      ? asc
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() => {
                      setSort("name");
                      setAsc(sort === "name" ? !asc : true);
                    }}
                  >
                    {t("المشروع / العميل", "Project / client")}
                    <ArrowUpRight />
                  </button>
                </th>
                <th>{t("الحالة", "Status")}</th>
                <th
                  aria-sort={
                    sort === "amount"
                      ? asc
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() => {
                      setSort("amount");
                      setAsc(sort === "amount" ? !asc : false);
                    }}
                  >
                    {t("القيمة", "Value")}
                    <ArrowUpRight />
                  </button>
                </th>
                <th>{t("إنجاز المهام", "Task progress")}</th>
                <th>{t("التسليم", "Due")}</th>
                <th>{t("الإجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span
                      className={`project-type-mark ${p.category}`}
                      aria-hidden="true"
                    >
                      <FolderKanban />
                    </span>
                    <button
                      className="project-name-link text-button"
                      onClick={() => openProject(p.id)}
                    >
                      {splitName(p.name, ar)}
                    </button>
                    <span>{splitName(p.client, ar)}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.status}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="tabular">
                    <strong>
                      {money(p.amount)} <small>{t("ر.س", "SAR")}</small>
                    </strong>
                    <span>
                      {p.paid
                        ? t("تم التحصيل", "Paid")
                        : t("غير محصل", "Unpaid")}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const progress = taskProgress(
                        workspace.tasks.filter(
                          (task) => task.project_id === p.id,
                        ),
                      );
                      return progress.total ? (
                        <div className="table-task-progress">
                          <span>
                            {progress.done} / {progress.total}
                            <strong>{progress.percent}%</strong>
                          </span>
                          <progress
                            value={progress.done}
                            max={progress.total}
                            aria-label={`${t("إنجاز مهام", "Task progress for")} ${splitName(p.name, ar)}`}
                          />
                        </div>
                      ) : (
                        <button
                          className="text-button add-tasks"
                          onClick={() => openProject(p.id)}
                        >
                          {t("أضف مهامًا", "Add tasks")}
                          <Plus />
                        </button>
                      );
                    })()}
                  </td>
                  <td>
                    <span className="table-date">
                      <CalendarDays />
                      {date(p.due_date)}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        onClick={() => setEditing(p)}
                        aria-label={`${t("تعديل", "Edit")} ${splitName(p.name, ar)}`}
                      >
                        <Pencil />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => setDeleting(p)}
                        aria-label={`${t("حذف", "Delete")} ${splitName(p.name, ar)}`}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-project-list">
          {shown.map((p) => (
            <article className="mobile-project" key={p.id}>
              <div>
                <button
                  className="text-button project-name-link"
                  onClick={() => openProject(p.id)}
                >
                  {splitName(p.name, ar)}
                  <ArrowUpRight />
                </button>
                <p>{splitName(p.client, ar)}</p>
              </div>
              <span className={`badge ${p.status}`}>
                {statusLabel(p.status)}
              </span>
              <dl>
                <div>
                  <dt>{t("القيمة", "Value")}</dt>
                  <dd>
                    {money(p.amount)} {t("ر.س", "SAR")}
                  </dd>
                </div>
                <div>
                  <dt>{t("التسليم", "Due")}</dt>
                  <dd>{date(p.due_date)}</dd>
                </div>
              </dl>
              <div className="mobile-project-actions">
                <span>
                  {p.paid ? t("محصل", "Marked paid") : t("غير محصل", "Unpaid")}
                </span>
                <button
                  className="secondary"
                  onClick={() => setEditing(p)}
                  aria-label={`${t("تعديل", "Edit")} ${splitName(p.name, ar)}`}
                >
                  <Pencil />
                  {t("تعديل", "Edit")}
                </button>
                <button
                  className="icon-button danger"
                  onClick={() => setDeleting(p)}
                  aria-label={`${t("حذف", "Delete")} ${splitName(p.name, ar)}`}
                >
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <div className="empty">
            <FolderKanban />
            <h3>{t("لا توجد مشاريع هنا بعد", "No projects here yet")}</h3>
            <p>
              {query || status !== "all" || (months > 0 && projects.length > 0)
                ? t(
                    "عدّل البحث أو الفلاتر لعرض المزيد.",
                    "Adjust the search or filters to see more.",
                  )
                : t(
                    "أضف مشروعك الأول أو حمّل بيانات المثال.",
                    "Add your first project or load sample data.",
                  )}
            </p>
            {!!projects.length && (
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setMonths(0);
                }}
              >
                {t("إزالة الفلاتر", "Clear filters")}
              </button>
            )}
            {!projects.length && (
              <button onClick={seed} disabled={busy}>
                {t("تحميل بيانات مثال", "Load sample data")}
              </button>
            )}
          </div>
        )}
        <div className="pagination">
          <span>
            {t(`${filtered.length} مشروع`, `${filtered.length} projects`)}
          </span>
          <div>
            <button
              className="icon-button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label={t("الصفحة السابقة", "Previous page")}
            >
              <ChevronRight className={ar ? "" : "flip"} />
            </button>
            <span>
              {currentPage} / {pages}
            </span>
            <button
              className="icon-button"
              disabled={currentPage >= pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label={t("الصفحة التالية", "Next page")}
            >
              <ChevronLeft className={ar ? "" : "flip"} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {t("انتقل للمحتوى", "Skip to content")}
      </a>
      {menu && (
        <button
          className="menu-shade"
          onClick={() => setMenu(false)}
          aria-label={t("إغلاق القائمة", "Close menu")}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`sidebar ${menu ? "is-open" : ""}`}
      >
        <button
          className="icon-button drawer-close"
          onClick={() => setMenu(false)}
          aria-label={t("إغلاق القائمة", "Close navigation")}
        >
          <X />
        </button>
        <a
          href="#overview"
          className="brand"
          onClick={() => navigate("overview")}
        >
          <span className="brand-mark">
            <Leaf />
          </span>
          <span>
            Qirvexa<small>{t("مساحة العمل", "WORKSPACE")}</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">Q</span>
          <div>
            <strong>{t("استوديو كيرڤكسا", "Qirvexa studio")}</strong>
            <small>{t("لوحة إدارة الأعمال", "Business operations")}</small>
          </div>
        </div>
        <div className="nav-group-label">
          {t("إدارة مساحة العمل", "Workspace management")}
        </div>
        <nav aria-label={t("القائمة الرئيسية", "Main navigation")}>
          {views.map((v) => {
            const Icon = icons[v];
            return (
              <button
                key={v}
                onClick={() => navigate(v)}
                aria-current={view === v ? "page" : undefined}
                className={view === v ? "selected" : ""}
              >
                <Icon />
                <span className="nav-label">{labels[v]}</span>
                {v === "projects" && (
                  <span className="nav-count" aria-hidden="true">
                    {projects.length}
                  </span>
                )}
                {v === "assistant" && <span className="nav-ai">AI</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-motto">
            <strong>
              {t("وضوح لكل خطوة.", "Clarity for every next step.")}
            </strong>
            <p>
              {t(
                "مشاريعك، علاقاتك، والعمل الذي يستحق التركيز.",
                "Your projects, relationships and the work that matters next.",
              )}
            </p>
          </div>
          <button
            className="profile-button"
            onClick={() => navigate("settings")}
          >
            <span className="profile-avatar">{session ? "U" : "D"}</span>
            <span>
              <strong>
                {session
                  ? t("حسابك الشخصي", "Your account")
                  : t("مساحة شخصية", "Personal workspace")}
              </strong>
              <small>
                {session
                  ? t("بيانات خاصة بك", "Your private data")
                  : t("حفظ على هذا الجهاز", "Saved on this device")}
              </small>
            </span>
            <Settings />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label={t("فتح القائمة", "Open navigation")}
              aria-expanded={menu}
              aria-controls="workspace-navigation"
            >
              <Menu />
            </button>
            <span>{t("مساحة العمل", "Workspace")}</span>
            <ChevronLeft className={ar ? "" : "flip"} />
            <strong>{labels[view]}</strong>
          </div>
          <form
            className="global-search"
            onSubmit={(event) => {
              event.preventDefault();
              const value =
                new FormData(event.currentTarget)
                  .get("quick-search")
                  ?.toString() ?? "";
              if (navigate("projects")) {
                setQuery(value);
                setStatus("all");
                setMonths(0);
              }
            }}
          >
            <Search />
            <input
              name="quick-search"
              type="search"
              placeholder={t("ابحث في المشاريع…", "Search your projects…")}
              aria-label={t("بحث سريع في المشاريع", "Quick project search")}
            />
            <button
              type="submit"
              className="icon-button"
              aria-label={t("تنفيذ البحث", "Run search")}
            >
              <ArrowUpRight />
            </button>
          </form>
          <div className="topbar-actions">
            <span className="storage-label">
              {session ? <Cloud /> : <HardDrive />}
              {session
                ? t("حفظ سحابي", "Cloud sync")
                : t("على هذا الجهاز", "On this device")}
            </span>
            <button
              className="language-button"
              onClick={() => setLang(ar ? "en" : "ar")}
            >
              {ar ? "English" : "العربية"}
            </button>
            <button
              className="avatar"
              onClick={() => navigate("settings")}
              aria-label={labels.settings}
            >
              Q
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1} data-view={view}>
          <div className="page-heading">
            <div>
              <h1>
                {view === "overview"
                  ? t("أهلًا بك في مساحة عملك", "Welcome to your workspace")
                  : view === "projects" && selectedProjectId
                    ? splitName(
                        projects.find((p) => p.id === selectedProjectId)
                          ?.name ?? labels.projects,
                        ar,
                      )
                    : labels[view]}
              </h1>
              <p>
                {view === "overview"
                  ? t(
                      "إليك صورة واضحة عن المشاريع والخطوات القادمة.",
                      "Here’s what’s happening with your projects today.",
                    )
                  : view === "assistant"
                    ? t(
                        "من فكرة أولية إلى موجز يمكنك البناء عليه.",
                        "From a rough idea to a brief you can build on.",
                      )
                    : view === "projects"
                      ? t(
                          "نظّم التسليمات وتابع حالة كل مشروع.",
                          "Organize deliveries and follow every project.",
                        )
                      : view === "clients"
                        ? t(
                            "كل علاقة عمل، والأرقام التي تخصها.",
                            "Every client relationship, with the numbers that matter.",
                          )
                        : view === "deadlines"
                          ? t(
                              "المهام والتسليمات القادمة، دون أن تضيع التفاصيل.",
                              "Your next tasks and deliveries, with the details in reach.",
                            )
                          : view === "finance"
                            ? t(
                                "تابع قيمة العمل وحالة التحصيل من سجلات المشاريع.",
                                "Follow project value and the paid status recorded in your workspace.",
                              )
                            : t(
                                "اختر لغتك واحفظ عملك بالطريقة التي تناسبك.",
                                "Choose your language and how your work is saved.",
                              )}
              </p>
            </div>
            {(view === "overview" || view === "projects") && (
              <div className="heading-actions">
                <span className="workspace-today">
                  <CalendarDays />
                  {new Intl.DateTimeFormat(ar ? "ar-SA-u-nu-latn" : "en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    calendar: "gregory",
                    timeZone: "Asia/Riyadh",
                  }).format(new Date())}
                </span>
                <button
                  className="secondary"
                  onClick={() =>
                    download(
                      "qirvexa-projects.csv",
                      projectsCSV(sorted),
                      "text/csv;charset=utf-8",
                    )
                  }
                  disabled={!sorted.length}
                >
                  <ArrowDownToLine />
                  {t("تصدير", "Export")}
                </button>
                <button onClick={() => setEditing("new")}>
                  <Plus />
                  {t("مشروع جديد", "New project")}
                </button>
              </div>
            )}
          </div>
          {message && (
            <div className="notice" role="status">
              <span>{message}</span>
              <button
                className="icon-button"
                onClick={() => setMessage("")}
                aria-label={t("إغلاق التنبيه", "Dismiss notification")}
              >
                <X />
              </button>
            </div>
          )}
          {!session && (
            <div className="device-storage-note">
              <HardDrive />
              <span>
                {t(
                  "مساحة تجريبية؛ بيانات المثال خيالية وعملك محفوظ على هذا الجهاز.",
                  "Demo workspace. Sample data is fictional; your work is saved on this device.",
                )}
              </span>
              <button
                className="text-button"
                onClick={login}
                disabled={!authReady}
              >
                {t(
                  "سجّل الدخول للحفظ في حسابك",
                  "Sign in to save to your account",
                )}
                <ArrowUpRight />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              <LoaderCircle className="spin" />
              {t("جارٍ تحميل مساحة عملك…", "Loading your workspace…")}
            </div>
          ) : projectLoadError ? (
            <div className="workspace-state error-state" role="alert">
              <p>
                {t(
                  "تعذر تحميل مساحة العمل. أعد تحميل الصفحة؛ لن نعرض هذا الخطأ كمساحة فارغة.",
                  "Could not load your workspace. Reload the page to retry; this is not an empty workspace.",
                )}
              </p>
              <button className="secondary" onClick={() => location.reload()}>
                {t("إعادة التحميل", "Reload")}
              </button>
            </div>
          ) : (
            <>
              {(view === "overview" || view === "projects") &&
                !selectedProjectId && (
                  <div className="filters">
                    <label className="search">
                      <Search />
                      <span className="sr-only">
                        {t(
                          "ابحث عن مشروع أو عميل",
                          "Search projects or clients",
                        )}
                      </span>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t(
                          "ابحث عن مشروع أو عميل…",
                          "Search projects or clients…",
                        )}
                      />
                    </label>
                    <label>
                      <span className="sr-only">
                        {t("تصفية حسب الحالة", "Filter by status")}
                      </span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="all">
                          {t("كل الحالات", "All statuses")}
                        </option>
                        {(["active", "review", "done"] as const).map((s) => (
                          <option value={s} key={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">
                        {t("الفترة الزمنية", "Date range")}
                      </span>
                      <select
                        value={months}
                        onChange={(e) => setMonths(Number(e.target.value))}
                      >
                        <option value="6">
                          {t("آخر 6 أشهر", "Last 6 months")}
                        </option>
                        <option value="3">
                          {t("آخر 3 أشهر", "Last 3 months")}
                        </option>
                        <option value="1">
                          {t("هذا الشهر", "This month")}
                        </option>
                        <option value="0">{t("كل الفترات", "All time")}</option>
                      </select>
                    </label>
                  </div>
                )}
              {view === "overview" && (
                <>
                  <Dashboard
                    ar={ar}
                    projects={filtered}
                    store={workspace}
                    months={months}
                    setMonths={setMonths}
                    openProject={openProject}
                    openView={navigate}
                  />
                  {table()}
                  <section className="assistant-strip">
                    <div className="assistant-icon">
                      <Sparkles />
                    </div>
                    <div>
                      <h2>
                        {t(
                          "فكرة جديدة؟ ابدأ بموجز واضح.",
                          "A new idea? Start with a clear brief.",
                        )}
                      </h2>
                      <p>
                        {t(
                          "نطاق العمل والمخرجات والأسئلة، قبل أول خطوة.",
                          "Scope, deliverables and the right questions before the first step.",
                        )}
                      </p>
                    </div>
                    <button
                      className="secondary"
                      onClick={() => navigate("assistant")}
                    >
                      {t("افتح المساعد", "Open assistant")}
                      <ArrowUpRight />
                    </button>
                  </section>
                </>
              )}
              {view === "projects" && !selectedProjectId && table()}
              {view === "projects" &&
                selectedProjectId &&
                (projects.find((p) => p.id === selectedProjectId) ? (
                  <ProjectWorkspace
                    key={`${session?.user.id ?? "guest"}-${selectedProjectId}`}
                    project={projects.find((p) => p.id === selectedProjectId)!}
                    ar={ar}
                    store={workspace}
                    onDirtyChange={onWorkspaceDirty}
                    onBack={() => navigate("projects")}
                    onEdit={() =>
                      setEditing(
                        projects.find((p) => p.id === selectedProjectId)!,
                      )
                    }
                    onAI={() => {
                      const p = projects.find(
                        (p) => p.id === selectedProjectId,
                      )!;
                      const d = workspace.details.find(
                        (d) => d.project_id === p.id,
                      );
                      if (!navigate("assistant")) return;
                      setAiProjectId(p.id);
                      setPrompt(
                        `${splitName(p.name, ar)}\n${d?.description ?? ""}`,
                      );
                    }}
                  />
                ) : (
                  <section className="panel workspace-empty">
                    <h2>
                      {t(
                        "المشروع غير متاح في مساحة العمل الحالية",
                        "This project is not in the current workspace",
                      )}
                    </h2>
                    <button
                      className="secondary"
                      onClick={() => navigate("projects")}
                    >
                      {t("كل المشاريع", "All projects")}
                    </button>
                  </section>
                ))}
              {view === "deadlines" && (
                <>
                  <WorkspaceState store={workspace} ar={ar} />
                  <WorkAgenda
                    key={session?.user.id ?? "guest"}
                    ar={ar}
                    projects={projects}
                    store={workspace}
                    openProject={openProject}
                  />
                </>
              )}
              {view === "finance" && (
                <FinanceView
                  ar={ar}
                  projects={projects}
                  openProject={openProject}
                />
              )}
              {view === "clients" && (
                <ClientDirectory
                  key={session?.user.id ?? "guest"}
                  ar={ar}
                  projects={projects}
                  store={workspace}
                  openProject={openProject}
                  onDirtyChange={onWorkspaceDirty}
                />
              )}
              {view === "assistant" && (
                <>
                  <div className="brief-layout">
                    <section className="panel brief-input">
                      <div className="panel-title">
                        <h2>
                          {t(
                            "ما الذي تريد بناءه؟",
                            "What would you like to build?",
                          )}
                        </h2>
                        <Sparkles />
                      </div>
                      <label className="ai-project-choice">
                        {t(
                          "اربط الموجز بمشروع (اختياري)",
                          "Link this brief to a project (optional)",
                        )}
                        <select
                          value={aiProjectId}
                          disabled={generating}
                          onChange={(e) => setAiProjectId(e.target.value)}
                        >
                          <option value="">
                            {t("موجز مستقل", "Standalone brief")}
                          </option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {splitName(p.name, ar)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label htmlFor="idea">
                        {t(
                          "صف الفكرة والجمهور والوظيفة الأساسية",
                          "Describe the idea, audience and main task",
                        )}
                      </label>
                      <textarea
                        id="idea"
                        disabled={generating}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        maxLength={2000}
                        placeholder={t(
                          "مثال: أريد بوابة للعملاء تتيح متابعة تقدم المشاريع ومشاركة الملاحظات…",
                          "Example: A client portal to follow project progress and share feedback…",
                        )}
                        rows={8}
                      />
                      <div className="field-meta">
                        <span>{prompt.length} / 2000</span>
                        <button
                          className="text-button"
                          onClick={example}
                          disabled={generating}
                        >
                          {t("افتح مثالًا جاهزًا", "Open a sample")}
                        </button>
                      </div>
                      <button
                        className="wide"
                        onClick={generate}
                        disabled={generating || prompt.trim().length < 10}
                      >
                        {generating ? (
                          <LoaderCircle className="spin" />
                        ) : (
                          <Sparkles />
                        )}
                        {generating
                          ? t("جارٍ إعداد الموجز…", "Preparing your brief…")
                          : t(
                              "أنشئ موجزًا بالذكاء الاصطناعي",
                              "Generate an AI brief",
                            )}
                      </button>
                      <p className="help-text">
                        {t(
                          "يرسل الوصف إلى نموذج Cloudflare. لا تضف بيانات حساسة. النتيجة مسودة تحتاج مراجعتك، والحصة المجانية محدودة.",
                          "Your description is sent to a Cloudflare model. Avoid sensitive data. Results are drafts for your review; free usage is limited.",
                        )}
                      </p>
                    </section>
                    <section className="panel brief-output">
                      <div className="panel-title">
                        <h2>{t("موجز قابل للتعديل", "Your editable brief")}</h2>
                        <span className="badge">
                          {isExample
                            ? t("مثال مكتوب مسبقًا", "Prewritten sample")
                            : t("مسودة", "Draft")}
                        </span>
                      </div>
                      {brief ? (
                        <>
                          <label className="sr-only" htmlFor="brief">
                            {t("نص الموجز", "Brief text")}
                          </label>
                          <textarea
                            id="brief"
                            value={brief}
                            maxLength={20000}
                            onChange={(e) => setBrief(e.target.value)}
                            rows={17}
                          />
                          <div className="brief-actions">
                            <button onClick={() => saveBrief()} disabled={busy}>
                              <Check />
                              {activeBriefId
                                ? t("حفظ التعديلات", "Save changes")
                                : t("حفظ الموجز", "Save brief")}
                            </button>
                            {activeBriefId && (
                              <button
                                className="secondary"
                                onClick={() => saveBrief(true)}
                                disabled={busy}
                              >
                                {t("حفظ نسخة", "Save a copy")}
                              </button>
                            )}
                            <button
                              className="secondary"
                              onClick={() =>
                                download("qirvexa-brief.md", brief)
                              }
                            >
                              <ArrowDownToLine />
                              {t("تنزيل", "Download")}
                            </button>
                            <button
                              className="icon-button"
                              aria-label={t("نسخ الموجز", "Copy brief")}
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(brief);
                                  notify(t("نُسخ الموجز.", "Brief copied."));
                                } catch {
                                  notify(
                                    t(
                                      "تعذر النسخ؛ يمكنك تحديد النص ونسخه.",
                                      "Copy failed. Select the text and copy it manually.",
                                    ),
                                  );
                                }
                              }}
                            >
                              <Copy />
                            </button>
                          </div>
                          {aiProjectId && (
                            <div className="ai-attach">
                              <button
                                className="secondary"
                                disabled={
                                  workspace.saving ||
                                  workspace.loading ||
                                  workspace.error
                                }
                                onClick={async () => {
                                  const request = currentRequest();
                                  const details =
                                    workspace.details.find(
                                      (d) => d.project_id === aiProjectId,
                                    ) ?? emptyDetails(aiProjectId);
                                  const ok = await workspace.saveDetails({
                                    ...details,
                                    brief,
                                    updated_at: new Date().toISOString(),
                                  });
                                  if (isCurrent(request))
                                    notify(
                                      ok
                                        ? t(
                                            "رُبط الموجز بالمشروع.",
                                            "Brief attached to the project.",
                                          )
                                        : t(
                                            "لم يُربط الموجز. أعد المحاولة.",
                                            "Brief was not attached. Retry.",
                                          ),
                                    );
                                }}
                              >
                                <Check />
                                {t(
                                  "ربط الموجز بالمشروع",
                                  "Attach brief to project",
                                )}
                              </button>
                              <p>
                                {t(
                                  "يستبدل موجز المشروع بعد مراجعتك، دون تعديل المهام أو المبالغ.",
                                  "Replaces the project brief after your review; tasks and amounts stay unchanged.",
                                )}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="empty brief-empty">
                          <Sparkles />
                          <h3>
                            {t(
                              "فكرتك تدخل هنا. خطة أوضح تخرج.",
                              "An idea in. A clearer plan out.",
                            )}
                          </h3>
                          <p>
                            {t(
                              "ستحصل على هدف ونطاق ومخرجات ومعايير قبول وأسئلة مهمة.",
                              "Get a goal, scope, deliverables, acceptance criteria and open questions.",
                            )}
                          </p>
                        </div>
                      )}
                    </section>
                  </div>
                  <section className="panel saved-briefs">
                    <div className="panel-title">
                      <h2>{t("الموجزات المحفوظة", "Saved briefs")}</h2>
                      <span>{briefs.length}</span>
                    </div>
                    {briefs.length ? (
                      <div className="brief-list">
                        {briefs.map((b) => (
                          <button
                            key={b.id}
                            className="saved-brief"
                            onClick={() => {
                              setPrompt(b.title);
                              setBrief(b.content);
                              setIsExample(false);
                              setActiveBriefId(b.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <span>
                              <strong>{b.title}</strong>
                              <small>{date(b.created_at)}</small>
                            </span>
                            <ArrowUpRight />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="section-note">
                        {t(
                          "احفظ أول موجز لتعود إليه لاحقًا.",
                          "Save a brief to return to it later.",
                        )}
                      </p>
                    )}
                  </section>
                </>
              )}
              {view === "settings" && (
                <div className="settings-grid">
                  <section className="panel settings-panel">
                    <div className="panel-title">
                      <h2>
                        {t("حسابك ومساحة عملك", "Your account and workspace")}
                      </h2>
                      {session ? <Cloud /> : <HardDrive />}
                    </div>
                    <div className="account-summary">
                      <span className="profile-avatar big">
                        {session ? "U" : "D"}
                      </span>
                      <div>
                        <h3>
                          {session?.user.email ||
                            t("مساحة على هذا الجهاز", "Device workspace")}
                        </h3>
                        <p>
                          {session
                            ? t(
                                "المشاريع والموجزات محفوظة في حسابك.",
                                "Projects and briefs are saved in your account.",
                              )
                            : t(
                                "مشاريعك ومهامك محفوظة في هذا المتصفح. سجّل الدخول للحفظ في حساب مستقل.",
                                "Projects and tasks are stored in this browser. Sign in for a separate account workspace.",
                              )}
                        </p>
                      </div>
                    </div>
                    {session && !recoveryActive ? (
                      <button className="secondary" onClick={logout}>
                        <LogOut />
                        {t("تسجيل الخروج", "Sign out")}
                      </button>
                    ) : (
                      <AuthPanel
                        key={session?.user.id ?? "guest"}
                        ar={ar}
                        recovery={recoveryActive}
                        recoveryOwner={session?.user.id}
                        onRecovered={() => {
                          if (
                            !session ||
                            currentUserId.current !== session.user.id
                          )
                            return;
                          finishRecovery();
                          notify(
                            t("تم تحديث كلمة المرور.", "Password updated."),
                          );
                        }}
                      />
                    )}
                    <p className="help-text">
                      {t(
                        "تسجيل الدخول لا ينقل بيانات العرض تلقائيًا إلى حسابك. يمكنك إضافة مشاريعك أو تحميل الأمثلة بنفسك.",
                        "Signing in does not automatically upload guest data. Add your projects or load samples in your account.",
                      )}
                    </p>
                  </section>
                  <section className="panel settings-panel">
                    <div className="panel-title">
                      <h2>{t("تفضيلات العرض", "Display preferences")}</h2>
                      <Settings />
                    </div>
                    <label className="setting-row">
                      <span>
                        <strong>
                          {t("لغة الواجهة", "Interface language")}
                        </strong>
                        <small>
                          {t(
                            "اتجاه الكتابة يتغير تلقائيًا",
                            "Reading direction changes automatically",
                          )}
                        </small>
                      </span>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value as "ar" | "en")}
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                    <div className="setting-row">
                      <span>
                        <strong>{t("بيانات الأمثلة", "Sample data")}</strong>
                        <small>
                          {t(
                            "أسماء ومبالغ توضيحية لتجربة الوظائف",
                            "Fictional names and amounts to explore the app",
                          )}
                        </small>
                      </span>
                      <button
                        className="secondary"
                        disabled={busy || projects.length > 0}
                        onClick={seed}
                      >
                        {t("تحميل", "Load")}
                      </button>
                    </div>
                    <p className="help-text">
                      {t(
                        "تحميل الأمثلة متاح لمساحة فارغة فقط. جميع الأرقام للعرض ولا تمثل نشاطًا تجاريًا حقيقيًا.",
                        "Samples can be loaded into an empty workspace. All sample figures are illustrative, not business claims.",
                      )}
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>Qirvexa © {new Date().getFullYear()}</span>
            <span>
              {t("وضوح من الفكرة إلى التسليم", "Clarity from idea to delivery")}
            </span>
          </footer>
        </main>
      </div>
      {editing && (
        <Dialog
          title={
            editing === "new"
              ? t("مشروع جديد", "New project")
              : t("تعديل المشروع", "Edit project")
          }
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form onSubmit={saveProject}>
            <div className="form-grid">
              <label className="full">
                {t("اسم المشروع", "Project name")}
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={editing === "new" ? "" : editing.name}
                  autoFocus
                />
              </label>
              <label className="full">
                {t("العميل", "Client")}
                <input
                  name="client"
                  list="project-client-names"
                  required
                  maxLength={100}
                  defaultValue={editing === "new" ? "" : editing.client}
                />
                <datalist id="project-client-names">
                  {[
                    ...new Set([
                      ...projects.map((p) => p.client),
                      ...workspace.clients.map((c) => c.name),
                    ]),
                  ].map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>
              <label>
                {t("القيمة بالريال", "Amount in SAR")}
                <input
                  type="number"
                  name="amount"
                  required
                  min="0"
                  max="999999999"
                  step="0.01"
                  defaultValue={editing === "new" ? "" : editing.amount}
                />
              </label>
              <label>
                {t("موعد التسليم", "Due date")}
                <input
                  type="date"
                  name="due_date"
                  required
                  defaultValue={editing === "new" ? "" : editing.due_date}
                />
              </label>
              <label>
                {t("نوع المشروع", "Project type")}
                <select
                  name="category"
                  defaultValue={editing === "new" ? "web" : editing.category}
                >
                  <option value="web">{t("موقع", "Website")}</option>
                  <option value="app">{t("تطبيق", "Application")}</option>
                  <option value="design">{t("تصميم", "Design")}</option>
                  <option value="commerce">{t("متجر", "Store")}</option>
                </select>
              </label>
              <label>
                {t("الحالة", "Status")}
                <select
                  name="status"
                  defaultValue={editing === "new" ? "active" : editing.status}
                >
                  {(["active", "review", "done"] as const).map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox full">
                <input
                  type="checkbox"
                  name="paid"
                  defaultChecked={editing === "new" ? false : editing.paid}
                />
                {t("تم تحصيل المبلغ", "Payment collected")}
              </label>
            </div>
            <div className="dialog-actions">
              <button type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="spin" /> : <Check />}
                {t("حفظ المشروع", "Save project")}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                {t("إلغاء", "Cancel")}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title={t("حذف المشروع؟", "Delete project?")}
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            {t(
              "سيُحذف هذا المشروع من مساحة عملك. لا يمكن التراجع عن الحذف.",
              "This project will be removed from your workspace. This cannot be undone.",
            )}
          </p>
          <strong>{splitName(deleting.name, ar)}</strong>
          <div className="dialog-actions">
            <button
              className="destructive"
              onClick={removeProject}
              disabled={busy}
            >
              <Trash2 />
              {t("حذف المشروع", "Delete project")}
            </button>
            <button
              className="secondary"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              {t("إلغاء", "Cancel")}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
