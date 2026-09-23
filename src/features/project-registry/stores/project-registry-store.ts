"use client";

import { create } from "zustand";

import { DEFAULT_SCORING_CRITERIA } from "../constants/scoring-criteria";
import { createProjectDummyData } from "../data/project-dummy-data";
import type {
  DuplicateReviewRecord,
  FundingHandoffRecord,
  PriorityRankingRecord,
  Project,
  ProjectActivity,
  ProjectPipelineStatus,
  ProjectProposalInput,
  ProjectScoring,
  ScoringCriterion,
  TechnicalReview,
} from "../types/project";

type SafeProjectChanges = Partial<Omit<Project, "id" | "code">>;

type ProjectRegistryState = {
  projects: Project[];
  scoringCriteria: ScoringCriterion[];
  nextProjectSequence: number;
  addProposal: (input: ProjectProposalInput) => Project;
  updateProject: (id: string, changes: SafeProjectChanges) => Project | undefined;
  transitionProject: (id: string, status: ProjectPipelineStatus, note: string) => Project | undefined;
  saveTechnicalReview: (id: string, review: TechnicalReview) => Project | undefined;
  saveProjectScoring: (id: string, scoring: ProjectScoring) => Project | undefined;
  savePriorityDecision: (id: string, ranking: PriorityRankingRecord) => Project | undefined;
  publishPriorityRanking: (ids: string[]) => number;
  saveDuplicateReview: (id: string, review: DuplicateReviewRecord) => Project | undefined;
  saveFundingHandoff: (id: string, handoff: FundingHandoffRecord) => Project | undefined;
  updateScoringCriteria: (criteria: ScoringCriterion[]) => boolean;
  getProjectById: (id: string) => Project | undefined;
  addActivity: (projectId: string, activity: Omit<ProjectActivity, "id">) => ProjectActivity | undefined;
};

const initialProjects = createProjectDummyData(72);

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const useProjectRegistryStore = create<ProjectRegistryState>((set, get) => ({
  projects: initialProjects,
  scoringCriteria: DEFAULT_SCORING_CRITERIA,
  nextProjectSequence: initialProjects.length + 1,
  addProposal: (input) => {
    const sequence = get().nextProjectSequence;
    const date = today();
    const pipelineStatus = input.submit ? "Submitted" : "Draft";
    const project: Project = {
      ...input,
      id: `project-session-${sequence}`,
      code: `MAT-${input.fiscalYear}-${String(sequence).padStart(3, "0")}`,
      pipelineStatus,
      deliveryStage: "Planning",
      proposalCompleteness: 100,
      technicalReview: {
        status: "Pending",
        reviewer: "Unassigned",
        dueDate: date,
        recommendation: null,
        notes: "",
        completedAt: null,
        checks: [
          ["completeness", "Proposal completeness"],
          ["plan-linkage", "CDP, LDIP, and AIP linkage"],
          ["technical-feasibility", "Technical feasibility"],
          ["site-readiness", "Site and right-of-way readiness"],
          ["cost-reasonableness", "Cost estimate reasonableness"],
          ["fund-eligibility", "Fund source eligibility"],
        ].map(([id, label]) => ({ id, label, status: "Not assessed" as const, note: "" })),
      },
      scoring: {
        status: "Not Started",
        assessor: "Unassigned",
        notes: "",
        finalizedAt: null,
        entries: get().scoringCriteria.map((criterion) => ({ criterionId: criterion.id, rating: null, rationale: "" })),
      },
      priorityRanking: {
        decision: "Pending Deliberation",
        committeeNote: "",
        decidedBy: "Unassigned",
        decidedAt: null,
        publishedAt: null,
      },
      duplicateReview: {
        matchedProjectId: null,
        confidence: 0,
        signals: [],
        status: "Pending Review",
        outcome: "Pending",
        reviewer: "Unassigned",
        note: "",
        reviewedAt: null,
      },
      fundingHandoff: {
        status: "Not Started",
        assignedOffice: "Unassigned",
        note: "",
        updatedBy: "Unassigned",
        updatedAt: null,
      },
      priorityRank: get().projects.length + 1,
      appropriation: 0,
      obligation: 0,
      disbursement: 0,
      physicalProgress: 0,
      financialProgress: 0,
      readinessPercent: 10,
      readinessBlockers: 0,
      procurementMode: "For assessment",
      procurementStatus: "Not started",
      contractor: null,
      lastUpdated: date,
      slippageDays: 0,
      riskLevel: "Low",
      riskReasons: [],
      documentCount: 0,
      documentCompleteness: 0,
      milestones: [],
      activities: [
        {
          id: `activity-session-${sequence}-1`,
          date,
          action: input.submit ? "Proposal submitted" : "Draft proposal created",
          actor: input.requestingOffice,
          note: input.submit ? "Proposal entered the municipal review queue." : "Proposal saved for completion.",
        },
      ],
    };

    set((state) => ({ projects: [project, ...state.projects], nextProjectSequence: sequence + 1 }));
    return project;
  },
  updateProject: (id, changes) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const updated: Project = { ...current, ...changes, id: current.id, code: current.code, lastUpdated: today() };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  transitionProject: (id, pipelineStatus, note) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const date = today();
    const activity: ProjectActivity = {
      id: `activity-session-${id}-${current.activities.length + 1}`,
      date,
      action: `Status changed to ${pipelineStatus}`,
      actor: "Project Management Office",
      note,
    };
    const updated = {
      ...current,
      pipelineStatus,
      lastUpdated: date,
      activities: [activity, ...current.activities],
    };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  saveTechnicalReview: (id, technicalReview) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const date = today();
    const activity: ProjectActivity = {
      id: `activity-session-${id}-${current.activities.length + 1}`,
      date,
      action: technicalReview.status === "Completed" ? "Technical review completed" : "Technical review updated",
      actor: technicalReview.reviewer,
      note: technicalReview.recommendation ?? "Technical review details saved.",
    };
    const updated: Project = {
      ...current,
      technicalReview,
      lastUpdated: date,
      activities: [activity, ...current.activities],
    };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  saveProjectScoring: (id, scoring) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const date = today();
    const activity: ProjectActivity = {
      id: `activity-session-${id}-${current.activities.length + 1}`,
      date,
      action: scoring.status === "Finalized" ? "Project score finalized" : "Project scoring updated",
      actor: scoring.assessor,
      note: scoring.status === "Finalized" ? "Weighted score finalized for priority ranking." : "Scoring draft saved.",
    };
    const updated: Project = {
      ...current,
      scoring,
      lastUpdated: date,
      activities: [activity, ...current.activities],
    };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  savePriorityDecision: (id, priorityRanking) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const date = today();
    const activity: ProjectActivity = {
      id: `activity-session-${id}-${current.activities.length + 1}`,
      date,
      action: "Priority decision updated",
      actor: priorityRanking.decidedBy,
      note: priorityRanking.decision,
    };
    const updated: Project = {
      ...current,
      priorityRanking,
      lastUpdated: date,
      activities: [activity, ...current.activities],
    };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  publishPriorityRanking: (ids) => {
    const idSet = new Set(ids);
    const date = today();
    let published = 0;
    set((state) => ({
      projects: state.projects.map((project) => {
        if (!idSet.has(project.id) || project.pipelineStatus !== "Under Review") return project;
        published += 1;
        const activity: ProjectActivity = {
          id: `activity-session-${project.id}-${project.activities.length + 1}`,
          date,
          action: "Published to priority ranking",
          actor: "Municipal Development Council Secretariat",
          note: "Committee recommendation published and project moved to Prioritized.",
        };
        return {
          ...project,
          pipelineStatus: "Prioritized" as const,
          priorityRanking: { ...project.priorityRanking, publishedAt: date },
          lastUpdated: date,
          activities: [activity, ...project.activities],
        };
      }),
    }));
    return published;
  },
  saveDuplicateReview: (id, duplicateReview) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const date = today();
    const shouldDefer = duplicateReview.outcome === "Consolidate" || duplicateReview.outcome === "Confirmed Duplicate";
    const pipelineStatus = shouldDefer ? ("Deferred" as const) : current.pipelineStatus;
    const activity: ProjectActivity = {
      id: `activity-session-${id}-${current.activities.length + 1}`,
      date,
      action: "Duplicate and overlap review completed",
      actor: duplicateReview.reviewer,
      note: shouldDefer
        ? `${duplicateReview.outcome}. Project moved to Deferred pending portfolio action.`
        : `${duplicateReview.outcome}. Project remains in its current pipeline stage.`,
    };
    const updated: Project = {
      ...current,
      duplicateReview,
      pipelineStatus,
      lastUpdated: date,
      activities: [activity, ...current.activities],
    };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  saveFundingHandoff: (id, fundingHandoff) => {
    const current = get().projects.find((project) => project.id === id);
    if (!current) return undefined;
    const date = today();
    const activity: ProjectActivity = {
      id: `activity-session-${id}-${current.activities.length + 1}`,
      date,
      action: "Funding planning handoff updated",
      actor: fundingHandoff.updatedBy,
      note: `${fundingHandoff.status}. ${fundingHandoff.note}`,
    };
    const updated: Project = {
      ...current,
      fundingHandoff,
      lastUpdated: date,
      activities: [activity, ...current.activities],
    };
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? updated : project)) }));
    return updated;
  },
  updateScoringCriteria: (scoringCriteria) => {
    const total = scoringCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (total !== 100 || scoringCriteria.some((criterion) => criterion.weight <= 0)) return false;
    set({ scoringCriteria });
    return true;
  },
  getProjectById: (id) => get().projects.find((project) => project.id === id),
  addActivity: (projectId, input) => {
    const current = get().projects.find((project) => project.id === projectId);
    if (!current) return undefined;
    const activity: ProjectActivity = {
      ...input,
      id: `activity-session-${projectId}-${current.activities.length + 1}`,
    };
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, lastUpdated: input.date, activities: [activity, ...project.activities] }
          : project,
      ),
    }));
    return activity;
  },
}));
