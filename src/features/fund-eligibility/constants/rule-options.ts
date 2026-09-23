import type {
  EligibilityConditionType,
  EligibilityEffect,
  EligibilityOperator,
  OverrideMode,
} from "../types/eligibility-rule";

export const CONDITION_TYPES: EligibilityConditionType[] = [
  "Project Type",
  "Jurisdiction",
  "Plan Linkage",
  "Project Tag",
  "Emergency",
  "Requesting Office",
  "Proposed Budget",
];
export const EFFECTS: EligibilityEffect[] = ["Allow", "Block", "Require Validation"];
export const OVERRIDE_MODES: OverrideMode[] = ["Add", "Replace", "Disable"];
export const RULE_ACTORS = [
  "Unassigned",
  "Municipal Budget Office",
  "Municipal Planning and Development Office",
  "Local Finance Committee Secretariat",
  "Municipal Treasurer's Office",
];
export const OPERATORS_BY_CONDITION: Record<EligibilityConditionType, EligibilityOperator[]> = {
  "Project Type": ["Is Any Of", "Is None Of"],
  Jurisdiction: ["Is Any Of", "Is None Of"],
  "Plan Linkage": ["Contains Any", "Contains All"],
  "Project Tag": ["Contains Any", "Contains All"],
  Emergency: ["Is True", "Is False"],
  "Requesting Office": ["Is Any Of", "Is None Of"],
  "Proposed Budget": ["Less Than or Equal", "Greater Than or Equal", "Between"],
};
