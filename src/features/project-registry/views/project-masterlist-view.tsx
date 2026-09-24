"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
  Filter,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { ProjectFilters, ProjectSortKey } from "../types/project";
import {
  EMPTY_PROJECT_FILTERS,
  filterProjects,
  filterProjectsByScope,
  formatCompactCurrency,
  formatShortDate,
  sortProjects,
} from "../utils/project-utils";

import styles from "./project-masterlist.module.css";

const columns = [
  "project",
  "code",
  "barangay",
  "type",
  "department",
  "status",
  "stage",
  "budget",
  "progress",
  "risk",
  "target",
  "actions",
] as const;
type Column = (typeof columns)[number];
const labels: Record<Column, string> = {
  project: "Project",
  code: "Code",
  barangay: "Barangay",
  type: "Type",
  department: "Department",
  status: "Status",
  stage: "Stage",
  budget: "Budget",
  progress: "Progress",
  risk: "Risk",
  target: "Target",
  actions: "",
};
const fixed = new Set<Column>(["project", "actions"]);
const defaultHidden = new Set<Column>(["department", "target"]);
const sortable: Partial<Record<Column, ProjectSortKey>> = {
  project: "title",
  code: "code",
  barangay: "barangay",
  type: "code",
  department: "department",
  budget: "budget",
  risk: "riskLevel",
  target: "targetCompletion",
};

const PIPELINE_OPTIONS = ["Draft", "Submitted", "Under Review", "Prioritized", "Funded", "Deferred", "Rejected"];
const STAGE_OPTIONS = ["Planning", "Readiness", "Procurement", "Implementation", "Inspection", "Closeout", "Completed", "On Hold"];
const RISK_OPTIONS = ["Low", "Moderate", "High", "Critical"];

function statusClass(status: string) {
  if (status === "Funded" || status === "Completed") return styles.active;
  if (status === "Rejected" || status === "Critical") return styles.danger;
  if (status === "Deferred" || status === "On Hold" || status === "High") return styles.warning;
  if (status === "Under Review" || status === "Moderate") return styles.info;
  return "";
}

export function ProjectMasterlistView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_PROJECT_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(() => {
    const initial = new Set(columns as readonly Column[]);
    for (const c of defaultHidden) initial.delete(c);
    return initial;
  });
  const [sortKey, setSortKey] = useState<ProjectSortKey>("title");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const deferredSearch = useDeferredValue(filters.search);

  const scoped = useMemo(
    () => filterProjectsByScope(projects, fiscalYear, jurisdiction),
    [projects, fiscalYear, jurisdiction],
  );
  const filtered = useMemo(
    () => sortProjects(filterProjects(scoped, { ...filters, search: deferredSearch }), sortKey, direction),
    [scoped, filters, deferredSearch, sortKey, direction],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && value !== "all").length;
  const show = (c: Column) => visible.has(c);

  const setFilter = (key: keyof ProjectFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const reset = () => { setFilters(EMPTY_PROJECT_FILTERS); setPage(1); };
  const doSort = (key: ProjectSortKey) => {
    if (sortKey === key) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDirection("asc"); }
  };

  const scopeLabel = jurisdiction === "municipal"
    ? "Municipality-wide"
    : jurisdiction === "all-barangays"
      ? "All Barangays"
      : jurisdiction;

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
            <h1>All Projects</h1>
            <p>Search, filter, and manage the municipality&#39;s project portfolio across all barangays.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/projects/new">
              <Plus size={16} /> New Proposal
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
                aria-label="Search projects"
                placeholder="Search project name, code, barangay, or contractor"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </label>
            <Select value={filters.pipelineStatus} onValueChange={(v) => setFilter("pipelineStatus", v)}>
              <SelectTrigger className={styles.compactSelect} aria-label="Pipeline status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PIPELINE_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.deliveryStage} onValueChange={(v) => setFilter("deliveryStage", v)}>
              <SelectTrigger className={styles.compactSelect} aria-label="Delivery stage">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGE_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
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
            <div className={styles.columnsMenu}>
              <button type="button" className={styles.secondaryButton} onClick={() => setColumnsOpen((v) => !v)}>
                <Columns3 size={14} /> Columns
              </button>
              {columnsOpen && (
                <div className={styles.columnsPopover}>
                  {columns.map((c) => (
                    <label key={c}>
                      <input
                        type="checkbox"
                        checked={visible.has(c)}
                        disabled={fixed.has(c)}
                        onChange={() =>
                          setVisible((cur) => {
                            const next = new Set(cur);
                            next.has(c) ? next.delete(c) : next.add(c);
                            return next;
                          })
                        }
                      />
                      {labels[c] || "Actions"}
                    </label>
                  ))}
                </div>
              )}
            </div>
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
                  <span>Funding Source</span>
                  <Select value={filters.fundingSource} onValueChange={(v) => setFilter("fundingSource", v)}>
                    <SelectTrigger><SelectValue placeholder="All sources" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      {["20% Development Fund", "General Fund", "Local DRRM Fund", "Special Education Fund", "Barangay Development Fund", "National Government Grant", "Provincial Assistance"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className={styles.field}>
                  <span>Project Type</span>
                  <Select value={filters.projectType} onValueChange={(v) => setFilter("projectType", v)}>
                    <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {["Road and transport", "Water supply", "Health facility", "Disaster resilience", "Coastal protection", "Education facility", "Drainage", "Livelihood", "Public building", "Digital service", "Electrification", "Fishery", "Social welfare", "Irrigation"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className={styles.field}>
                  <span>Risk Level</span>
                  <Select value={filters.riskLevel} onValueChange={(v) => setFilter("riskLevel", v)}>
                    <SelectTrigger><SelectValue placeholder="All risk levels" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All risk levels</SelectItem>
                      {RISK_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
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
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scoped.length
                ? `${filtered.length.toLocaleString()} projects`
                : `${filtered.length.toLocaleString()} of ${scoped.length.toLocaleString()} projects`}
            </strong>
            <span className={styles.scopeBadge}><MapPin size={13} /> {scopeLabel}</span>
          </div>

          {rows.length ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>{columns.filter(show).map(th)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id}>
                        {show("project") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/projects/${p.id}`}>{p.title}</Link>
                              <small>{p.implementingDepartment}</small>
                            </div>
                          </td>
                        )}
                        {show("code") && <td className={styles.mono}>{p.code}</td>}
                        {show("barangay") && <td>{p.barangay ?? "Municipality-wide"}</td>}
                        {show("type") && <td>{p.projectType}</td>}
                        {show("department") && <td>{p.implementingDepartment}</td>}
                        {show("status") && (
                          <td><span className={`${styles.badge} ${statusClass(p.pipelineStatus)}`}>{p.pipelineStatus}</span></td>
                        )}
                        {show("stage") && (
                          <td><span className={`${styles.badge} ${statusClass(p.deliveryStage)}`}>{p.deliveryStage}</span></td>
                        )}
                        {show("budget") && <td className={styles.mono}>{formatCompactCurrency(p.budget)}</td>}
                        {show("progress") && (
                          <td>
                            <div className={styles.progressBar}>
                              <div className={styles.progressTrack}>
                                <div className={styles.progressFill} style={{ width: `${p.physicalProgress}%` }} />
                              </div>
                              <span>{p.physicalProgress}%</span>
                            </div>
                          </td>
                        )}
                        {show("risk") && (
                          <td><span className={`${styles.badge} ${statusClass(p.riskLevel)}`}>{p.riskLevel}</span></td>
                        )}
                        {show("target") && <td>{formatShortDate(p.targetCompletion)}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/projects/${p.id}`}>View project</Link>
                                <Link href={`/projects/${p.id}/edit`}>Edit project</Link>
                              </div>
                            </details>
                          </td>
                        )}
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
                <h3>No projects found</h3>
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
