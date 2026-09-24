export type ProgressUpdateStatus = "Draft" | "Submitted" | "Verified" | "Returned" | "Archived";

export type ProgressUpdateType = "Weekly" | "Bi-weekly" | "Monthly" | "Milestone" | "Ad-hoc";

export type WorkItem = {
  id: string;
  description: string;
  unit: string;
  targetQty: number;
  accomplishedQty: number;
  percentage: number;
};

export type ProgressUpdate = {
  id: string;
  code: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  barangay: string | null;
  projectType: string;
  contractor: string | null;
  reportType: ProgressUpdateType;
  status: ProgressUpdateStatus;
  periodStart: string;
  periodEnd: string;
  submittedDate: string | null;
  submittedBy: string;
  designation: string;
  previousPhysical: number;
  currentPhysical: number;
  previousFinancial: number;
  currentFinancial: number;
  slippageDays: number;
  workItems: WorkItem[];
  issues: string;
  nextSteps: string;
  photosCount: number;
  lastUpdated: string;
};

export type ProgressUpdateSortKey =
  | "code"
  | "project"
  | "barangay"
  | "type"
  | "status"
  | "periodEnd"
  | "submittedBy"
  | "physical";

export type ProgressUpdateFilters = {
  search: string;
  status: string;
  reportType: string;
  barangay: string;
};
