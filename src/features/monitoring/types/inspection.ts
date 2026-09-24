export type InspectionStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Follow-up Required";

export type InspectionType = "Routine" | "Milestone" | "Pre-Final" | "Final" | "Spot Check" | "Follow-up";

export type InspectionRating = "Satisfactory" | "Needs Improvement" | "Unsatisfactory" | "Not Assessed";

export type InspectionFinding = {
  id: string;
  area: string;
  observation: string;
  rating: InspectionRating;
  actionRequired: string;
};

export type Inspection = {
  id: string;
  code: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  barangay: string | null;
  projectType: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate: string | null;
  inspector: string;
  inspectorDesignation: string;
  physicalProgressAtInspection: number;
  financialProgressAtInspection: number;
  overallRating: InspectionRating;
  findings: InspectionFinding[];
  remarks: string;
  photosCount: number;
  contractor: string | null;
  lastUpdated: string;
};

export type InspectionSortKey =
  | "code"
  | "project"
  | "barangay"
  | "type"
  | "status"
  | "scheduledDate"
  | "inspector"
  | "rating";

export type InspectionFilters = {
  search: string;
  status: string;
  inspectionType: string;
  rating: string;
  barangay: string;
  inspector: string;
};
