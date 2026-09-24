"use client";

import {
  AlertTriangle,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Download,
  CheckCircle2,
  Landmark,
  MapPin,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import type {
  BarangayPerformanceFilters,
  BarangayPerformanceSortKey,
  PerformanceTier,
} from "../types/barangay-performance";
import { compactMoney } from "../utils/fund-utilization-utils";
import {
  calculateBarangayTotals,
  createBarangayPerformanceRows,
  filterBarangayPerformanceRows,
  sortBarangayRows,
} from "../utils/barangay-performance-utils";

import styles from "./barangay-performance-report.module.css";

const TIERS: PerformanceTier[] = ["Excellent", "Good", "Fair", "Needs Improvement"];
const PAGE_SIZES = [15, 25, 40];

const TIER_COLORS: Record<PerformanceTier, string> = {
  Excellent: "#16876a",
  Good: "#52b495",
  Fair: "#d8932d",
  "Needs Improvement": "#c94c54",
};

const TIER_BADGE_CLASS: Record<PerformanceTier, string> = {
  Excellent: "tierBadgeExcellent",
  Good: "tierBadgeGood",
  Fair: "tierBadgeFair",
  "Needs Improvement": "tierBadgeNeedsImprovement",
};

const TIER_BAR_CLASS: Record<PerformanceTier, string> = {
  Excellent: "tierExcellent",
  Good: "tierGood",
  Fair: "tierFair",
  "Needs Improvement": "tierNeedsImprovement",
};

function scoreColor(score: number) {
  if (score >= 80) return "#16876a";
  if (score >= 60) return "#52b495";
  if (score >= 40) return "#d8932d";
  return "#c94c54";
}

export function BarangayPerformanceReportView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const setFiscalYear = useShellStore((state) => state.setFiscalYear);

  const [filters, setFilters] = useState<BarangayPerformanceFilters>({
    search: "",
    performanceTier: "all",
    minProjects: 0,
  });
  const [sortKey, setSortKey] = useState<BarangayPerformanceSortKey>("performanceScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [feedback, setFeedback] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const allRows = useMemo(() => createBarangayPerformanceRows(projects, fiscalYear), [projects, fiscalYear]);
  const fiscalYears = useMemo(
    () => [...new Set(projects.map((p) => p.fiscalYear))].sort((a, b) => b.localeCompare(a)),
    [projects],
  );
  const filtered = useMemo(
    () => filterBarangayPerformanceRows(allRows, { ...filters, search: deferredSearch }),
    [allRows, filters, deferredSearch],
  );
  const sorted = useMemo(() => sortBarangayRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const totals = useMemo(() => calculateBarangayTotals(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const activeCount = (filters.performanceTier !== "all" ? 1 : 0) + (filters.minProjects > 0 ? 1 : 0);

  function handleSort(key: BarangayPerformanceSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "barangay" ? "asc" : "desc");
    }
    setPage(0);
  }

  function resetFilters() {
    setFilters({ search: "", performanceTier: "all", minProjects: 0 });
    setPage(0);
  }

  function exportReport() {
    setFeedback(`Barangay performance report prepared for ${filtered.length} barangays.`);
    window.setTimeout(() => setFeedback(""), 3500);
  }

  function sortIcon(key: BarangayPerformanceSortKey) {
    if (sortKey !== key) return <ChevronsUpDown size={10} />;
    return sortDir === "asc" ? <ChevronRight size={10} style={{ transform: "rotate(-90deg)" }} /> : <ChevronRight size={10} style={{ transform: "rotate(90deg)" }} />;
  }

  const kpiCards = [
    { label: "Barangays", value: String(totals.totalBarangays), detail: `with projects in FY ${fiscalYear}`, icon: MapPin },
    { label: "Total projects", value: String(totals.totalProjects), detail: "across all barangays", icon: BarChart3 },
    { label: "Total budget", value: compactMoney(totals.totalBudget), detail: "combined allocation", icon: Landmark },
    { label: "Avg. physical", value: `${totals.avgPhysicalProgress}%`, detail: "mean progress", icon: TrendingUp },
    { label: "Avg. financial", value: `${totals.avgFinancialProgress}%`, detail: "mean progress", icon: Award },
    { label: "On-time rate", value: `${totals.avgOnTimeRate}%`, detail: "average across barangays", icon: Clock },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Performance reports</p>
            <h1>Barangay Performance</h1>
            <p>Compare project delivery across all barangays of Matnog — progress, timeliness, and risk.</p>
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
                aria-label="Search barangay"
                placeholder="Search barangay name"
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
              value={filters.performanceTier}
              onValueChange={(v) => {
                setFilters((f) => ({ ...f, performanceTier: v as PerformanceTier | "all" }));
                setPage(0);
              }}
            >
              <SelectTrigger className={styles.wideSelect} aria-label="Performance tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                {TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(activeCount > 0 || filters.search) && (
              <button type="button" className={styles.clearButton} onClick={resetFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </section>

        {filtered.length > 0 ? (
          <>
            <section className={styles.kpiGrid} aria-label="Barangay performance summary">
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

            <section className={styles.tierCard}>
              {TIERS.map((tier) => {
                const count =
                  tier === "Excellent"
                    ? totals.excellentCount
                    : tier === "Good"
                      ? totals.goodCount
                      : tier === "Fair"
                        ? totals.fairCount
                        : totals.needsImprovementCount;
                return (
                  <article key={tier}>
                    <span
                      className={styles.tierDot}
                      style={{ background: TIER_COLORS[tier] }}
                    />
                    <div>
                      <strong>{count}</strong>
                      <span>{tier}</span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className={styles.tableCard}>
              <header>
                <div>
                  <h2>Barangay breakdown</h2>
                  <p>Ranked by composite performance score across all project delivery metrics.</p>
                </div>
                <span>{filtered.length} barangays</span>
              </header>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("barangay")}>
                          Barangay {sortIcon("barangay")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("totalProjects")}>
                          Projects {sortIcon("totalProjects")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("totalBudget")}>
                          Budget {sortIcon("totalBudget")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("avgPhysicalProgress")}>
                          Physical % {sortIcon("avgPhysicalProgress")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("avgFinancialProgress")}>
                          Financial % {sortIcon("avgFinancialProgress")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("onTimeRate")}>
                          On-time {sortIcon("onTimeRate")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("completedCount")}>
                          Completed {sortIcon("completedCount")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("highRiskCount")}>
                          At risk {sortIcon("highRiskCount")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("avgSlippage")}>
                          Avg. slip {sortIcon("avgSlippage")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className={styles.sortButton} onClick={() => handleSort("performanceScore")}>
                          Score {sortIcon("performanceScore")}
                        </button>
                      </th>
                      <th>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.barangay}>
                        <td>
                          <strong>{row.barangay}</strong>
                          <span>{row.totalProjects} project{row.totalProjects !== 1 ? "s" : ""}</span>
                        </td>
                        <td>{row.totalProjects}</td>
                        <td>{compactMoney(row.totalBudget)}</td>
                        <td>
                          <div className={styles.progressCell}>
                            {row.avgPhysicalProgress}%
                            <i>
                              <b style={{ width: `${row.avgPhysicalProgress}%` }} />
                            </i>
                          </div>
                        </td>
                        <td>
                          <div className={styles.progressCell}>
                            {row.avgFinancialProgress}%
                            <i>
                              <b style={{ width: `${row.avgFinancialProgress}%` }} />
                            </i>
                          </div>
                        </td>
                        <td>{row.onTimeRate}%</td>
                        <td>{row.completedCount}</td>
                        <td>
                          {row.highRiskCount > 0 ? (
                            <span className={`${styles.riskBadge} ${styles.riskHigh}`}>
                              <AlertTriangle size={9} /> {row.highRiskCount}
                            </span>
                          ) : (
                            <span className={`${styles.riskBadge} ${styles.riskNone}`}>
                              <CheckCircle2 size={9} /> 0
                            </span>
                          )}
                        </td>
                        <td>{row.avgSlippage > 0 ? `${row.avgSlippage}d` : "—"}</td>
                        <td>
                          <div className={styles.scoreCell}>
                            <span>{row.performanceScore}</span>
                            <div className={styles.scoreBar}>
                              <span
                                style={{
                                  width: `${row.performanceScore}%`,
                                  background: scoreColor(row.performanceScore),
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.tierBadge} ${styles[TIER_BADGE_CLASS[row.performanceTier]]}`}>
                            {row.performanceTier}
                          </span>
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
            <MapPin size={34} />
            <h2>No barangay data found</h2>
            <p>There are no barangay-level projects for the selected fiscal year and filters.</p>
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
