import type { Project, ProjectDeliveryStage, ProjectPipelineStatus, ProjectRiskLevel } from "@/features/project-registry/types/project";

import type {
  PipelineCount,
  ProjectStatusFilters,
  ProjectStatusRow,
  ProjectStatusSortKey,
  ProjectStatusTotals,
  RiskCount,
  StageCount,
} from "../types/project-status";

const PIPELINE_ORDER: ProjectPipelineStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Prioritized",
  "Funded",
  "Deferred",
  "Rejected",
];

const STAGE_ORDER: ProjectDeliveryStage[] = [
  "Planning",
  "Readiness",
  "Procurement",
  "Implementation",
  "Inspection",
  "Closeout",
  "Completed",
  "On Hold",
];

const RISK_ORDER: ProjectRiskLevel[] = ["Low", "Moderate", "High", "Critical"];

export function createProjectStatusRows(projects: Project[], fiscalYear: string): ProjectStatusRow[] {
  return projects
    .filter((p) => p.fiscalYear === fiscalYear)
    .map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      barangay: p.barangay,
      projectType: p.projectType,
      department: p.implementingDepartment,
      pipelineStatus: p.pipelineStatus,
      deliveryStage: p.deliveryStage,
      physicalProgress: p.physicalProgress,
      financialProgress: p.financialProgress,
      budget: p.budget,
      appropriation: p.appropriation,
      riskLevel: p.riskLevel,
      slippageDays: p.slippageDays,
      targetCompletion: p.targetCompletion,
      contractor: p.contractor,
      fiscalYear: p.fiscalYear,
    }));
}

export function filterProjectStatusRows(rows: ProjectStatusRow[], filters: ProjectStatusFilters) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.pipelineStatus !== "all" && row.pipelineStatus !== filters.pipelineStatus) return false;
    if (filters.deliveryStage !== "all" && row.deliveryStage !== filters.deliveryStage) return false;
    if (filters.riskLevel !== "all" && row.riskLevel !== filters.riskLevel) return false;
    if (filters.projectType !== "all" && row.projectType !== filters.projectType) return false;
    if (filters.barangay === "municipal" && row.barangay !== null) return false;
    if (filters.barangay !== "all" && filters.barangay !== "municipal" && row.barangay !== filters.barangay) return false;
    if (query && !`${row.code} ${row.title} ${row.barangay ?? ""} ${row.department}`.toLowerCase().includes(query))
      return false;
    return true;
  });
}

export function calculateProjectStatusTotals(rows: ProjectStatusRow[]): ProjectStatusTotals {
  const count = rows.length;
  return {
    total: count,
    totalBudget: rows.reduce((sum, r) => sum + r.budget, 0),
    funded: rows.filter((r) => r.pipelineStatus === "Funded").length,
    inImplementation: rows.filter((r) => r.deliveryStage === "Implementation").length,
    completed: rows.filter((r) => r.deliveryStage === "Completed").length,
    atRisk: rows.filter((r) => r.riskLevel === "High" || r.riskLevel === "Critical").length,
    avgPhysical: count > 0 ? Math.round(rows.reduce((sum, r) => sum + r.physicalProgress, 0) / count) : 0,
    avgFinancial: count > 0 ? Math.round(rows.reduce((sum, r) => sum + r.financialProgress, 0) / count) : 0,
  };
}

export function countByPipeline(rows: ProjectStatusRow[]): PipelineCount[] {
  const total = rows.length;
  return PIPELINE_ORDER.map((status) => {
    const count = rows.filter((r) => r.pipelineStatus === status).length;
    return { status, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
  }).filter((entry) => entry.count > 0);
}

export function countByStage(rows: ProjectStatusRow[]): StageCount[] {
  const total = rows.length;
  return STAGE_ORDER.map((stage) => {
    const count = rows.filter((r) => r.deliveryStage === stage).length;
    return { stage, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
  }).filter((entry) => entry.count > 0);
}

export function countByRisk(rows: ProjectStatusRow[]): RiskCount[] {
  const total = rows.length;
  return RISK_ORDER.map((level) => {
    const count = rows.filter((r) => r.riskLevel === level).length;
    return { level, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
  }).filter((entry) => entry.count > 0);
}

export function sortProjectStatusRows(
  rows: ProjectStatusRow[],
  key: ProjectStatusSortKey,
  direction: "asc" | "desc",
) {
  const pipelineIndex = (s: ProjectPipelineStatus) => PIPELINE_ORDER.indexOf(s);
  const stageIndex = (s: ProjectDeliveryStage) => STAGE_ORDER.indexOf(s);
  const riskIndex = (l: ProjectRiskLevel) => RISK_ORDER.indexOf(l);

  return [...rows].sort((a, b) => {
    let comparison: number;
    switch (key) {
      case "pipelineStatus":
        comparison = pipelineIndex(a.pipelineStatus) - pipelineIndex(b.pipelineStatus);
        break;
      case "deliveryStage":
        comparison = stageIndex(a.deliveryStage) - stageIndex(b.deliveryStage);
        break;
      case "riskLevel":
        comparison = riskIndex(a.riskLevel) - riskIndex(b.riskLevel);
        break;
      case "title":
      case "code":
      case "barangay":
      case "projectType":
      case "targetCompletion":
        comparison = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
        break;
      default:
        comparison = (a[key] as number) - (b[key] as number);
    }
    return direction === "asc" ? comparison : -comparison;
  });
}
