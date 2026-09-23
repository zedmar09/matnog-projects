import type { FundCategory } from "@/features/funding-registry/types/fund-source";

export type EligibilityConditionType =
  | "Project Type"
  | "Jurisdiction"
  | "Plan Linkage"
  | "Project Tag"
  | "Emergency"
  | "Requesting Office"
  | "Proposed Budget";
export type EligibilityOperator =
  | "Is Any Of"
  | "Is None Of"
  | "Contains Any"
  | "Contains All"
  | "Is True"
  | "Is False"
  | "Less Than or Equal"
  | "Greater Than or Equal"
  | "Between";
export type EligibilityEffect = "Allow" | "Block" | "Require Validation";
export type OverrideMode = "Add" | "Replace" | "Disable";
export type EligibilityResult = "Eligible" | "Ineligible" | "Needs Validation";
export type RuleMatchStatus = "Passed" | "Failed" | "Needs Validation";

export type EligibilityRuleTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  fundCategory: FundCategory;
  conditionType: EligibilityConditionType;
  operator: EligibilityOperator;
  values: string[];
  effect: EligibilityEffect;
  priority: number;
  active: boolean;
  legalBasis: string;
  createdAt: string;
  updatedAt: string;
};

export type FundEligibilityOverride = {
  id: string;
  code: string;
  fundSourceId: string;
  templateRuleId: string | null;
  mode: OverrideMode;
  name: string;
  description: string;
  conditionType: EligibilityConditionType | null;
  operator: EligibilityOperator | null;
  values: string[];
  effect: EligibilityEffect | null;
  priority: number;
  active: boolean;
  legalBasis: string;
  updatedAt: string;
};

export type EffectiveEligibilityRule = {
  id: string;
  code: string;
  name: string;
  description: string;
  conditionType: EligibilityConditionType;
  operator: EligibilityOperator;
  values: string[];
  effect: EligibilityEffect;
  priority: number;
  origin: "Inherited" | "Override";
  sourceId: string;
  legalBasis: string;
};

export type EligibilityRuleResult = {
  rule: EffectiveEligibilityRule;
  matched: boolean;
  status: RuleMatchStatus;
  explanation: string;
};
export type FundEligibilityEvaluation = {
  projectId: string;
  fundSourceId: string;
  result: EligibilityResult;
  evaluatedAt: string;
  ruleResults: EligibilityRuleResult[];
};
export type EligibilityActivity = {
  id: string;
  ruleId: string;
  date: string;
  action: string;
  actor: string;
  note: string;
};
export type EligibilityFieldErrors = Partial<Record<string, string>>;
export type EligibilityMutationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; fieldErrors?: EligibilityFieldErrors };

export type TemplateRuleInput = Omit<EligibilityRuleTemplate, "id" | "createdAt" | "updatedAt"> & { actor: string };
export type OverrideRuleInput = Omit<FundEligibilityOverride, "id" | "updatedAt"> & { actor: string };
