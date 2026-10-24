import { describe, expect, it } from "vitest";
import {
  agenda,
  clientNames,
  emptyWorkspace,
  financeSummary,
  isWorkspace,
  localDay,
  taskProgress,
  validDate,
  type Task,
} from "./workspaceModel";
import type { Project } from "./model";
const project = (id: string, paid = false, amount = 1200): Project => ({
  id,
  name: id,
  client: "Original / Client",
  category: "web",
  status: "active",
  amount,
  paid,
  due_date: "2026-10-23",
  created_at: "2026-10-01T00:00:00Z",
});
const task = (
  id: string,
  status: Task["status"] = "todo",
  project_id = "p",
): Task => ({
  id,
  project_id,
  title: id,
  status,
  priority: "normal",
  due_date: "2026-10-23",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
});
describe("workspace business boundaries", () => {
  it("uses the Riyadh day across the UTC midnight boundary", () => {
    expect(localDay(new Date("2026-10-22T22:30:00Z"))).toBe("2026-10-23");
    const items = agenda(
      [project("p")],
      [
        task("open"),
        task("closed", "done"),
        task("orphan", "todo", "other-owner-project"),
      ],
      new Date("2026-10-22T22:30:00Z"),
    );
    expect(items.map((i) => i.id).sort()).toEqual(["open", "p"]);
    expect(items.every((i) => i.today && !i.overdue)).toBe(true);
  });
  it("excludes completed projects but retains their real unfinished tasks", () => {
    const p = { ...project("p"), status: "done" as const };
    const items = agenda(
      [p],
      [task("followup")],
      new Date("2026-10-24T12:00:00Z"),
    );
    expect(items.map((i) => i.id)).toEqual(["followup"]);
    expect(items[0].overdue).toBe(true);
  });
  it("calculates progress from real tasks without invented empty progress", () => {
    expect(taskProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
    expect(
      taskProgress([task("a", "done"), task("b", "doing"), task("c")]),
    ).toEqual({ done: 1, total: 3, percent: 33 });
  });
  it("reconciles contract and marked-paid cents without fabricating receipts", () => {
    expect(
      financeSummary([project("a", true, 0.1), project("b", false, 0.2)]),
    ).toEqual({ total: 0.3, paid: 0.1, outstanding: 0.2, unpaid: 1 });
    expect(financeSummary([])).toEqual({
      total: 0,
      paid: 0,
      outstanding: 0,
      unpaid: 0,
    });
  });
  it("preserves exact original client identity rather than merging translated names", () => {
    const a = project("a"),
      b = { ...project("b"), client: "Original" };
    expect(clientNames([a, b], [])).toHaveLength(2);
  });
  it("rejects corrupt task and date state before storage or cloud writes", () => {
    expect(validDate("2026-02-31")).toBe(false);
    expect(validDate("2026-02-28")).toBe(true);
    const value = { ...emptyWorkspace(), tasks: [task("a")] };
    expect(isWorkspace(value)).toBe(true);
    expect(
      isWorkspace({ ...value, tasks: [{ ...task("a"), status: "injected" }] }),
    ).toBe(false);
    expect(
      isWorkspace({
        ...value,
        tasks: [{ ...task("a"), due_date: "2026-02-31" }],
      }),
    ).toBe(false);
    expect(
      isWorkspace({ ...value, tasks: [{ ...task("a"), title: " " }] }),
    ).toBe(false);
  });
});
