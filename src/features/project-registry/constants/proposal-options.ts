import type { FundingSource } from "../types/project";

export const PROPOSAL_SOURCES = [
  "Department Proposal",
  "Barangay BDP",
  "Council Resolution",
  "Constituent Request",
  "Emergency Assessment",
];

export const IMPLEMENTING_DEPARTMENTS = [
  "Municipal Agriculture Office",
  "Municipal DRRM Office",
  "Municipal Engineering Office",
  "Municipal Health Office",
  "Municipal IT Office",
  "Municipal Planning and Development Office",
  "Municipal Social Welfare and Development Office",
  "Local School Board",
];

export const PROJECT_TYPES = [
  "Road and transport",
  "Water supply",
  "Health facility",
  "Disaster resilience",
  "Coastal protection",
  "Education facility",
  "Drainage",
  "Livelihood",
  "Public building",
  "Digital service",
];

export const FUNDING_SOURCES: FundingSource[] = [
  "20% Development Fund",
  "General Fund",
  "Local DRRM Fund",
  "Special Education Fund",
  "Barangay Development Fund",
  "National Government Grant",
  "Provincial Assistance",
];

export const BENEFICIARY_SECTORS = [
  "Families",
  "Women",
  "Children and youth",
  "Senior citizens",
  "PWD",
  "Farmers and fisherfolk",
  "Local workers",
  "Indigenous peoples",
];

export const THEMATIC_TAGS = ["GAD", "Climate adaptation", "Climate mitigation", "DRR", "Senior/PWD", "SDG"];

export const PROPOSAL_STEPS = [
  { title: "Source & ownership", short: "Source" },
  { title: "Need & location", short: "Need" },
  { title: "Outcome & cost", short: "Cost" },
  { title: "Plans & funding", short: "Funding" },
  { title: "Review & save", short: "Review" },
];
