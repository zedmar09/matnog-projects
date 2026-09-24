import { create } from "zustand";

import { createInspectionDummyData } from "../data/inspection-dummy-data";
import { createProgressUpdateDummyData } from "../data/progress-update-dummy-data";
import type { Inspection, InspectionFinding, InspectionRating, InspectionStatus, InspectionType } from "../types/inspection";
import type { ProgressUpdate, ProgressUpdateStatus, ProgressUpdateType, WorkItem } from "../types/progress-update";

export type ProgressUpdateInput = {
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
  submit?: boolean;
};

export type InspectionInput = {
  projectId: string;
  projectCode: string;
  projectTitle: string;
  barangay: string | null;
  projectType: string;
  contractor: string | null;
  inspectionType: InspectionType;
  scheduledDate: string;
  inspector: string;
  inspectorDesignation: string;
  physicalProgressAtInspection: number;
  financialProgressAtInspection: number;
  overallRating: InspectionRating;
  findings: InspectionFinding[];
  remarks: string;
  status: InspectionStatus;
  submit?: boolean;
};

type MonitoringState = {
  inspections: Inspection[];
  progressUpdates: ProgressUpdate[];
  addInspection: (input: InspectionInput) => Inspection;
  updateInspection: (id: string, input: Partial<InspectionInput>) => void;
  addProgressUpdate: (input: ProgressUpdateInput) => ProgressUpdate;
  updateProgressUpdate: (id: string, input: Partial<ProgressUpdateInput>) => void;
};

export const useMonitoringStore = create<MonitoringState>()((set, get) => ({
  inspections: createInspectionDummyData(),
  progressUpdates: createProgressUpdateDummyData(),

  addInspection: (input) => {
    const all = get().inspections;
    const index = all.length + 1;
    const now = new Date().toISOString().slice(0, 10);
    const inspection: Inspection = {
      id: `inspection-${String(index).padStart(4, "0")}`,
      code: `INS-2026-${String(index).padStart(3, "0")}`,
      projectId: input.projectId,
      projectCode: input.projectCode,
      projectTitle: input.projectTitle,
      barangay: input.barangay,
      projectType: input.projectType,
      inspectionType: input.inspectionType,
      status: input.submit ? input.status : "Scheduled",
      scheduledDate: input.scheduledDate,
      completedDate: input.status === "Completed" ? now : null,
      inspector: input.inspector,
      inspectorDesignation: input.inspectorDesignation,
      physicalProgressAtInspection: input.physicalProgressAtInspection,
      financialProgressAtInspection: input.financialProgressAtInspection,
      overallRating: input.overallRating,
      findings: input.findings,
      remarks: input.remarks,
      photosCount: 0,
      contractor: input.contractor,
      lastUpdated: now,
    };
    set({ inspections: [inspection, ...all] });
    return inspection;
  },

  updateInspection: (id, input) => {
    const now = new Date().toISOString().slice(0, 10);
    set({
      inspections: get().inspections.map((ins) =>
        ins.id === id ? { ...ins, ...input, lastUpdated: now } as Inspection : ins,
      ),
    });
  },

  addProgressUpdate: (input) => {
    const all = get().progressUpdates;
    const index = all.length + 1;
    const now = new Date().toISOString().slice(0, 10);
    const update: ProgressUpdate = {
      id: `progress-${String(index).padStart(4, "0")}`,
      code: `PRG-2026-${String(index).padStart(3, "0")}`,
      projectId: input.projectId,
      projectCode: input.projectCode,
      projectTitle: input.projectTitle,
      barangay: input.barangay,
      projectType: input.projectType,
      contractor: input.contractor,
      reportType: input.reportType,
      status: input.submit ? input.status : "Draft",
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      submittedDate: input.submit ? now : null,
      submittedBy: input.submittedBy,
      designation: input.designation,
      previousPhysical: input.previousPhysical,
      currentPhysical: input.currentPhysical,
      previousFinancial: input.previousFinancial,
      currentFinancial: input.currentFinancial,
      slippageDays: input.slippageDays,
      workItems: input.workItems,
      issues: input.issues,
      nextSteps: input.nextSteps,
      photosCount: 0,
      lastUpdated: now,
    };
    set({ progressUpdates: [update, ...all] });
    return update;
  },

  updateProgressUpdate: (id, input) => {
    const now = new Date().toISOString().slice(0, 10);
    set({
      progressUpdates: get().progressUpdates.map((upd) =>
        upd.id === id ? { ...upd, ...input, lastUpdated: now } as ProgressUpdate : upd,
      ),
    });
  },
}));
