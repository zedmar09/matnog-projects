"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardCheck,
  Download,
  ExternalLink,
  Filter,
  FolderKanban,
  Hammer,
  Landmark,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import type { ProjectDeliveryStage, ProjectPipelineStatus, ProjectRiskLevel } from "@/features/project-registry/types/project";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import type { ProjectStatusFilters, ProjectStatusSortKey } from "../types/project-status";
import { compactMoney } from "../utils/fund-utilization-utils";
import {
  calculateProjectStatusTotals,
  countByPipeline,
  countByRisk,
  countByStage,
  createProjectStatusRows,
  filterProjectStatusRows,
  sortProjectStatusRows,
} from "../utils/project-status-utils";

import styles from "./project-status-report.module.css";

const PIPELINE_STATUSES: ProjectPipelineStatus[] = ["Draft", "Submitted", "Under Review", "Prioritized", "Funded", "Deferred", "Rejected"];
const DELIVERY_STAGES: ProjectDeliveryStage[] = ["Planning", "Readiness", "Procurement", "Implementation", "Inspection", "Closeout", "Completed", "On Hold"];
const RISK_LEVELS: ProjectRiskLevel[] = ["Low", "Moderate", "High", "Critical"];
const PAGE_SIZES = [20, 40, 60];

const PIPELINE_COLORS: Record<ProjectPipelineStatus, string> = {
  Draft: "#9aa8a6",
  Submitted: "#5c9bba",
  "Under Review": "#c9a236",
  Prioritized: "#4a8fc9",
  Funded: "#16876a",
  Deferred: "#d8932d",
  Rejected: "#c94c54",
};

const STAGE_COLORS: Record<ProjectDeliveryStage, string> = {
  Planning: "#9aa8a6",
  Readiness: "#6dabc7",
  Procurement: "#c9a236",
  Implementation: "#4a8fc9",
  Inspection: "#8b6fc0",
  Closeout: "#52b495",
  Completed: "#16876a",
  "On Hold": "#d8932d",
};

const RISK_COLORS: Record<ProjectRiskLevel, string> = {
  Low: "#16876a",
  Moderate: "#d8932d",
  High: "#e06c50",
  Critical: "#c94c54",
};

const PIPELINE_BADGE: Record<ProjectPipelineStatus, string> = {
  Draft: "pipelineDraft",
  Submitted: "pipelineReview",
  "Under Review": "pipelineReview",
  Prioritized: "pipelinePrioritized",
  Funded: "pipelineFunded",
  Deferred: "pipelineDeferred",
  Rejected: "pipelineRejected",
};

const RISK_BADGE: Record<ProjectRiskLevel, string> = {
  Low: "riskLow",
  Moderate: "riskModerate",
  High: "riskHigh",
  Critical: "riskCritical",
};

export function ProjectStatusReportView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const setFiscalYear = useShellStore((state) => state.setFiscalYear);

  const [filters, setFilters] = useState<ProjectStatusFilters>({
    search: "",
    pipelineStatus: "all",
    deliveryStage: "all",
    riskLevel: "all",
    projectType: "all",
    barangay: "all",
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const [sortKey, setSortKey] = useState<ProjectStatusSortKey>("physicalProgress");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [feedback, setFeedback] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const allRows = useMemo(() => createProjectStatusRows(projects, fiscalYear), [projects, fiscalYear]);
  const fiscalYears = useMemo(
    () => [...new Set(projects.map((p) => p.fiscalYear))].sort((a, b) => b.localeCompare(a)),
    [projects],
  );
  const typeOptions = useMemo(() => [...new Set(allRows.map((r) => r.projectType))].sort(), [allRows]);

  const filtered = useMemo(
    () => filterProjectStatusRows(allRows, { ...filters, search: deferredSearch }),
    [allRows, filters, deferredSearch],
  );
  const sorted = useMemo(() => sortProjectStatusRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const totals = useMemo(() => calculateProjectStatusTotals(filtered), [filtered]);
  const pipelineCounts = useMemo(() => countByPipeline(filtered), [filtered]);
  const stageCounts = useMemo(() => countByStage(filtered), [filtered]);
  const riskCounts = useMemo(() => countByRisk(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const activeCount =
    (filters.pipelineStatus !== "all" ? 1 : 0) +
    (filters.deliveryStage !== "all" ? 1 : 0) +
    (filters.riskLevel !== "all" ? 1 : 0) +
    (filters.projectType !== "all" ? 1 : 0) +
    (filters.barangay !== "all" ? 1 : 0);

  function handleSort(key: ProjectStatusSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "code" || key === "title" || key === "barangay" ? "asc" : "desc");
    }
    setPage(0);
  }

  function resetFilters() {
    setFilters({
      search: "",
      pipelineStatus: "all",
      deliveryStage: "all",
      riskLevel: "all",
      projectType: "all",
      barangay: "all",
    });
    setPage(0);
  }

  function exportReport() {
    setFeedback(`Project status report prepared for ${filtered.length} projects.`);
    window.setTimeout(() => setFeedback(""), 3500);
  }

  function sortIcon(key: ProjectStatusSortKey) {
    if (sortKey !== key) return <ChevronsUpDown size={10} />;
    return sortDir === "asc" ? <ChevronRight size={10} style={{ transform: "rotate(-90deg)" }} /> : <ChevronRight size={10} style={{ transform: "rotate(90deg)" }} />;
  }

  const kpiCards = [
    { label: "Total projects", value: String(totals.total), detail: `FY ${fiscalYear} portfolio`, icon: FolderKanban },
    { label: "Total budget", value: compactMoney(totals.totalBudget), detail: "combined allocation", icon: Landmark },
    { label: "Funded", value: String(totals.funded), detail: "approved for execution", icon: CheckCircle2 },
    { label: "In implementation", value: String(totals.inImplementation), detail: "active construction", icon: Hammer },
    { label: "Completed", value: String(totals.completed), detail: "finished projects", icon: ClipboardCheck },
    { label: "At risk", value: String(totals.atRisk), detail: "high or critical risk", icon: AlertTriangle },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Portfolio reports</p>
            <h1>Project Status</h1>
            <p>Track every project through the pipeline — from proposal to completion.</p>
          </div>
          <button type="button" className={styles.exportButton} onClick={exportReport}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.filterCard}>
          <div className={styles.filterRow}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search projects"
                placeholder="Search project code, title, barangay, or department"
                value={filters.search}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, search: e.target.value }));
                  setPage(0);
                }}
              />
            </label>
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger className={styles.compactSelect} aria-label="Fiscal year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((yr) => (
                  <SelectItem key={yr} value={yr}>
                    FY {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.pipelineStatus}
              onValueChange={(v) => {
                setFilters((f) => ({ ...f, pipelineStatus: v as ProjectPipelineStatus | "all" }));
                setPage(0);
              }}
            >
              <SelectTrigger className={styles.wideSelect} aria-label="Pipeline status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PIPELINE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.deliveryStage}
              onValueChange={(v) => {
                setFilters((f) => ({ ...f, deliveryStage: v as ProjectDeliveryStage | "all" }));
                setPage(0);
              }}
            >
              <SelectTrigger className={styles.wideSelect} aria-label="Delivery stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {DELIVERY_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="button" className={styles.filterButton} onClick={() => setMoreOpen((o) => !o)}>
              <Filter size={14} /> More {activeCount > 0 && <span>{activeCount}</span>}
            </button>
            {(activeCount > 0 || filters.search) && (
              <button type="button" className={styles.clearButton} onClick={resetFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
          {moreOpen && (
            <div className={styles.advancedFilters}>
              <div className={styles.field}>
                <span>Risk level</span>
                <Select
                  value={filters.riskLevel}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, riskLevel: v as ProjectRiskLevel | "all" }));
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All risk levels</SelectItem>
                    {RISK_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Project type</span>
                <Select
                  value={filters.projectType}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, projectType: v }));
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Barangay</span>
                <Select
                  value={filters.barangay}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, barangay: v }));
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    <SelectItem value="municipal">Municipality-wide only</SelectItem>
                    {MATNOG_BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </section>

        {filtered.length > 0 ? (
          <>
            <section className={styles.kpiGrid} aria-label="Project status summary">
              {kpiCards.map(({ label, value, detail, icon: Icon }) => (
                <article key={label}>
                  <span className={styles.kpiIcon}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>{detail}</small>
                  </div>
                </article>
              ))}
            </section>

            <section className={styles.distributionRow}>
              <div className={styles.distCard}>
                <h3>Pipeline status</h3>
                <div className={styles.distList}>
                  {pipelineCounts.map(({ status, count, percent }) => (
                    <div key={status} className={styles.distItem}>
                      <span className={styles.distLabel}>{status}</span>
                      <div className={styles.distTrack}>
                        <span style={{ width: `${percent}%`, background: PIPELINE_COLORS[status] }} />
                      </div>
                      <span className={styles.distValue}>
                        {count} ({percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.distCard}>
                <h3>Delivery stage</h3>
                <div className={styles.distList}>
                  {stageCounts.map(({ stage, count, percent }) => (
                    <div key={stage} className={styles.distItem}>
                      <span className={styles.distLabel}>{stage}</span>
                      <div className={styles.distTrack}>
                        <span style={{ width: `${percent}%`, background: STAGE_COLORS[stage] }} />
                      </div>
                      <span className={styles.distValue}>
                        {count} ({percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.distCard}>
                <h3>Risk distribution</h3>
                <div className={styles.distList}>
                  {riskCounts.map(({ level, count, percent }) => (
                    <div key={level} className={styles.distItem}>
                      <span className={styles.distLabel}>{level}</span>
                      <div className={styles.distTrack}>
                        <span style={{ width: `${percent}%`, background: RISK_COLORS[level] }} />
                      </div>
                      <span className={styles.distValue}>
                        {count} ({percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.tableCard}>
              <header>
                <div>
                  <h2>All projects</h2>
                  <p>Complete project roster with current pipeline status, delivery stage, progress, and risk level.</p>
                </div>
                <span>{filtered.length} projects</span>
              </header>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("title")}>
                          Project {sortIcon("title")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("code")}>
                          Code {sortIcon("code")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("barangay")}>
                          Barangay {sortIcon("barangay")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("projectType")}>
                          Type {sortIcon("projectType")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("pipelineStatus")}>
                          Pipeline {sortIcon("pipelineStatus")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("deliveryStage")}>
                          Stage {sortIcon("deliveryStage")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("physicalProgress")}>
                          Physical % {sortIcon("physicalProgress")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("financialProgress")}>
                          Financial % {sortIcon("financialProgress")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("budget")}>
                          Budget {sortIcon("budget")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("riskLevel")}>
                          Risk {sortIcon("riskLevel")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("slippageDays")}>
                          Slip {sortIcon("slippageDays")}
                        </button>
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id}>
                        <td className={styles.projectCell}>
                          <strong>{row.title}</strong>
                          <span>{row.department}</span>
                        </td>
                        <td>{row.code}</td>
                        <td>{row.barangay ?? "Municipal"}</td>
                        <td>{row.projectType}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[PIPELINE_BADGE[row.pipelineStatus]]}`}>
                            {row.pipelineStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[PIPELINE_BADGE[row.pipelineStatus === "Funded" ? "Funded" : "Draft"]]}`} style={{ color: STAGE_COLORS[row.deliveryStage], background: `${STAGE_COLORS[row.deliveryStage]}18` }}>
                            {row.deliveryStage}
                          </span>
                        </td>
                        <td>
                          <div className={styles.progressCell}>
                            {row.physicalProgress}%
                            <i>
                              <b style={{ width: `${row.physicalProgress}%` }} />
                            </i>
                          </div>
                        </td>
                        <td>
                          <div className={styles.progressCell}>
                            {row.financialProgress}%
                            <i>
                              <b style={{ width: `${row.financialProgress}%` }} />
                            </i>
                          </div>
                        </td>
                        <td>{compactMoney(row.budget)}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[RISK_BADGE[row.riskLevel]]}`}>
                            {row.riskLevel}
                          </span>
                        </td>
                        <td>{row.slippageDays > 0 ? `${row.slippageDays}d` : "—"}</td>
                        <td>
                          <Link href={`/projects/${row.id}`} className={styles.openLink}>
                            <ExternalLink size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <span>
                  {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(0);
                  }}
                >
                  <SelectTrigger className={styles.pageSizeSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} rows
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button type="button" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={14} />
                </button>
                <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className={styles.emptyState}>
            <BarChart3 size={34} />
            <h2>No projects found</h2>
            <p>Adjust the active filters to return project records for this reporting view.</p>
            <button type="button" onClick={resetFilters}>
              Clear filters
            </button>
          </section>
        )}
      </div>

      {feedback && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}
    </div>
  );
}
