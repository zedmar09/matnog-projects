"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Download,
  Filter,
  Landmark,
  PiggyBank,
  ReceiptText,
  Search,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useFundSourceStore } from "@/features/funding-registry/stores/fund-source-store";
import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import type { ProjectDeliveryStage } from "@/features/project-registry/types/project";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import {
  BudgetExecutionChart,
  DisbursementTrendChart,
  UtilizationGroupChart,
} from "../components/fund-utilization-charts";
import { FundUtilizationTable } from "../components/fund-utilization-table";
import type { FundUtilizationFilters, UtilizationCondition } from "../types/fund-utilization";
import {
  calculateFundTotals,
  compactMoney,
  createAttentionItems,
  createDisbursementTrend,
  createFundUtilizationRows,
  filterFundUtilizationRows,
  groupFundUtilization,
} from "../utils/fund-utilization-utils";

import styles from "./fund-utilization-report.module.css";

const STAGES: ProjectDeliveryStage[] = [
  "Planning",
  "Readiness",
  "Procurement",
  "Implementation",
  "Inspection",
  "Closeout",
  "Completed",
  "On Hold",
];
const CONDITIONS: UtilizationCondition[] = ["Low", "Healthy", "High", "Fully utilized", "Not applicable"];

type LocalFilters = Pick<
  FundUtilizationFilters,
  "search" | "fundSource" | "projectType" | "deliveryStage" | "condition"
>;
const EMPTY_FILTERS: LocalFilters = {
  search: "",
  fundSource: "all",
  projectType: "all",
  deliveryStage: "all",
  condition: "all",
};

function rateDescription(value: number | null) {
  if (value === null) return "No appropriation in scope";
  if (value < 35) return "Needs attention";
  if (value < 75) return "Healthy execution";
  return "Strong execution";
}

export function FundUtilizationReportView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const fundSources = useFundSourceStore((state) => state.sources);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const setFiscalYear = useShellStore((state) => state.setFiscalYear);
  const setJurisdiction = useShellStore((state) => state.setJurisdiction);
  const [filters, setFilters] = useState<LocalFilters>(EMPTY_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const allRows = useMemo(() => createFundUtilizationRows(projects, fundSources), [projects, fundSources]);
  const fiscalYears = useMemo(
    () => [...new Set(allRows.map((row) => row.fiscalYear))].sort((a, b) => b.localeCompare(a)),
    [allRows],
  );
  const sourceOptions = useMemo(() => [...new Set(allRows.map((row) => row.fundSource))].sort(), [allRows]);
  const typeOptions = useMemo(() => [...new Set(allRows.map((row) => row.projectType))].sort(), [allRows]);
  const reportFilters: FundUtilizationFilters = { ...filters, search: deferredSearch, fiscalYear, jurisdiction };
  const rows = filterFundUtilizationRows(allRows, reportFilters);
  const totals = useMemo(() => calculateFundTotals(rows), [rows]);
  const fundGroups = useMemo(() => groupFundUtilization(rows, "fundSource"), [rows]);
  const barangayGroups = useMemo(() => groupFundUtilization(rows, "barangay"), [rows]);
  const trend = useMemo(() => createDisbursementTrend(totals.disbursement), [totals.disbursement]);
  const attention = useMemo(() => createAttentionItems(rows), [rows]);
  const activeCount = Object.values(filters).filter((value) => value !== "" && value !== "all").length;

  function setFilter<K extends keyof LocalFilters>(key: K, value: LocalFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setJurisdiction("municipal");
  }

  function exportReport() {
    setFeedback(`Fund utilization report prepared for ${rows.length} allocation records.`);
    window.setTimeout(() => setFeedback(""), 3500);
  }

  const cards = [
    {
      label: "Appropriation",
      value: totals.appropriation,
      detail: `${rows.length} allocation records`,
      icon: Landmark,
    },
    {
      label: "Obligations",
      value: totals.obligation,
      detail: `${totals.obligationRate ?? 0}% of appropriation`,
      icon: ReceiptText,
    },
    {
      label: "Disbursements",
      value: totals.disbursement,
      detail: `${totals.disbursementRate ?? 0}% paid`,
      icon: Banknote,
    },
    { label: "Available balance", value: totals.availableBalance, detail: "Unobligated funds", icon: PiggyBank },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Financial reports</p>
            <h1>Fund Utilization</h1>
            <p>Understand how appropriations move into obligations and actual project payments.</p>
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
                aria-label="Search fund utilization"
                placeholder="Search project code, title, barangay, or fund source"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
              />
            </label>
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger className={styles.compactSelect} aria-label="Report fiscal year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    FY {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.fundSource} onValueChange={(value) => setFilter("fundSource", value)}>
              <SelectTrigger className={styles.wideSelect} aria-label="Fund source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fund sources</SelectItem>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="button" className={styles.filterButton} onClick={() => setMoreOpen((open) => !open)}>
              <Filter size={14} /> More filters {activeCount > 0 && <span>{activeCount}</span>}
            </button>
            {(activeCount > 0 || jurisdiction !== "municipal") && (
              <button type="button" className={styles.clearButton} onClick={resetFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
          {moreOpen && (
            <div className={styles.advancedFilters}>
              <div className={styles.field}>
                <span>Jurisdiction</span>
                <Select value={jurisdiction} onValueChange={(value) => setJurisdiction(value as typeof jurisdiction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="municipal">Municipality-wide portfolio</SelectItem>
                    <SelectItem value="all-barangays">All barangay projects</SelectItem>
                    {MATNOG_BARANGAYS.map((barangay) => (
                      <SelectItem key={barangay} value={barangay}>
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Project type</span>
                <Select value={filters.projectType} onValueChange={(value) => setFilter("projectType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All project types</SelectItem>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Delivery stage</span>
                <Select
                  value={filters.deliveryStage}
                  onValueChange={(value) => setFilter("deliveryStage", value as LocalFilters["deliveryStage"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Utilization condition</span>
                <Select
                  value={filters.condition}
                  onValueChange={(value) => setFilter("condition", value as LocalFilters["condition"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All conditions</SelectItem>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </section>

        {rows.length > 0 ? (
          <>
            <section className={styles.kpiGrid} aria-label="Fund utilization summary">
              {cards.map(({ label, value, detail, icon: Icon }) => (
                <article key={label}>
                  <span className={styles.kpiIcon}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <span>{label}</span>
                    <strong>{compactMoney(value)}</strong>
                    <small>{detail}</small>
                  </div>
                </article>
              ))}
              <article className={styles.rateCard}>
                <span className={styles.kpiIcon}>
                  <TrendingUp size={18} />
                </span>
                <div>
                  <span>Obligation rate</span>
                  <strong>{totals.obligationRate ?? 0}%</strong>
                  <small>{rateDescription(totals.obligationRate)}</small>
                </div>
                <i>
                  <b style={{ width: `${totals.obligationRate ?? 0}%` }} />
                </i>
              </article>
              <article className={styles.rateCard}>
                <span className={styles.kpiIcon}>
                  <WalletCards size={18} />
                </span>
                <div>
                  <span>Disbursement rate</span>
                  <strong>{totals.disbursementRate ?? 0}%</strong>
                  <small>{rateDescription(totals.disbursementRate)}</small>
                </div>
                <i>
                  <b style={{ width: `${totals.disbursementRate ?? 0}%` }} />
                </i>
              </article>
            </section>

            <section className={styles.reportGrid}>
              <BudgetExecutionChart totals={totals} />
              <UtilizationGroupChart
                title="Utilization by fund source"
                description="Largest funding sources ranked by current appropriation."
                groups={fundGroups}
              />
              <UtilizationGroupChart
                title="Utilization by barangay"
                description="Municipal and barangay execution at a glance."
                groups={barangayGroups}
              />
              <DisbursementTrendChart points={trend} />
            </section>

            <section className={styles.attentionCard}>
              <header>
                <div>
                  <span className={styles.attentionIcon}>
                    <AlertTriangle size={17} />
                  </span>
                  <div>
                    <h2>Needs attention</h2>
                    <p>Projects with delayed execution or financial balances requiring follow-up.</p>
                  </div>
                </div>
                <span>{attention.length} items</span>
              </header>
              {attention.length > 0 ? (
                <div className={styles.attentionList}>
                  {attention.map((item) => (
                    <article key={item.id}>
                      <span className={item.severity === "High" ? styles.highDot : styles.watchDot} />
                      <div>
                        <strong>{item.projectTitle}</strong>
                        <span>
                          {item.projectCode} · {item.reason}
                        </span>
                      </div>
                      {item.amount !== null && <b>{compactMoney(item.amount)}</b>}
                      <Link href={`/projects/${item.projectId}`}>Review</Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.allClear}>
                  <CheckCircle2 size={20} />
                  <span>No material utilization exceptions in this view.</span>
                </div>
              )}
            </section>

            <FundUtilizationTable key={JSON.stringify(reportFilters)} rows={rows} />
          </>
        ) : (
          <section className={styles.emptyState}>
            <WalletCards size={34} />
            <h2>No utilization data found</h2>
            <p>Adjust the active filters to return financial records for this reporting view.</p>
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
