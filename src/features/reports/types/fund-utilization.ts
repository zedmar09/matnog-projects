import type { ProjectDeliveryStage } from "@/features/project-registry/types/project";

export type UtilizationCondition = "Not applicable" | "Low" | "Healthy" | "High" | "Fully utilized";

export type FundUtilizationFilters = {
  search: string;
  fiscalYear: string;
  jurisdiction: string;
  fundSource: string;
  projectType: string;
  deliveryStage: ProjectDeliveryStage | "all";
  condition: UtilizationCondition | "all";
};

export type FundUtilizationRow = {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  barangay: string | null;
  projectType: string;
  deliveryStage: ProjectDeliveryStage;
  fundSource: string;
  fiscalYear: string;
  appropriation: number;
  obligation: number;
  disbursement: number;
  availableBalance: number;
  undisbursedObligation: number;
  obligationRate: number | null;
  disbursementRate: number | null;
  condition: UtilizationCondition;
  slippageDays: number;
  riskLevel: string;
};

export type FundUtilizationTotals = {
  appropriation: number;
  obligation: number;
  disbursement: number;
  availableBalance: number;
  undisbursedObligation: number;
  obligationRate: number | null;
  disbursementRate: number | null;
};

export type UtilizationGroup = {
  id: string;
  label: string;
  appropriation: number;
  obligation: number;
  disbursement: number;
  obligationRate: number | null;
  disbursementRate: number | null;
};

export type UtilizationTrendPoint = {
  month: string;
  disbursement: number;
};

export type FundAttentionItem = {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  severity: "Watch" | "High";
  reason: string;
  amount: number | null;
};

export type FundUtilizationSortKey =
  | "project"
  | "barangay"
  | "fundSource"
  | "appropriation"
  | "obligation"
  | "disbursement"
  | "availableBalance"
  | "obligationRate"
  | "disbursementRate";
