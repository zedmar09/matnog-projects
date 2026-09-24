import type { ProjectDeliveryStage, ProjectRiskLevel } from "@/features/project-registry/types/project";

export type BarangayPerformanceRow = {
  barangay: string;
  totalProjects: number;
  totalBudget: number;
  totalAppropriation: number;
  totalObligation: number;
  totalDisbursement: number;
  avgPhysicalProgress: number;
  avgFinancialProgress: number;
  obligationRate: number | null;
  disbursementRate: number | null;
  onTimeCount: number;
  delayedCount: number;
  onTimeRate: number;
  avgSlippage: number;
  completedCount: number;
  implementationCount: number;
  stageBreakdown: Partial<Record<ProjectDeliveryStage, number>>;
  riskBreakdown: Partial<Record<ProjectRiskLevel, number>>;
  highRiskCount: number;
  typeBreakdown: Record<string, number>;
  performanceScore: number;
  performanceTier: PerformanceTier;
};

export type PerformanceTier = "Excellent" | "Good" | "Fair" | "Needs Improvement";

export type BarangayPerformanceTotals = {
  totalBarangays: number;
  totalProjects: number;
  totalBudget: number;
  avgPhysicalProgress: number;
  avgFinancialProgress: number;
  avgOnTimeRate: number;
  excellentCount: number;
  goodCount: number;
  fairCount: number;
  needsImprovementCount: number;
};

export type BarangayPerformanceSortKey =
  | "barangay"
  | "totalProjects"
  | "totalBudget"
  | "avgPhysicalProgress"
  | "avgFinancialProgress"
  | "onTimeRate"
  | "performanceScore"
  | "highRiskCount"
  | "completedCount"
  | "avgSlippage";

export type BarangayPerformanceFilters = {
  search: string;
  performanceTier: PerformanceTier | "all";
  minProjects: number;
};
