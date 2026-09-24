import type { Project, ProjectDeliveryStage, ProjectRiskLevel } from "@/features/project-registry/types/project";

import type {
  BarangayPerformanceFilters,
  BarangayPerformanceRow,
  BarangayPerformanceSortKey,
  BarangayPerformanceTotals,
  PerformanceTier,
} from "../types/barangay-performance";

function rate(value: number, base: number) {
  return base > 0 ? Math.round((value / base) * 100) : null;
}

function classifyTier(score: number): PerformanceTier {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}

function computeScore(row: {
  avgPhysicalProgress: number;
  avgFinancialProgress: number;
  onTimeRate: number;
  obligationRate: number | null;
  highRiskCount: number;
  totalProjects: number;
}) {
  const physical = row.avgPhysicalProgress * 0.3;
  const financial = row.avgFinancialProgress * 0.2;
  const timeliness = row.onTimeRate * 0.25;
  const utilization = (row.obligationRate ?? 0) * 0.15;
  const riskPenalty = row.totalProjects > 0 ? (row.highRiskCount / row.totalProjects) * 10 : 0;
  return Math.max(0, Math.min(100, Math.round(physical + financial + timeliness + utilization - riskPenalty)));
}

export function createBarangayPerformanceRows(
  projects: Project[],
  fiscalYear: string,
): BarangayPerformanceRow[] {
  const grouped = new Map<string, Project[]>();
  for (const project of projects) {
    if (project.barangay && project.fiscalYear === fiscalYear) {
      const list = grouped.get(project.barangay) ?? [];
      list.push(project);
      grouped.set(project.barangay, list);
    }
  }

  return [...grouped.entries()].map(([barangay, list]) => {
    const totalBudget = list.reduce((sum, p) => sum + p.budget, 0);
    const totalAppropriation = list.reduce((sum, p) => sum + p.appropriation, 0);
    const totalObligation = list.reduce((sum, p) => sum + p.obligation, 0);
    const totalDisbursement = list.reduce((sum, p) => sum + p.disbursement, 0);
    const avgPhysical = Math.round(list.reduce((sum, p) => sum + p.physicalProgress, 0) / list.length);
    const avgFinancial = Math.round(list.reduce((sum, p) => sum + p.financialProgress, 0) / list.length);
    const onTimeCount = list.filter((p) => p.slippageDays === 0).length;
    const delayedCount = list.filter((p) => p.slippageDays > 0).length;
    const avgSlippage = Math.round(list.reduce((sum, p) => sum + p.slippageDays, 0) / list.length);

    const stageBreakdown: Partial<Record<ProjectDeliveryStage, number>> = {};
    const riskBreakdown: Partial<Record<ProjectRiskLevel, number>> = {};
    const typeBreakdown: Record<string, number> = {};
    let completedCount = 0;
    let implementationCount = 0;
    let highRiskCount = 0;

    for (const p of list) {
      stageBreakdown[p.deliveryStage] = (stageBreakdown[p.deliveryStage] ?? 0) + 1;
      riskBreakdown[p.riskLevel] = (riskBreakdown[p.riskLevel] ?? 0) + 1;
      typeBreakdown[p.projectType] = (typeBreakdown[p.projectType] ?? 0) + 1;
      if (p.deliveryStage === "Completed") completedCount++;
      if (p.deliveryStage === "Implementation") implementationCount++;
      if (p.riskLevel === "High" || p.riskLevel === "Critical") highRiskCount++;
    }

    const partial = {
      avgPhysicalProgress: avgPhysical,
      avgFinancialProgress: avgFinancial,
      onTimeRate: list.length > 0 ? Math.round((onTimeCount / list.length) * 100) : 0,
      obligationRate: rate(totalObligation, totalAppropriation),
      highRiskCount,
      totalProjects: list.length,
    };

    const performanceScore = computeScore(partial);

    return {
      barangay,
      totalProjects: list.length,
      totalBudget,
      totalAppropriation,
      totalObligation,
      totalDisbursement,
      avgPhysicalProgress: avgPhysical,
      avgFinancialProgress: avgFinancial,
      obligationRate: partial.obligationRate,
      disbursementRate: rate(totalDisbursement, totalAppropriation),
      onTimeCount,
      delayedCount,
      onTimeRate: partial.onTimeRate,
      avgSlippage,
      completedCount,
      implementationCount,
      stageBreakdown,
      riskBreakdown,
      highRiskCount,
      typeBreakdown,
      performanceScore,
      performanceTier: classifyTier(performanceScore),
    };
  });
}

export function filterBarangayPerformanceRows(
  rows: BarangayPerformanceRow[],
  filters: BarangayPerformanceFilters,
) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.performanceTier !== "all" && row.performanceTier !== filters.performanceTier) return false;
    if (row.totalProjects < filters.minProjects) return false;
    if (query && !row.barangay.toLowerCase().includes(query)) return false;
    return true;
  });
}

export function calculateBarangayTotals(rows: BarangayPerformanceRow[]): BarangayPerformanceTotals {
  const count = rows.length;
  if (count === 0) {
    return {
      totalBarangays: 0,
      totalProjects: 0,
      totalBudget: 0,
      avgPhysicalProgress: 0,
      avgFinancialProgress: 0,
      avgOnTimeRate: 0,
      excellentCount: 0,
      goodCount: 0,
      fairCount: 0,
      needsImprovementCount: 0,
    };
  }
  return {
    totalBarangays: count,
    totalProjects: rows.reduce((sum, r) => sum + r.totalProjects, 0),
    totalBudget: rows.reduce((sum, r) => sum + r.totalBudget, 0),
    avgPhysicalProgress: Math.round(rows.reduce((sum, r) => sum + r.avgPhysicalProgress, 0) / count),
    avgFinancialProgress: Math.round(rows.reduce((sum, r) => sum + r.avgFinancialProgress, 0) / count),
    avgOnTimeRate: Math.round(rows.reduce((sum, r) => sum + r.onTimeRate, 0) / count),
    excellentCount: rows.filter((r) => r.performanceTier === "Excellent").length,
    goodCount: rows.filter((r) => r.performanceTier === "Good").length,
    fairCount: rows.filter((r) => r.performanceTier === "Fair").length,
    needsImprovementCount: rows.filter((r) => r.performanceTier === "Needs Improvement").length,
  };
}

export function sortBarangayRows(
  rows: BarangayPerformanceRow[],
  key: BarangayPerformanceSortKey,
  direction: "asc" | "desc",
) {
  return [...rows].sort((a, b) => {
    const left = key === "barangay" ? a.barangay : (a[key] ?? -1);
    const right = key === "barangay" ? b.barangay : (b[key] ?? -1);
    const comparison =
      typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
    return direction === "asc" ? comparison : -comparison;
  });
}
