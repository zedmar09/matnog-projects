export type ProjectPipelineStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Prioritized"
  | "Funded"
  | "Deferred"
  | "Rejected";

export type ProjectDeliveryStage =
  | "Planning"
  | "Readiness"
  | "Procurement"
  | "Implementation"
  | "Inspection"
  | "Closeout"
  | "Completed"
  | "On Hold";

export type ProjectRiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type ProjectSortKey =
  | "code"
  | "title"
  | "barangay"
  | "department"
  | "fiscalYear"
  | "budget"
  | "pipelineStatus"
  | "deliveryStage"
  | "physicalProgress"
  | "financialProgress"
  | "riskLevel"
  | "targetCompletion";

export type ProjectFilters = {
  search: string;
  pipelineStatus: string;
  deliveryStage: string;
  fundingSource: string;
  department: string;
  barangay: string;
  projectType: string;
  riskLevel: string;
};

export type FundingSource =
  | "20% Development Fund"
  | "General Fund"
  | "Local DRRM Fund"
  | "Special Education Fund"
  | "Barangay Development Fund"
  | "National Government Grant"
  | "Provincial Assistance";

export type ProjectActivity = {
  id: string;
  date: string;
  action: string;
  actor: string;
  note: string;
};

export type ProjectMilestone = {
  id: string;
  label: string;
  date: string;
  status: "Upcoming" | "Due soon" | "Delayed" | "Completed";
};

export type ProjectFundingAllocation = {
  source: FundingSource;
  amount: number;
  share: number;
  eligibility: "Eligible" | "For validation" | "Approved";
};

export type Project = {
  id: string;
  code: string;
  title: string;
  description: string;
  projectType: string;
  proposalSource: string;
  implementingDepartment: string;
  requestingOffice: string;
  leadOfficer: string;
  barangay: string | null;
  location: string;
  beneficiaries: number;
  beneficiarySectors: string[];
  pipelineStatus: ProjectPipelineStatus;
  deliveryStage: ProjectDeliveryStage;
  priorityRank: number;
  fiscalYear: string;
  multiYear: boolean;
  planReferences: string[];
  funding: ProjectFundingAllocation[];
  budget: number;
  appropriation: number;
  obligation: number;
  disbursement: number;
  physicalProgress: number;
  financialProgress: number;
  readinessPercent: number;
  readinessBlockers: number;
  procurementMode: string;
  procurementStatus: string;
  contractor: string | null;
  targetStart: string;
  targetCompletion: string;
  lastUpdated: string;
  slippageDays: number;
  riskLevel: ProjectRiskLevel;
  riskReasons: string[];
  tags: string[];
  documentCount: number;
  documentCompleteness: number;
  emergency: boolean;
  milestones: ProjectMilestone[];
  activities: ProjectActivity[];
};

export type ProjectProposalInput = Pick<
  Project,
  | "title"
  | "description"
  | "projectType"
  | "proposalSource"
  | "implementingDepartment"
  | "requestingOffice"
  | "leadOfficer"
  | "barangay"
  | "location"
  | "beneficiaries"
  | "beneficiarySectors"
  | "fiscalYear"
  | "multiYear"
  | "planReferences"
  | "funding"
  | "budget"
  | "targetStart"
  | "targetCompletion"
  | "tags"
  | "emergency"
> & { submit?: boolean };
