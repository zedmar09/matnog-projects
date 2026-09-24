import type { FundSource } from "@/features/funding-registry/types/fund-source";
import type { Project } from "@/features/project-registry/types/project";

import type {
  FundAttentionItem,
  FundUtilizationFilters,
  FundUtilizationRow,
  FundUtilizationSortKey,
  FundUtilizationTotals,
  UtilizationCondition,
  UtilizationGroup,
  UtilizationTrendPoint,
} from "../types/fund-utilization";

const FUND_ALIASES: Record<string, string> = {
  "20% Development Fund": "20% Municipal Development Fund",
  "General Fund": "Municipal General Fund",
  "Local DRRM Fund": "Local Disaster Risk Reduction and Management Fund",
  "Special Education Fund": "Special Education Fund",
  "Barangay Development Fund": "Barangay Development Fund",
  "National Government Grant": "National Government Grant",
  "Provincial Assistance": "Provincial Assistance",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_WEIGHTS = [0.03, 0.04, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.11, 0.1, 0.09];

export function money(value: number) {
  const rounded = Math.round(Math.abs(value));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}₱${grouped}`;
}

export function compactMoney(value: number) {
  const absolute = Math.abs(value);
  const unit =
    absolute >= 1_000_000_000
      ? { divisor: 1_000_000_000, suffix: "B" }
      : absolute >= 1_000_000
        ? { divisor: 1_000_000, suffix: "M" }
        : absolute >= 1_000
          ? { divisor: 1_000, suffix: "K" }
          : null;
  if (!unit) return money(value);
  const rounded = Math.round((absolute / unit.divisor) * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${value < 0 ? "-" : ""}₱${formatted}${unit.suffix}`;
}

function rate(value: number, base: number) {
  return base > 0 ? Math.round((value / base) * 100) : null;
}

export function classifyUtilization(appropriation: number, obligation: number): UtilizationCondition {
  if (appropriation <= 0) return "Not applicable";
  const utilization = (obligation / appropriation) * 100;
  if (utilization < 35) return "Low";
  if (utilization < 75) return "Healthy";
  if (utilization < 98) return "High";
  return "Fully utilized";
}

function resolveFundName(raw: string, barangay: string | null, sources: FundSource[]) {
  if (raw === "Barangay Development Fund" && barangay) {
    return sources.find((source) => source.ownership === "Barangay" && source.barangay === barangay)?.name ?? raw;
  }
  const alias = FUND_ALIASES[raw] ?? raw;
  return sources.find((source) => source.name === alias)?.name ?? alias;
}

export function createFundUtilizationRows(projects: Project[], sources: FundSource[]): FundUtilizationRow[] {
  return projects.flatMap((project) => {
    const allocations = project.funding.length
      ? project.funding
      : [
          {
            source: "Unassigned funding",
            share: 100,
            amount: project.appropriation,
            eligibility: "For validation" as const,
          },
        ];

    return allocations.map((allocation, index) => {
      const share = allocation.share > 0 ? allocation.share / 100 : allocations.length === 1 ? 1 : 0;
      const appropriation = Math.max(0, Math.round(project.appropriation * share));
      const obligation = Math.max(0, Math.min(appropriation, Math.round(project.obligation * share)));
      const disbursement = Math.max(0, Math.min(obligation, Math.round(project.disbursement * share)));
      return {
        id: `${project.id}-fund-${index + 1}`,
        projectId: project.id,
        projectCode: project.code,
        projectTitle: project.title,
        barangay: project.barangay,
        projectType: project.projectType,
        deliveryStage: project.deliveryStage,
        fundSource: resolveFundName(allocation.source, project.barangay, sources),
        fiscalYear: project.fiscalYear,
        appropriation,
        obligation,
        disbursement,
        availableBalance: Math.max(0, appropriation - obligation),
        undisbursedObligation: Math.max(0, obligation - disbursement),
        obligationRate: rate(obligation, appropriation),
        disbursementRate: rate(disbursement, appropriation),
        condition: classifyUtilization(appropriation, obligation),
        slippageDays: project.slippageDays,
        riskLevel: project.riskLevel,
      } satisfies FundUtilizationRow;
    });
  });
}

export function filterFundUtilizationRows(rows: FundUtilizationRow[], filters: FundUtilizationFilters) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (row.fiscalYear !== filters.fiscalYear) return false;
    if (filters.jurisdiction === "all-barangays" && row.barangay === null) return false;
    if (
      filters.jurisdiction !== "municipal" &&
      filters.jurisdiction !== "all-barangays" &&
      row.barangay !== filters.jurisdiction
    )
      return false;
    if (filters.fundSource !== "all" && row.fundSource !== filters.fundSource) return false;
    if (filters.projectType !== "all" && row.projectType !== filters.projectType) return false;
    if (filters.deliveryStage !== "all" && row.deliveryStage !== filters.deliveryStage) return false;
    if (filters.condition !== "all" && row.condition !== filters.condition) return false;
    if (
      query &&
      !`${row.projectCode} ${row.projectTitle} ${row.barangay ?? ""} ${row.fundSource}`.toLowerCase().includes(query)
    )
      return false;
    return true;
  });
}

export function calculateFundTotals(rows: FundUtilizationRow[]): FundUtilizationTotals {
  const totals = rows.reduce(
    (result, row) => ({
      appropriation: result.appropriation + row.appropriation,
      obligation: result.obligation + row.obligation,
      disbursement: result.disbursement + row.disbursement,
      availableBalance: result.availableBalance + row.availableBalance,
      undisbursedObligation: result.undisbursedObligation + row.undisbursedObligation,
    }),
    { appropriation: 0, obligation: 0, disbursement: 0, availableBalance: 0, undisbursedObligation: 0 },
  );
  return {
    ...totals,
    obligationRate: rate(totals.obligation, totals.appropriation),
    disbursementRate: rate(totals.disbursement, totals.appropriation),
  };
}

export function groupFundUtilization(
  rows: FundUtilizationRow[],
  key: "fundSource" | "barangay",
  limit = 7,
): UtilizationGroup[] {
  const groups = new Map<string, UtilizationGroup>();
  for (const row of rows) {
    const label = key === "barangay" ? (row.barangay ?? "Municipality-wide") : row.fundSource;
    const current = groups.get(label) ?? {
      id: label,
      label,
      appropriation: 0,
      obligation: 0,
      disbursement: 0,
      obligationRate: null,
      disbursementRate: null,
    };
    current.appropriation += row.appropriation;
    current.obligation += row.obligation;
    current.disbursement += row.disbursement;
    groups.set(label, current);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      obligationRate: rate(group.obligation, group.appropriation),
      disbursementRate: rate(group.disbursement, group.appropriation),
    }))
    .sort((a, b) => b.appropriation - a.appropriation)
    .slice(0, limit);
}

export function createDisbursementTrend(totalDisbursement: number): UtilizationTrendPoint[] {
  let cumulative = 0;
  return MONTHS.map((month, index) => {
    cumulative += totalDisbursement * MONTH_WEIGHTS[index];
    return { month, disbursement: Math.round(index === MONTHS.length - 1 ? totalDisbursement : cumulative) };
  });
}

export function createAttentionItems(rows: FundUtilizationRow[]): FundAttentionItem[] {
  const items = new Map<string, FundAttentionItem>();
  for (const row of rows) {
    let item: FundAttentionItem | null = null;
    if (row.slippageDays >= 30)
      item = {
        id: `${row.projectId}-slippage`,
        projectId: row.projectId,
        projectCode: row.projectCode,
        projectTitle: row.projectTitle,
        severity: "High",
        reason: `${row.slippageDays} days behind schedule`,
        amount: null,
      };
    else if (row.undisbursedObligation >= 5_000_000)
      item = {
        id: `${row.projectId}-undisbursed`,
        projectId: row.projectId,
        projectCode: row.projectCode,
        projectTitle: row.projectTitle,
        severity: "High",
        reason: "Large undisbursed obligation",
        amount: row.undisbursedObligation,
      };
    else if (row.appropriation > 0 && (row.obligationRate ?? 0) < 25)
      item = {
        id: `${row.projectId}-low`,
        projectId: row.projectId,
        projectCode: row.projectCode,
        projectTitle: row.projectTitle,
        severity: "Watch",
        reason: "Low obligation rate",
        amount: row.availableBalance,
      };
    else if (row.obligation > 0 && row.disbursement / row.obligation < 0.5)
      item = {
        id: `${row.projectId}-payment`,
        projectId: row.projectId,
        projectCode: row.projectCode,
        projectTitle: row.projectTitle,
        severity: "Watch",
        reason: "Less than half of obligations disbursed",
        amount: row.undisbursedObligation,
      };
    if (item && (!items.has(row.projectId) || item.severity === "High")) items.set(row.projectId, item);
  }
  return [...items.values()]
    .sort((a, b) => (a.severity === b.severity ? (b.amount ?? 0) - (a.amount ?? 0) : a.severity === "High" ? -1 : 1))
    .slice(0, 6);
}

export function sortFundRows(rows: FundUtilizationRow[], key: FundUtilizationSortKey, direction: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const left = key === "project" ? a.projectTitle : key === "barangay" ? (a.barangay ?? "") : (a[key] ?? -1);
    const right = key === "project" ? b.projectTitle : key === "barangay" ? (b.barangay ?? "") : (b[key] ?? -1);
    const comparison =
      typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
    return direction === "asc" ? comparison : -comparison;
  });
}
