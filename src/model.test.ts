import { describe, it, expect } from "vitest";
import {
  sampleProjects,
  filterProjects,
  metrics,
  revenueSeries,
  projectsCSV,
  isProjects,
} from "./model";
const now = new Date("2026-10-21T12:00:00Z");
describe("dashboard business rules", () => {
  it("combines search, status and month filters instead of changing only the label", () => {
    const projects = sampleProjects(now);
    const result = filterProjects(
      projects,
      { query: "Waraq", status: "active", months: 1 },
      now,
    );
    expect(result).toHaveLength(1);
    expect(result[0].client).toContain("Waraq");
    expect(
      filterProjects(
        projects,
        { query: "not-a-client", status: "all", months: 6 },
        now,
      ),
    ).toEqual([]);
  });
  it("excludes future records from the date range", () => {
    const p = sampleProjects(now)[0];
    p.created_at = "2027-01-01T00:00:00Z";
    expect(
      filterProjects([p], { query: "", status: "all", months: 6 }, now),
    ).toHaveLength(0);
  });
  it("revenue chart sums exactly to paid-record metrics", () => {
    const p = sampleProjects(now);
    expect(revenueSeries(p, "en", now).reduce((s, m) => s + m.paid, 0)).toBe(
      metrics(p).revenue,
    );
    expect(metrics(p).active).toBe(5);
    expect(metrics(p).clients).toBe(5);
  });
  it("labels the same Gregorian month boundaries in Arabic and English", () => {
    const arabic = revenueSeries(sampleProjects(now), "ar-SA", now);
    expect(arabic[5].name).toBe(
      new Intl.DateTimeFormat("ar-SA", {
        month: "short",
        calendar: "gregory",
      }).format(new Date(2026, 9, 1)),
    );
    expect(arabic[5].name).not.toBe(
      new Intl.DateTimeFormat("ar-SA", {
        month: "short",
        calendar: "islamic-umalqura",
      }).format(new Date(2026, 9, 1)),
    );
  });
  it("escapes CSV quotes, line breaks and formula injection", () => {
    const p = sampleProjects(now)[0];
    p.name = '=HYPERLINK("x")';
    p.client = 'A,"B"\nC';
    const csv = projectsCSV([p]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"A,""B""\nC"');
  });
  it("rejects corrupt or unsafe local project records", () => {
    const p = sampleProjects(now);
    expect(isProjects(p)).toBe(true);
    expect(isProjects([{ ...p[0], amount: -1 }])).toBe(false);
    expect(isProjects([{ ...p[0], amount: Infinity }])).toBe(false);
    expect(isProjects({})).toBe(false);
  });
});
