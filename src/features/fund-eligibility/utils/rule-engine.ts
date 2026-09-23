import type { FundSource } from "@/features/funding-registry/types/fund-source";
import type { Project } from "@/features/project-registry/types/project";

import { OPERATORS_BY_CONDITION } from "../constants/rule-options";
import type {
  EffectiveEligibilityRule,
  EligibilityFieldErrors,
  EligibilityRuleResult,
  EligibilityRuleTemplate,
  FundEligibilityEvaluation,
  FundEligibilityOverride,
  OverrideRuleInput,
  TemplateRuleInput,
} from "../types/eligibility-rule";

export function validateTemplate(
  input: TemplateRuleInput,
  templates: EligibilityRuleTemplate[],
  currentId?: string,
): EligibilityFieldErrors {
  const errors: EligibilityFieldErrors = {};
  if (!input.code.trim()) errors.code = "Rule code is required.";
  else if (
    templates.some((item) => item.id !== currentId && item.code.toLowerCase() === input.code.trim().toLowerCase())
  )
    errors.code = "Rule code is already in use.";
  if (!input.name.trim()) errors.name = "Rule name is required.";
  if (!input.description.trim()) errors.description = "Explain what the rule controls.";
  if (!input.legalBasis.trim()) errors.legalBasis = "Legal basis is required.";
  if (!Number.isInteger(input.priority) || input.priority < 1)
    errors.priority = "Priority must be a positive whole number.";
  if (!OPERATORS_BY_CONDITION[input.conditionType].includes(input.operator))
    errors.operator = "Choose an operator valid for this condition.";
  if (!["Is True", "Is False"].includes(input.operator) && !input.values.some((value) => value.trim()))
    errors.values = "Enter at least one comparison value.";
  if (!input.actor.trim() || input.actor === "Unassigned") errors.actor = "Select the office recording this rule.";
  const normalizedValues = [...input.values]
    .map((value) => value.toLowerCase())
    .sort()
    .join("|");
  if (
    templates.some(
      (item) =>
        item.id !== currentId &&
        item.active &&
        input.active &&
        item.fundCategory === input.fundCategory &&
        item.priority === input.priority &&
        item.conditionType === input.conditionType &&
        item.operator === input.operator &&
        [...item.values]
          .map((value) => value.toLowerCase())
          .sort()
          .join("|") === normalizedValues &&
        item.effect !== input.effect,
    )
  )
    errors.priority = "An opposing rule already uses this condition and priority.";
  return errors;
}

export function validateOverride(
  input: OverrideRuleInput,
  overrides: FundEligibilityOverride[],
  currentId?: string,
): EligibilityFieldErrors {
  const errors: EligibilityFieldErrors = {};
  if (!input.code.trim()) errors.code = "Override code is required.";
  else if (
    overrides.some((item) => item.id !== currentId && item.code.toLowerCase() === input.code.trim().toLowerCase())
  )
    errors.code = "Override code is already in use.";
  if (!input.fundSourceId) errors.fundSourceId = "Select a fund source.";
  if ((input.mode === "Replace" || input.mode === "Disable") && !input.templateRuleId)
    errors.templateRuleId = "Select the inherited rule to override.";
  if (input.mode !== "Disable") {
    if (!input.name.trim()) errors.name = "Override name is required.";
    if (!input.conditionType || !input.operator) errors.conditionType = "Complete the override condition.";
    if (input.conditionType && input.operator && !OPERATORS_BY_CONDITION[input.conditionType].includes(input.operator))
      errors.operator = "Choose a valid operator.";
    if (
      input.operator &&
      !["Is True", "Is False"].includes(input.operator) &&
      !input.values.some((value) => value.trim())
    )
      errors.values = "Enter at least one comparison value.";
    if (!input.effect) errors.effect = "Select a rule effect.";
  }
  if (!input.actor.trim() || input.actor === "Unassigned") errors.actor = "Select the office recording this override.";
  if (input.mode === "Add" && input.conditionType && input.operator && input.effect) {
    const normalizedValues = [...input.values]
      .map((value) => value.toLowerCase())
      .sort()
      .join("|");
    if (
      overrides.some(
        (item) =>
          item.id !== currentId &&
          item.active &&
          input.active &&
          item.mode === "Add" &&
          item.fundSourceId === input.fundSourceId &&
          item.priority === input.priority &&
          item.conditionType === input.conditionType &&
          item.operator === input.operator &&
          [...item.values]
            .map((value) => value.toLowerCase())
            .sort()
            .join("|") === normalizedValues &&
          item.effect !== input.effect,
      )
    )
      errors.priority = "An opposing fund override already uses this condition and priority.";
  }
  if ((input.mode === "Replace" || input.mode === "Disable") && input.templateRuleId) {
    if (
      overrides.some(
        (item) =>
          item.id !== currentId &&
          item.active &&
          input.active &&
          item.fundSourceId === input.fundSourceId &&
          item.templateRuleId === input.templateRuleId &&
          (item.mode === "Replace" || item.mode === "Disable"),
      )
    )
      errors.templateRuleId = "This inherited rule already has an active override for the fund.";
  }
  return errors;
}

export function composeEffectiveRules(
  fund: FundSource,
  templates: EligibilityRuleTemplate[],
  overrides: FundEligibilityOverride[],
): EffectiveEligibilityRule[] {
  const applicable = templates.filter((rule) => rule.active && rule.fundCategory === fund.category);
  const fundOverrides = overrides.filter((item) => item.active && item.fundSourceId === fund.id);
  const byTemplate = new Map(
    fundOverrides.filter((item) => item.templateRuleId).map((item) => [item.templateRuleId, item]),
  );
  const inherited = applicable.flatMap((rule): EffectiveEligibilityRule[] => {
    const override = byTemplate.get(rule.id);
    if (override?.mode === "Disable") return [];
    if (override?.mode === "Replace" && override.conditionType && override.operator && override.effect)
      return [
        {
          id: override.id,
          code: override.code,
          name: override.name,
          description: override.description,
          conditionType: override.conditionType,
          operator: override.operator,
          values: override.values,
          effect: override.effect,
          priority: override.priority,
          origin: "Override",
          sourceId: override.id,
          legalBasis: override.legalBasis,
        },
      ];
    return [
      {
        id: rule.id,
        code: rule.code,
        name: rule.name,
        description: rule.description,
        conditionType: rule.conditionType,
        operator: rule.operator,
        values: rule.values,
        effect: rule.effect,
        priority: rule.priority,
        origin: "Inherited",
        sourceId: rule.id,
        legalBasis: rule.legalBasis,
      },
    ];
  });
  const added = fundOverrides.flatMap((item): EffectiveEligibilityRule[] =>
    item.mode === "Add" && item.conditionType && item.operator && item.effect
      ? [
          {
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description,
            conditionType: item.conditionType,
            operator: item.operator,
            values: item.values,
            effect: item.effect,
            priority: item.priority,
            origin: "Override",
            sourceId: item.id,
            legalBasis: item.legalBasis,
          },
        ]
      : [],
  );
  return [...inherited, ...added].toSorted((a, b) => a.priority - b.priority || a.code.localeCompare(b.code));
}

function actualValue(project: Project, rule: EffectiveEligibilityRule): string | boolean | number | string[] {
  switch (rule.conditionType) {
    case "Project Type":
      return project.projectType;
    case "Jurisdiction":
      return project.barangay ?? "Municipality-wide";
    case "Plan Linkage":
      return project.planReferences;
    case "Project Tag":
      return project.tags;
    case "Emergency":
      return project.emergency;
    case "Requesting Office":
      return project.requestingOffice;
    case "Proposed Budget":
      return project.budget;
  }
}

function matches(actual: string | boolean | number | string[], rule: EffectiveEligibilityRule) {
  const expected = rule.values.map((value) => value.toLowerCase());
  if (rule.operator === "Is True") return actual === true;
  if (rule.operator === "Is False") return actual === false;
  if (rule.operator === "Less Than or Equal") return Number(actual) <= Number(rule.values[0]);
  if (rule.operator === "Greater Than or Equal") return Number(actual) >= Number(rule.values[0]);
  if (rule.operator === "Between")
    return Number(actual) >= Number(rule.values[0]) && Number(actual) <= Number(rule.values[1]);
  const actualValues = Array.isArray(actual)
    ? actual.map((value) => value.toLowerCase())
    : [String(actual).toLowerCase()];
  if (rule.operator === "Is Any Of" || rule.operator === "Contains Any")
    return expected.some((value) => actualValues.some((item) => item.includes(value)));
  if (rule.operator === "Is None Of")
    return expected.every((value) => actualValues.every((item) => !item.includes(value)));
  return expected.every((value) => actualValues.some((item) => item.includes(value)));
}

export function evaluateEligibility(
  project: Project,
  fund: FundSource,
  rules: EffectiveEligibilityRule[],
): FundEligibilityEvaluation {
  const ruleResults: EligibilityRuleResult[] = rules.map((rule) => {
    const actual = actualValue(project, rule);
    const matched = matches(actual, rule);
    const status = matched
      ? rule.effect === "Block"
        ? "Failed"
        : rule.effect === "Require Validation"
          ? "Needs Validation"
          : "Passed"
      : "Passed";
    return {
      rule,
      matched,
      status,
      explanation: `${rule.conditionType}: ${Array.isArray(actual) ? actual.join(", ") : String(actual)} ${matched ? "matches" : "does not match"} ${rule.operator.toLowerCase()} ${rule.values.join(" / ") || rule.operator}.`,
    };
  });
  const matched = ruleResults.filter((item) => item.matched);
  const result = matched.some((item) => item.rule.effect === "Block")
    ? "Ineligible"
    : matched.some((item) => item.rule.effect === "Require Validation")
      ? "Needs Validation"
      : matched.some((item) => item.rule.effect === "Allow")
        ? "Eligible"
        : "Needs Validation";
  return { projectId: project.id, fundSourceId: fund.id, result, evaluatedAt: "2026-09-23", ruleResults };
}

export function findRuleConflicts(templates: EligibilityRuleTemplate[]) {
  const conflicts = new Set<string>();
  templates.forEach((rule, index) => {
    templates.slice(index + 1).forEach((other) => {
      if (
        rule.active &&
        other.active &&
        rule.fundCategory === other.fundCategory &&
        rule.priority === other.priority &&
        rule.conditionType === other.conditionType &&
        rule.operator === other.operator &&
        [...rule.values].sort().join("|").toLowerCase() === [...other.values].sort().join("|").toLowerCase() &&
        rule.effect !== other.effect
      ) {
        conflicts.add(rule.id);
        conflicts.add(other.id);
      }
    });
  });
  return conflicts;
}
