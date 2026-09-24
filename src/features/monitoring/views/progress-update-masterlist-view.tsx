"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import { useMonitoringStore } from "../stores/monitoring-store";
import type { ProgressUpdate, ProgressUpdateFilters, ProgressUpdateSortKey } from "../types/progress-update";

import styles from "./progress-masterlist.module.css";

const EMPTY_FILTERS: ProgressUpdateFilters = {
  search: "",
  status: "all",
  reportType: "all",
  barangay: "all",
};

const STATUS_OPTIONS = ["Draft", "Submitted", "Verified", "Returned", "Archived"];
const TYPE_OPTIONS = ["Weekly", "Bi-weekly", "Monthly", "Milestone", "Ad-hoc"];

function statusClass(status: string) {
  if (status === "Verified") return styles.active;
  if (status === "Returned") return styles.danger;
  if (status === "Draft") return styles.warning;
  if (status === "Submitted") return styles.info;
  if (status === "Archived") return "";
  return "";
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const sStr = s.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  const eStr = e.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  return `${sStr} – ${eStr}`;
}

function filterUpdates(list: ProgressUpdate[], filters: ProgressUpdateFilters): ProgressUpdate[] {
  return list.filter((item) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${item.projectTitle} ${item.code} ${item.projectCode} ${item.barangay ?? ""} ${item.submittedBy} ${item.contractor ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.reportType !== "all" && item.reportType !== filters.reportType) return false;
    if (filters.barangay !== "all") {
      if (filters.barangay === "municipal" && item.barangay !== null) return false;
      if (filters.barangay !== "municipal" && item.barangay !== filters.barangay) return false;
    }
    return true;
  });
}

function sortUpdates(list: ProgressUpdate[], key: ProgressUpdateSortKey, dir: "asc" | "desc"): ProgressUpdate[] {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "code": cmp = a.code.localeCompare(b.code); break;
      case "project": cmp = a.projectTitle.localeCompare(b.projectTitle); break;
      case "barangay": cmp = (a.barangay ?? "").localeCompare(b.barangay ?? ""); break;
      case "type": cmp = a.reportType.localeCompare(b.reportType); break;
      case "status": cmp = a.status.localeCompare(b.status); break;
      case "periodEnd": cmp = a.periodEnd.localeCompare(b.periodEnd); break;
      case "submittedBy": cmp = a.submittedBy.localeCompare(b.submittedBy); break;
      case "physical": cmp = a.currentPhysical - b.currentPhysical; break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

const columns = [
  "project",
  "code",
  "barangay",
  "type",
  "status",
  "period",
  "submittedBy",
  "physical",
  "financial",
  "slippage",
  "actions",
] as const;
type Column = (typeof columns)[number];

const labels: Record<Column, string> = {
  project: "Project",
  code: "Report Code",
  barangay: "Barangay",
  type: "Type",
  status: "Status",
  period: "Period",
  submittedBy: "Submitted By",
  physical: "Physical %",
  financial: "Financial %",
  slippage: "Slippage",
  actions: "",
};

const sortable: Partial<Record<Column, ProgressUpdateSortKey>> = {
  project: "project",
  code: "code",
  barangay: "barangay",
  type: "type",
  status: "status",
  period: "periodEnd",
  submittedBy: "submittedBy",
  physical: "physical",
};

export function ProgressUpdateMasterlistView() {
  const progressUpdates = useMonitoringStore((state) => state.progressUpdates);
  const [filters, setFilters] = useState<ProgressUpdateFilters>(EMPTY_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sortKey, setSortKey] = useState<ProgressUpdateSortKey>("periodEnd");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const deferredSearch = useDeferredValue(filters.search);

  const filtered = useMemo(
    () => sortUpdates(filterUpdates(progressUpdates, { ...filters, search: deferredSearch }), sortKey, direction),
    [progressUpdates, filters, deferredSearch, sortKey, direction],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && value !== "all").length;

  const setFilter = (key: keyof ProgressUpdateFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const reset = () => { setFilters(EMPTY_FILTERS); setPage(1); };
  const doSort = (key: ProgressUpdateSortKey) => {
    if (sortKey === key) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDirection("asc"); }
  };

  const th = (column: Column) => {
    const sk = sortable[column];
    return (
      <th key={column}>
        {sk ? (
          <button type="button" className={styles.sortButton} onClick={() => doSort(sk)}>
            {labels[column]} <ChevronsUpDown size={12} />
          </button>
        ) : labels[column]}
      </th>
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Progress Updates</h1>
            <p>Track physical and financial progress reports across all monitored projects.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/monitoring/progress/new">
              <Plus size={16} /> New Progress Report
            </Link>
            <button type="button" className={styles.btnSecondary}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search progress updates"
                placeholder="Search project, code, barangay, reporter, or contractor"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </label>
            <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
              <SelectTrigger className={styles.compactSelect} aria-label="Report status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.reportType} onValueChange={(v) => setFilter("reportType", v)}>
              <SelectTrigger className={styles.compactSelect} aria-label="Report type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPE_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              type="button"
              className={`${styles.secondaryButton} ${styles.filterButton}`}
              onClick={() => setMoreOpen((v) => !v)}
            >
              <Filter size={14} /> More filters{" "}
              {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
            </button>
            {activeCount > 0 && (
              <button type="button" className={styles.secondaryButton} onClick={reset}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {moreOpen && (
            <div className={styles.advancedPanel}>
              <h3>Advanced filters</h3>
              <div className={styles.filterGrid}>
                <label className={styles.field}>
                  <span>Barangay</span>
                  <Select value={filters.barangay} onValueChange={(v) => setFilter("barangay", v)}>
                    <SelectTrigger><SelectValue placeholder="All barangays" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All barangays</SelectItem>
                      <SelectItem value="municipal">Municipality-wide only</SelectItem>
                      {MATNOG_BARANGAYS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === progressUpdates.length
                ? `${filtered.length.toLocaleString()} progress reports`
                : `${filtered.length.toLocaleString()} of ${progressUpdates.length.toLocaleString()} progress reports`}
            </strong>
            <span className={styles.scopeBadge}><ClipboardList size={13} /> All Progress Reports</span>
          </div>

          {rows.length ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>{columns.map(th)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((update) => {
                      const physDelta = update.currentPhysical - update.previousPhysical;
                      const finDelta = update.currentFinancial - update.previousFinancial;
                      return (
                        <tr key={update.id}>
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/monitoring/progress/${update.id}`}>{update.projectTitle}</Link>
                              <small>{update.projectCode} · {update.contractor ?? "No contractor"}</small>
                            </div>
                          </td>
                          <td className={styles.mono}>{update.code}</td>
                          <td>{update.barangay ?? "Municipality-wide"}</td>
                          <td><span className={styles.badge}>{update.reportType}</span></td>
                          <td><span className={`${styles.badge} ${statusClass(update.status)}`}>{update.status}</span></td>
                          <td>{formatPeriod(update.periodStart, update.periodEnd)}</td>
                          <td>{update.submittedBy}</td>
                          <td>
                            <div className={styles.progressBar}>
                              <div className={styles.progressTrack}>
                                <div className={styles.progressFill} style={{ width: `${update.currentPhysical}%` }} />
                              </div>
                              <span>{update.currentPhysical}%</span>
                            </div>
                            {physDelta > 0 && (
                              <span className={`${styles.delta} ${styles.deltaUp}`}>+{physDelta}%</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.progressBar}>
                              <div className={styles.progressTrack}>
                                <div className={styles.progressFill} style={{ width: `${update.currentFinancial}%` }} />
                              </div>
                              <span>{update.currentFinancial}%</span>
                            </div>
                            {finDelta > 0 && (
                              <span className={`${styles.delta} ${styles.deltaUp}`}>+{finDelta}%</span>
                            )}
                          </td>
                          <td>
                            {update.slippageDays > 0 ? (
                              <span className={`${styles.badge} ${styles.danger}`}>{update.slippageDays}d behind</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.active}`}>On track</span>
                            )}
                          </td>
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/monitoring/progress/${update.id}`}>View report</Link>
                                <Link href={`/monitoring/progress/${update.id}/edit`}>Edit report</Link>
                                <Link href={`/projects/${update.projectId}`}>View project</Link>
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <span>Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className={styles.compactSelect} aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span>
                  {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
                </span>
                <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                  <ChevronLeft size={15} />
                </button>
                <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">
                  <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <div>
                <AlertTriangle size={28} />
                <h3>No progress reports found</h3>
                <p>Adjust the search or clear the active filters.</p>
                <button type="button" className={styles.secondaryButton} onClick={reset}>Reset filters</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
