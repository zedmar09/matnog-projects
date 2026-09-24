"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardCheck,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import { useMonitoringStore } from "../stores/monitoring-store";
import type { Inspection, InspectionFilters, InspectionSortKey } from "../types/inspection";

import styles from "./inspection-masterlist.module.css";

const EMPTY_FILTERS: InspectionFilters = {
  search: "",
  status: "all",
  inspectionType: "all",
  rating: "all",
  barangay: "all",
  inspector: "all",
};

const STATUS_OPTIONS = ["Scheduled", "In Progress", "Completed", "Follow-up Required", "Cancelled"];
const TYPE_OPTIONS = ["Routine", "Milestone", "Pre-Final", "Final", "Spot Check", "Follow-up"];
const RATING_OPTIONS = ["Satisfactory", "Needs Improvement", "Unsatisfactory", "Not Assessed"];
const INSPECTOR_OPTIONS = [
  "Engr. Carlos M. Reyes",
  "Engr. Maria D. Santos",
  "Ar. Noel B. Fronda",
  "Engr. Rafael T. Dizon",
  "LGOO Ana P. Santos",
];

function statusClass(status: string) {
  if (status === "Completed" || status === "Satisfactory") return styles.active;
  if (status === "Cancelled" || status === "Unsatisfactory") return styles.danger;
  if (status === "Follow-up Required" || status === "Needs Improvement") return styles.warning;
  if (status === "In Progress" || status === "Scheduled") return styles.info;
  return "";
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function filterInspections(list: Inspection[], filters: InspectionFilters): Inspection[] {
  return list.filter((item) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${item.projectTitle} ${item.code} ${item.projectCode} ${item.barangay ?? ""} ${item.inspector} ${item.contractor ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.inspectionType !== "all" && item.inspectionType !== filters.inspectionType) return false;
    if (filters.rating !== "all" && item.overallRating !== filters.rating) return false;
    if (filters.barangay !== "all") {
      if (filters.barangay === "municipal" && item.barangay !== null) return false;
      if (filters.barangay !== "municipal" && item.barangay !== filters.barangay) return false;
    }
    if (filters.inspector !== "all" && item.inspector !== filters.inspector) return false;
    return true;
  });
}

function sortInspections(list: Inspection[], key: InspectionSortKey, dir: "asc" | "desc"): Inspection[] {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "code": cmp = a.code.localeCompare(b.code); break;
      case "project": cmp = a.projectTitle.localeCompare(b.projectTitle); break;
      case "barangay": cmp = (a.barangay ?? "").localeCompare(b.barangay ?? ""); break;
      case "type": cmp = a.inspectionType.localeCompare(b.inspectionType); break;
      case "status": cmp = a.status.localeCompare(b.status); break;
      case "scheduledDate": cmp = a.scheduledDate.localeCompare(b.scheduledDate); break;
      case "inspector": cmp = a.inspector.localeCompare(b.inspector); break;
      case "rating": cmp = a.overallRating.localeCompare(b.overallRating); break;
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
  "scheduledDate",
  "inspector",
  "progress",
  "rating",
  "photos",
  "actions",
] as const;
type Column = (typeof columns)[number];

const labels: Record<Column, string> = {
  project: "Project",
  code: "Inspection Code",
  barangay: "Barangay",
  type: "Type",
  status: "Status",
  scheduledDate: "Date",
  inspector: "Inspector",
  progress: "Physical %",
  rating: "Rating",
  photos: "Photos",
  actions: "",
};

const sortable: Partial<Record<Column, InspectionSortKey>> = {
  project: "project",
  code: "code",
  barangay: "barangay",
  type: "type",
  status: "status",
  scheduledDate: "scheduledDate",
  inspector: "inspector",
  rating: "rating",
};

export function InspectionMasterlistView() {
  const inspections = useMonitoringStore((state) => state.inspections);
  const [filters, setFilters] = useState<InspectionFilters>(EMPTY_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sortKey, setSortKey] = useState<InspectionSortKey>("scheduledDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const deferredSearch = useDeferredValue(filters.search);

  const filtered = useMemo(
    () => sortInspections(filterInspections(inspections, { ...filters, search: deferredSearch }), sortKey, direction),
    [inspections, filters, deferredSearch, sortKey, direction],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && value !== "all").length;

  const setFilter = (key: keyof InspectionFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const reset = () => { setFilters(EMPTY_FILTERS); setPage(1); };
  const doSort = (key: InspectionSortKey) => {
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
            <h1>Monitoring Inspections</h1>
            <p>Track and manage site inspections across all ongoing municipal projects.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/monitoring/inspections/new">
              <ClipboardCheck size={16} /> New Inspection
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
                aria-label="Search inspections"
                placeholder="Search project, code, barangay, inspector, or contractor"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </label>
            <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
              <SelectTrigger className={styles.compactSelect} aria-label="Inspection status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.inspectionType} onValueChange={(v) => setFilter("inspectionType", v)}>
              <SelectTrigger className={styles.compactSelect} aria-label="Inspection type">
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
                  <span>Rating</span>
                  <Select value={filters.rating} onValueChange={(v) => setFilter("rating", v)}>
                    <SelectTrigger><SelectValue placeholder="All ratings" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ratings</SelectItem>
                      {RATING_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>
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
                <label className={styles.field}>
                  <span>Inspector</span>
                  <Select value={filters.inspector} onValueChange={(v) => setFilter("inspector", v)}>
                    <SelectTrigger><SelectValue placeholder="All inspectors" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All inspectors</SelectItem>
                      {INSPECTOR_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === inspections.length
                ? `${filtered.length.toLocaleString()} inspections`
                : `${filtered.length.toLocaleString()} of ${inspections.length.toLocaleString()} inspections`}
            </strong>
            <span className={styles.scopeBadge}><ClipboardCheck size={13} /> All Inspections</span>
          </div>

          {rows.length ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>{columns.map(th)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((ins) => (
                      <tr key={ins.id}>
                        <td>
                          <div className={styles.nameCell}>
                            <Link href={`/monitoring/inspections/${ins.id}`}>{ins.projectTitle}</Link>
                            <small>{ins.projectCode} · {ins.contractor ?? "No contractor"}</small>
                          </div>
                        </td>
                        <td className={styles.mono}>{ins.code}</td>
                        <td>{ins.barangay ?? "Municipality-wide"}</td>
                        <td><span className={styles.badge}>{ins.inspectionType}</span></td>
                        <td><span className={`${styles.badge} ${statusClass(ins.status)}`}>{ins.status}</span></td>
                        <td>{formatShortDate(ins.scheduledDate)}</td>
                        <td>{ins.inspector}</td>
                        <td>
                          <div className={styles.progressBar}>
                            <div className={styles.progressTrack}>
                              <div className={styles.progressFill} style={{ width: `${ins.physicalProgressAtInspection}%` }} />
                            </div>
                            <span>{ins.physicalProgressAtInspection}%</span>
                          </div>
                        </td>
                        <td><span className={`${styles.badge} ${statusClass(ins.overallRating)}`}>{ins.overallRating}</span></td>
                        <td>{ins.photosCount > 0 ? `${ins.photosCount} photos` : "—"}</td>
                        <td>
                          <details className={styles.rowActions}>
                            <summary className={styles.actionSummary}>
                              <MoreHorizontal size={16} />
                            </summary>
                            <div className={styles.actionMenu}>
                              <Link href={`/monitoring/inspections/${ins.id}`}>View inspection</Link>
                              <Link href={`/monitoring/inspections/${ins.id}/edit`}>Edit inspection</Link>
                              <Link href={`/projects/${ins.projectId}`}>View project</Link>
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
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
                <h3>No inspections found</h3>
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
