import { MATNOG_BARANGAYS } from "@/data/barangays";

import { DEFAULT_SCORING_CRITERIA } from "../constants/scoring-criteria";

import type {
  FundingSource,
  PriorityRankingRecord,
  Project,
  ProjectDeliveryStage,
  ProjectFundingAllocation,
  ProjectPipelineStatus,
  ProjectRiskLevel,
  ProjectScoring,
  TechnicalReview,
} from "../types/project";

const projectTemplates = [
  ["Farm-to-Market Road Concreting", "Road and transport", "Municipal Engineering Office"],
  ["Level III Water System Expansion", "Water supply", "Municipal Engineering Office"],
  ["Rural Health Station Rehabilitation", "Health facility", "Municipal Health Office"],
  ["Evacuation Center Improvement", "Disaster resilience", "Municipal DRRM Office"],
  ["Coastal Protection and Seawall", "Coastal protection", "Municipal Engineering Office"],
  ["School Classroom Repair", "Education facility", "Local School Board"],
  ["Drainage Canal Improvement", "Drainage", "Municipal Engineering Office"],
  ["Livelihood Processing Center", "Livelihood", "Municipal Agriculture Office"],
  ["Barangay Multi-Purpose Hall", "Public building", "Municipal Engineering Office"],
  ["Digital Permit and Tracking Kiosk", "Digital service", "Municipal IT Office"],
] as const;

const statuses: ProjectPipelineStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Prioritized",
  "Funded",
  "Funded",
  "Funded",
  "Deferred",
  "Rejected",
];

const stages: ProjectDeliveryStage[] = [
  "Planning",
  "Readiness",
  "Procurement",
  "Implementation",
  "Implementation",
  "Inspection",
  "Closeout",
  "Completed",
  "On Hold",
];

const fundingSources: FundingSource[] = [
  "20% Development Fund",
  "General Fund",
  "Local DRRM Fund",
  "Special Education Fund",
  "Barangay Development Fund",
  "National Government Grant",
  "Provincial Assistance",
];

const contractors = [
  "Bicol Prime Builders",
  "Mayon Construction Services",
  "South Luzon Infrastructure Corp.",
  "Matnog Builders Cooperative",
  "Pacificline General Services",
];

const technicalReviewCriteria = [
  ["completeness", "Proposal completeness"],
  ["plan-linkage", "CDP, LDIP, and AIP linkage"],
  ["technical-feasibility", "Technical feasibility"],
  ["site-readiness", "Site and right-of-way readiness"],
  ["cost-reasonableness", "Cost estimate reasonableness"],
  ["fund-eligibility", "Fund source eligibility"],
] as const;

let seed = 614_2026;

function random() {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
}

function amount(minMillions: number, maxMillions: number) {
  const raw = minMillions + random() * (maxMillions - minMillions);
  return Math.round(raw * 20) * 50_000;
}

function isoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function riskFor(stage: ProjectDeliveryStage, slippageDays: number, blockers: number): ProjectRiskLevel {
  if (stage === "On Hold" || slippageDays >= 60) return "Critical";
  if (slippageDays >= 25 || blockers >= 3) return "High";
  if (slippageDays > 0 || blockers > 0) return "Moderate";
  return "Low";
}

function technicalReviewFor(index: number, pipelineStatus: ProjectPipelineStatus): TechnicalReview {
  const reviewVariant = index % 5;
  const alreadyAdvanced = pipelineStatus === "Prioritized" || pipelineStatus === "Funded";
  const status: TechnicalReview["status"] = alreadyAdvanced
    ? "Completed"
    : pipelineStatus !== "Under Review"
      ? "Pending"
      : reviewVariant === 0 || reviewVariant === 3
        ? "Completed"
        : reviewVariant === 1
          ? "For Clarification"
          : reviewVariant === 2
            ? "In Review"
            : "Pending";
  const concernIndex = index % technicalReviewCriteria.length;

  return {
    status,
    reviewer:
      status === "Pending"
        ? "Unassigned"
        : ["Engr. Mara D. Reyes", "MPDC Carlo M. Fronda", "LGOO Ana P. Santos"][index % 3],
    dueDate: isoDate(2026, 8, 18 + (index % 10)),
    recommendation:
      status === "Completed" ? "Advance to Scoring" : status === "For Clarification" ? "Request Clarification" : null,
    notes:
      status === "Completed"
        ? "Technical requirements reviewed. Proposal may proceed to the scoring workspace."
        : status === "For Clarification"
          ? "Request supporting details for the item marked as a concern before completing review."
          : status === "In Review"
            ? "Initial technical validation is in progress."
            : "",
    completedAt: status === "Completed" ? isoDate(2026, 8, 20 + (index % 3)) : null,
    checks: technicalReviewCriteria.map(([id, label], criterionIndex) => ({
      id,
      label,
      status:
        status === "Completed"
          ? "Pass"
          : status === "For Clarification" && criterionIndex === concernIndex
            ? "Concern"
            : status === "For Clarification" || status === "In Review"
              ? criterionIndex <= index % technicalReviewCriteria.length
                ? "Pass"
                : "Not assessed"
              : "Not assessed",
      note:
        status === "For Clarification" && criterionIndex === concernIndex
          ? "Supporting evidence requires clarification."
          : "",
    })),
  };
}

function scoringFor(index: number, review: TechnicalReview, pipelineStatus: ProjectPipelineStatus): ProjectScoring {
  const eligible = review.status === "Completed" && review.recommendation === "Advance to Scoring";
  const alreadyAdvanced = pipelineStatus === "Prioritized" || pipelineStatus === "Funded";
  const variant = index % 4;
  const status: ProjectScoring["status"] = !eligible
    ? "Not Started"
    : alreadyAdvanced || variant === 0
      ? "Finalized"
      : variant === 2
        ? "In Progress"
        : "Not Started";

  return {
    status,
    assessor:
      status === "Not Started"
        ? "Unassigned"
        : ["MPDC Carlo M. Fronda", "Engr. Mara D. Reyes", "LGOO Ana P. Santos"][index % 3],
    notes:
      status === "Finalized"
        ? "Weighted assessment completed for inclusion in the municipal priority ranking exercise."
        : status === "In Progress"
          ? "Initial criteria assessment is underway."
          : "",
    finalizedAt: status === "Finalized" ? isoDate(2026, 8, 21) : null,
    entries: DEFAULT_SCORING_CRITERIA.map((criterion, criterionIndex) => {
      const assessed = status === "Finalized" || (status === "In Progress" && criterionIndex < 3);
      return {
        criterionId: criterion.id,
        rating: assessed ? 3 + ((index + criterionIndex) % 3) : null,
        rationale: assessed ? `Assessment reflects available evidence for ${criterion.label.toLocaleLowerCase()}.` : "",
      };
    }),
  };
}

function priorityRankingFor(
  index: number,
  pipelineStatus: ProjectPipelineStatus,
  scoring: ProjectScoring,
): PriorityRankingRecord {
  const published = pipelineStatus === "Prioritized" || pipelineStatus === "Funded";
  const finalized = scoring.status === "Finalized";
  return {
    decision: published ? "Recommended" : finalized && index % 3 === 1 ? "On Hold" : "Pending Deliberation",
    committeeNote: published
      ? "Approved for inclusion in the municipal priority investment list."
      : finalized && index % 3 === 1
        ? "Retain for committee deliberation alongside available fiscal space."
        : "",
    decidedBy: published ? "Municipal Development Council Secretariat" : "Unassigned",
    decidedAt: published ? isoDate(2026, 8, 22) : null,
    publishedAt: published ? isoDate(2026, 8, 23) : null,
  };
}

export function createProjectDummyData(count = 72): Project[] {
  seed = 614_2026;

  return Array.from({ length: count }, (_, zeroIndex) => {
    const index = zeroIndex + 1;
    const [baseTitle, projectType, department] = projectTemplates[zeroIndex % projectTemplates.length];
    const barangay = zeroIndex % 11 === 0 ? null : MATNOG_BARANGAYS[zeroIndex % MATNOG_BARANGAYS.length];
    const fiscalYear = zeroIndex < 48 ? "2026" : zeroIndex < 62 ? "2025" : "2024";
    const pipelineStatus = statuses[zeroIndex % statuses.length];
    const deliveryStage = pipelineStatus === "Rejected" ? "Planning" : stages[(zeroIndex * 2) % stages.length];
    const budget = amount(0.65, projectType === "Road and transport" ? 18 : 8.5);
    const progressed = ["Implementation", "Inspection", "Closeout", "Completed"].includes(deliveryStage);
    const physicalProgress =
      deliveryStage === "Completed"
        ? 100
        : progressed
          ? Math.min(96, 22 + ((index * 13) % 75))
          : deliveryStage === "Procurement"
            ? 8
            : 0;
    const financialProgress = Math.max(0, Math.min(100, physicalProgress - 5 + ((index * 7) % 18)));
    const appropriation = pipelineStatus === "Funded" || progressed ? budget : Math.round(budget * 0.2);
    const obligation = Math.round(appropriation * (financialProgress / 100));
    const disbursement = Math.round(obligation * (0.62 + (index % 4) * 0.09));
    const readinessPercent = deliveryStage === "Planning" ? 35 + (index % 5) * 9 : Math.min(100, 68 + (index % 5) * 8);
    const readinessBlockers = readinessPercent >= 100 ? 0 : index % 5 === 0 ? 3 : index % 4 === 0 ? 1 : 0;
    const slippageDays =
      deliveryStage === "Completed" ? 0 : index % 13 === 0 ? 74 : index % 7 === 0 ? 34 : index % 5 === 0 ? 12 : 0;
    const riskLevel = riskFor(deliveryStage, slippageDays, readinessBlockers);
    const source = fundingSources[zeroIndex % fundingSources.length];
    const emergency = index % 17 === 0;
    const proposalSource = emergency
      ? "Emergency Assessment"
      : !barangay
        ? "Department Proposal"
        : index % 5 === 0
          ? "Constituent Request"
          : index % 3 === 0
            ? "Barangay BDP"
            : "Council Resolution";
    const startMonth = zeroIndex % 10;
    const completionMonth = Math.min(11, startMonth + 2 + (zeroIndex % 4));
    const targetStart = isoDate(Number(fiscalYear), startMonth, 8 + (index % 12));
    const targetCompletion = isoDate(Number(fiscalYear), completionMonth, 12 + (index % 14));
    const projectTitle = `${baseTitle} – ${barangay ?? "Municipality-wide"}`;
    const funding: ProjectFundingAllocation[] =
      index % 8 === 0
        ? [
            { source, amount: Math.round(budget * 0.72), share: 72, eligibility: "Approved" as const },
            {
              source: "Provincial Assistance" as const,
              amount: Math.round(budget * 0.28),
              share: 28,
              eligibility: "Approved" as const,
            },
          ]
        : [
            {
              source,
              amount: budget,
              share: 100,
              eligibility: pipelineStatus === "Funded" ? "Approved" : "Eligible",
            },
          ];

    const technicalReview = technicalReviewFor(index, pipelineStatus);
    const scoring = scoringFor(index, technicalReview, pipelineStatus);

    return {
      id: `project-${String(index).padStart(4, "0")}`,
      code: `MAT-${fiscalYear}-${String(index).padStart(3, "0")}`,
      title: projectTitle,
      description: `${baseTitle} to improve safe, reliable access to essential municipal services for residents of ${barangay ?? "Matnog"}.`,
      problemStatement: `${barangay ?? "Municipality-wide"} residents experience service gaps that affect safe and reliable access to ${projectType.toLocaleLowerCase()} facilities and support.`,
      expectedOutcome: `Improved access, safety, and service reliability for ${180 + ((index * 137) % 4_600)} intended beneficiaries.`,
      projectType,
      proposalSource,
      implementingDepartment: department,
      requestingOffice: barangay ? `Barangay ${barangay}` : department,
      leadOfficer: ["Engr. Mara D. Reyes", "Ar. Noel B. Fronda", "LGOO Ana P. Santos", "RHU Dr. Liza M. Ramos"][
        index % 4
      ],
      barangay,
      location: barangay ? `Barangay ${barangay}, Matnog, Sorsogon` : "Multiple barangays, Matnog, Sorsogon",
      beneficiaries: 180 + ((index * 137) % 4_600),
      beneficiarySectors: index % 4 === 0 ? ["Families", "Senior citizens", "PWD"] : ["Families", "Local workers"],
      pipelineStatus,
      deliveryStage,
      proposalCompleteness: pipelineStatus === "Draft" ? Math.min(96, 54 + (index % 7) * 7) : 100,
      technicalReview,
      scoring,
      priorityRanking: priorityRankingFor(index, pipelineStatus, scoring),
      priorityRank: index,
      fiscalYear,
      multiYear: index % 8 === 0,
      planReferences: [
        `AIP-${fiscalYear}-${String(index).padStart(3, "0")}`,
        `LDIP-2026-${projectType.slice(0, 3).toUpperCase()}`,
      ],
      funding,
      budget,
      appropriation,
      obligation,
      disbursement,
      physicalProgress,
      financialProgress,
      readinessPercent,
      readinessBlockers,
      procurementMode: budget >= 5_000_000 ? "Public Bidding" : "Small Value Procurement",
      procurementStatus:
        deliveryStage === "Planning"
          ? "Not started"
          : deliveryStage === "Readiness"
            ? "For PPMP validation"
            : "Awarded",
      contractor: progressed ? contractors[index % contractors.length] : null,
      targetStart,
      targetCompletion,
      lastUpdated: isoDate(2026, 8, Math.max(1, 23 - (index % 18))),
      slippageDays,
      riskLevel,
      riskReasons:
        riskLevel === "Critical"
          ? ["Work suspended", "Schedule variance requires executive action"]
          : riskLevel === "High"
            ? [readinessBlockers ? "Unresolved readiness requirements" : "Progress behind approved schedule"]
            : riskLevel === "Moderate"
              ? ["Monitor delivery against next milestone"]
              : [],
      tags: index % 6 === 0 ? ["DRR", "Climate action"] : index % 5 === 0 ? ["GAD", "SDG"] : ["AIP"],
      documentCount: 6 + (index % 17),
      documentCompleteness: Math.min(100, 52 + (index % 7) * 8),
      emergency,
      milestones: [
        {
          id: `milestone-${index}-1`,
          label:
            deliveryStage === "Procurement"
              ? "Bid evaluation"
              : physicalProgress > 0
                ? "Progress validation"
                : "Readiness review",
          date: isoDate(2026, 8 + (index % 3), 3 + (index % 22)),
          status: slippageDays > 25 ? "Delayed" : index % 4 === 0 ? "Due soon" : "Upcoming",
        },
      ],
      activities: [
        {
          id: `activity-${index}-1`,
          date: isoDate(2026, 8, Math.max(1, 23 - (index % 18))),
          action: progressed ? "Progress update recorded" : "Project record reviewed",
          actor: ["Municipal Engineering Office", "MPDC", "BAC Secretariat", "Municipal Budget Office"][index % 4],
          note: progressed
            ? `Physical accomplishment updated to ${physicalProgress}%.`
            : `${pipelineStatus} status confirmed for the current review cycle.`,
        },
      ],
    };
  });
}
