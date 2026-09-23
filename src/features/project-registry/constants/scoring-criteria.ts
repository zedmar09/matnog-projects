import type { ScoringCriterion } from "../types/project";

export const DEFAULT_SCORING_CRITERIA: ScoringCriterion[] = [
  {
    id: "strategic-alignment",
    label: "Strategic and plan alignment",
    description: "Strength of linkage to the CDP, LDIP, AIP, and current municipal priorities.",
    weight: 25,
  },
  {
    id: "urgency-public-need",
    label: "Urgency and public need",
    description: "Severity, service gap, and urgency of the problem the proposal addresses.",
    weight: 20,
  },
  {
    id: "beneficiary-equity",
    label: "Beneficiary reach and equity",
    description: "Scale of benefit and inclusion of vulnerable or underserved sectors.",
    weight: 20,
  },
  {
    id: "technical-readiness",
    label: "Technical readiness",
    description: "Feasibility, site readiness, supporting studies, and implementation capacity.",
    weight: 15,
  },
  {
    id: "financial-viability",
    label: "Financial viability",
    description: "Cost reasonableness, fund eligibility, and affordability within fiscal constraints.",
    weight: 10,
  },
  {
    id: "sustainability-risk",
    label: "Sustainability and risk",
    description: "Long-term maintainability, resilience, and exposure to delivery risks.",
    weight: 10,
  },
];
