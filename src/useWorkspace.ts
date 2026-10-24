import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./backend";
import { readLocal } from "./model";
import {
  emptyWorkspace,
  isWorkspace,
  type Workspace,
  type Task,
  type ClientProfile,
  type ProjectDetails,
} from "./workspaceModel";

const key = "qirvexa.workspace.v1";
export async function readOwnerRows<T>(
  table: string,
  owner: string,
  order = "id",
) {
  const rows: T[] = [];
  if (!supabase) return { data: rows, error: true };
  for (let start = 0; start < 20000; start += 500) {
    const result = await supabase
      .from(table)
      .select("*")
      .eq("user_id", owner)
      .order(order)
      .range(start, start + 499);
    if (result.error) return { data: [] as T[], error: true };
    const batch = (result.data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < 500) return { data: rows, error: false };
  }
  // Never silently present incomplete totals at the bounded workspace ceiling.
  return { data: [] as T[], error: true };
}
export function useWorkspace(session: Session | null) {
  const owner = session?.user.id ?? null;
  const identity = useRef({ owner, epoch: 0 });
  if (identity.current.owner !== owner)
    identity.current = { owner, epoch: identity.current.epoch + 1 };
  const renderEpoch = identity.current.epoch;
  const [state, setState] = useState<{
    owner: string | null;
    value: Workspace;
  }>({ owner, value: emptyWorkspace() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const alive = useRef(true);
  const locked = useRef(false);
  const current = (epoch: number) =>
    alive.current && identity.current.epoch === epoch;
  const value = state.owner === owner ? state.value : emptyWorkspace();
  useEffect(() => {
    alive.current = true;
    let active = true;
    const epoch = identity.current.epoch;
    locked.current = false;
    setSaving(false);
    setError(false);
    setState({ owner, value: emptyWorkspace() });
    if (!owner || !supabase) {
      setState({ owner, value: readLocal(key, emptyWorkspace(), isWorkspace) });
      setLoading(false);
    } else {
      setLoading(true);
      Promise.all([
        readOwnerRows<Task>("qirvexa_tasks", owner, "id"),
        readOwnerRows<ProjectDetails>(
          "qirvexa_project_details",
          owner,
          "project_id",
        ),
        readOwnerRows<ClientProfile>("qirvexa_clients", owner, "id"),
      ])
        .then(([tasks, details, clients]) => {
          if (!active || !current(epoch)) return;
          const next = {
            tasks: tasks.data ?? [],
            details: details.data ?? [],
            clients: clients.data ?? [],
          };
          if (
            tasks.error ||
            details.error ||
            clients.error ||
            !isWorkspace(next)
          )
            setError(true);
          else setState({ owner, value: next });
        })
        .catch(() => {
          if (active && current(epoch)) setError(true);
        })
        .finally(() => {
          if (active && current(epoch)) setLoading(false);
        });
    }
    return () => {
      active = false;
      alive.current = false;
      identity.current.epoch++;
    };
  }, [owner, retry]);
  async function write(
    table: string,
    row: Task | ClientProfile | ProjectDetails,
    remove = false,
  ) {
    if (
      locked.current ||
      loading ||
      error ||
      owner !== identity.current.owner ||
      renderEpoch !== identity.current.epoch
    )
      return false;
    const epoch = identity.current.epoch;
    const requestOwner = owner;
    locked.current = true;
    setSaving(true);
    try {
      const field =
        table === "qirvexa_tasks"
          ? "tasks"
          : table === "qirvexa_clients"
            ? "clients"
            : "details";
      const idKey = field === "details" ? "project_id" : "id";
      const next = {
        ...value,
        [field]: [
          ...(value[field] as unknown as Record<string, unknown>[]).filter(
            (item) =>
              item[idKey] !==
              (row as unknown as Record<string, unknown>)[idKey],
          ),
          ...(remove ? [] : [row]),
        ],
      } as Workspace;
      if (!isWorkspace(next)) return false;
      if (requestOwner && supabase) {
        const query = remove
          ? supabase
              .from(table)
              .delete()
              .eq("id", (row as Task | ClientProfile).id)
              .eq("user_id", requestOwner)
          : supabase
              .from(table)
              .upsert({ ...row, user_id: requestOwner })
              .select()
              .single();
        const result = await query;
        if (!current(epoch)) return false;
        if (result.error) return false;
      }
      if (!current(epoch)) return false;
      if (!requestOwner) {
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          return false;
        }
      }
      setState({ owner: requestOwner, value: next });
      return true;
    } catch {
      return false;
    } finally {
      if (current(epoch)) {
        locked.current = false;
        setSaving(false);
      }
    }
  }
  return {
    ...value,
    loading,
    error,
    saving,
    retry: () => setRetry((n) => n + 1),
    saveTask: (task: Task) => write("qirvexa_tasks", task),
    deleteTask: (task: Task) => write("qirvexa_tasks", task, true),
    saveDetails: (details: ProjectDetails) =>
      write("qirvexa_project_details", details),
    saveClient: (client: ClientProfile) => write("qirvexa_clients", client),
    deleteClient: (client: ClientProfile) =>
      write("qirvexa_clients", client, true),
  };
}
export type WorkspaceStore = ReturnType<typeof useWorkspace>;
