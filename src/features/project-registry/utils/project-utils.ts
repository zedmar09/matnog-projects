import type { JurisdictionScope } from "@/stores/shell-store";

import type {
  FundingSource,
  Project,
  ProjectActivity,
  ProjectFilters,
  ProjectPipelineStatus,
  ProjectSortKey,
} from "../types/project";

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  search: "",
  pipelineStatus: "all",
  deliveryStage: "all",
  fundingSource: "all",
  department: "all",
  barangay: "all",
  projectType: "all",
  riskLevel: "all",
};

const PIPELINE_ORDER: ProjectPipelineStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Prioritized",
  "Funded",
  "Deferred",
  "Rejected",
];

const JURISDICTION_NAMES: Record<Exclude<JurisdictionScope, "municipal" | "all-barangays">, string> = {
  poblacion: "Poblacion",
  gadgaron: "Gadgaron",
  sinalmacan: "Sinalmacan",
};

export function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) return `₱${Number((value / 1_000_000_000).toFixed(1))}B`;
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    const precision = scaled >= 10 ? 1 : 2;
    return `₱${Number(scaled.toFixed(precision))}M`;
  }
  if (value >= 1_000) return `₱${Number((value / 1_000).toFixed(1))}K`;
  return `₱${Math.round(value)}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PH").format(value);
}

export function formatShortDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]} ${day}, ${year}`;
}

export function formatMonth(value: string) {
  const month = Number(value.slice(5, 7));
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
}

export function filterProjectsByScope(projects: Project[], fiscalYear: string, jurisdiction: JurisdictionScope) {
  return projects.filter((project) => {
    if (project.fiscalYear !== fiscalYear) return false;
    if (jurisdiction === "municipal") return true;
    if (jurisdiction === "all-barangays") return project.barangay !== null;
    return project.barangay === JURISDICTION_NAMES[jurisdiction] || project.barangay === null;
  });
}

export function filterProjects(projects: Project[], filters: ProjectFilters) {
  const query = filters.search.trim().toLocaleLowerCase();

  return projects.filter((project) => {
    if (query) {
      const searchValue = [
        project.code,
        project.title,
        project.barangay ?? "Municipality-wide",
        project.implementingDepartment,
        project.contractor ?? "",
        ...project.funding.map((item) => item.source),
      ]
        .join(" ")
        .toLocaleLowerCase();
      if (!searchValue.includes(query)) return false;
    }

    if (filters.pipelineStatus !== "all" && project.pipelineStatus !== filters.pipelineStatus) return false;
    if (filters.deliveryStage !== "all" && project.deliveryStage !== filters.deliveryStage) return false;
    if (filters.fundingSource !== "all" && !project.funding.some((item) => item.source === filters.fundingSource)) {
      return false;
    }
    if (filters.department !== "all" && project.implementingDepartment !== filters.department) return false;
    if (filters.barangay !== "all") {
      if (filters.barangay === "municipal" && project.barangay !== null) return false;
      if (filters.barangay !== "municipal" && project.barangay !== filters.barangay) return false;
    }
    if (filters.projectType !== "all" && project.projectType !== filters.projectType) return false;
    if (filters.riskLevel !== "all" && project.riskLevel !== filters.riskLevel) return false;
    return true;
  });
}

const RISK_ORDER = { Low: 0, Moderate: 1, High: 2, Critical: 3 } as const;

export function sortProjects(projects: Project[], key: ProjectSortKey, direction: "asc" | "desc") {
  const factor = direction === "asc" ? 1 : -1;

  return projects.toSorted((a, b) => {
    let comparison = 0;
    if (key === "barangay") {
      comparison = (a.barangay ?? "Municipality-wide").localeCompare(b.barangay ?? "Municipality-wide");
    } else if (key === "department") comparison = a.implementingDepartment.localeCompare(b.implementingDepartment);
    else if (key === "riskLevel") comparison = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
    else if (key === "budget" || key === "physicalProgress" || key === "financialProgress") {
      comparison = a[key] - b[key];
    } else comparison = a[key].localeCompare(b[key]);
    return comparison * factor;
  });
}

export function getPortfolioOverview(projects: Project[]) {
  let portfolioValue = 0;
  let obligation = 0;
  let disbursement = 0;
  let readinessBlocked = 0;
  let completed = 0;
  let active = 0;
  let physicalTotal = 0;
  let financialTotal = 0;
  const pipelineMap = new Map<ProjectPipelineStatus, number>();
  const fundingMap = new Map<FundingSource, { budget: number; obligated: number }>();
  const barangayMap = new Map<string, { count: number; budget: number; atRisk: number }>();

  for (const project of projects) {
    if (project.pipelineStatus === "Funded" || !["Planning", "Readiness"].includes(project.deliveryStage)) {
      portfolioValue += project.budget;
    }
    obligation += project.obligation;
    disbursement += project.disbursement;
    if (project.readinessBlockers > 0 && ["Planning", "Readiness"].includes(project.deliveryStage))
      readinessBlocked += 1;
    if (project.deliveryStage === "Completed") completed += 1;
    if (["Implementation", "Inspection"].includes(project.deliveryStage)) active += 1;
    physicalTotal += project.physicalProgress;
    financialTotal += project.financialProgress;
    pipelineMap.set(project.pipelineStatus, (pipelineMap.get(project.pipelineStatus) ?? 0) + 1);

    for (const allocation of project.funding) {
      const existing = fundingMap.get(allocation.source) ?? { budget: 0, obligated: 0 };
      const allocatedObligation = project.obligation * (allocation.share / 100);
      fundingMap.set(allocation.source, {
        budget: existing.budget + allocation.amount,
        obligated: existing.obligated + allocatedObligation,
      });
    }

    if (project.barangay) {
      const existing = barangayMap.get(project.barangay) ?? { count: 0, budget: 0, atRisk: 0 };
      barangayMap.set(project.barangay, {
        count: existing.count + 1,
        budget: existing.budget + project.budget,
        atRisk: existing.atRisk + (["High", "Critical"].includes(project.riskLevel) ? 1 : 0),
      });
    }
  }

  const allAtRiskProjects = projects.filter((project) => ["High", "Critical"].includes(project.riskLevel));
  const atRiskProjects = allAtRiskProjects.toSorted((a, b) => b.slippageDays - a.slippageDays).slice(0, 5);

  const milestones = projects
    .flatMap((project) => project.milestones.map((milestone) => ({ ...milestone, project })))
    .filter((item) => item.status !== "Completed")
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const recentActivities = projects
    .flatMap((project) => project.activities.map((activity) => ({ activity, project })))
    .toSorted((a, b) => b.activity.date.localeCompare(a.activity.date))
    .slice(0, 6) as Array<{ activity: ProjectActivity; project: Project }>;

  return {
    totalProjects: projects.length,
    portfolioValue,
    active,
    obligationRate: portfolioValue ? Math.round((obligation / portfolioValue) * 100) : 0,
    disbursementRate: portfolioValue ? Math.round((disbursement / portfolioValue) * 100) : 0,
    readinessBlocked,
    completed,
    atRiskCount: allAtRiskProjects.length,
    averagePhysical: projects.length ? Math.round(physicalTotal / projects.length) : 0,
    averageFinancial: projects.length ? Math.round(financialTotal / projects.length) : 0,
    pipeline: PIPELINE_ORDER.map((status) => ({ status, count: pipelineMap.get(status) ?? 0 })),
    funding: [...fundingMap.entries()]
      .map(([source, values]) => ({
        source,
        ...values,
        utilization: values.budget ? Math.round((values.obligated / values.budget) * 100) : 0,
      }))
      .toSorted((a, b) => b.budget - a.budget)
      .slice(0, 5),
    atRiskProjects,
    milestones,
    barangays: [...barangayMap.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .toSorted((a, b) => b.budget - a.budget)
      .slice(0, 6),
    recentActivities,
  };
}
