import type { ProjectDeliveryStage, ProjectPipelineStatus, ProjectRiskLevel } from "@/features/project-registry/types/project";

export type ProjectStatusRow = {
  id: string;
  code: string;
  title: string;
  barangay: string | null;
  projectType: string;
  department: string;
  pipelineStatus: ProjectPipelineStatus;
  deliveryStage: ProjectDeliveryStage;
  physicalProgress: number;
  financialProgress: number;
  budget: number;
  appropriation: number;
  riskLevel: ProjectRiskLevel;
  slippageDays: number;
  targetCompletion: string;
  contractor: string | null;
  fiscalYear: string;
};

export type ProjectStatusTotals = {
  total: number;
  totalBudget: number;
  funded: number;
  inImplementation: number;
  completed: number;
  atRisk: number;
  avgPhysical: number;
  avgFinancial: number;
};

export type StageCount = {
  stage: ProjectDeliveryStage;
  count: number;
  percent: number;
};

export type PipelineCount = {
  status: ProjectPipelineStatus;
  count: number;
  percent: number;
};

export type RiskCount = {
  level: ProjectRiskLevel;
  count: number;
  percent: number;
};

export type ProjectStatusSortKey =
  | "code"
  | "title"
  | "barangay"
  | "projectType"
  | "pipelineStatus"
  | "deliveryStage"
  | "physicalProgress"
  | "financialProgress"
  | "budget"
  | "riskLevel"
  | "slippageDays"
  | "targetCompletion";

export type ProjectStatusFilters = {
  search: string;
  pipelineStatus: ProjectPipelineStatus | "all";
  deliveryStage: ProjectDeliveryStage | "all";
  riskLevel: ProjectRiskLevel | "all";
  projectType: string;
  barangay: string;
};
