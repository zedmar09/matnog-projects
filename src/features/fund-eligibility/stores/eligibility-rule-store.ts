"use client";
import { create } from "zustand";
import {
  ELIGIBILITY_ACTIVITIES,
  ELIGIBILITY_OVERRIDES,
  ELIGIBILITY_TEMPLATES,
} from "../data/eligibility-rule-dummy-data";
import type {
  EligibilityActivity,
  EligibilityMutationResult,
  EligibilityRuleTemplate,
  FundEligibilityOverride,
  OverrideRuleInput,
  TemplateRuleInput,
} from "../types/eligibility-rule";
import { validateOverride, validateTemplate } from "../utils/rule-engine";

type State = {
  templates: EligibilityRuleTemplate[];
  overrides: FundEligibilityOverride[];
  activities: EligibilityActivity[];
  nextSequence: number;
  addTemplate: (input: TemplateRuleInput) => EligibilityMutationResult<EligibilityRuleTemplate>;
  updateTemplate: (id: string, input: TemplateRuleInput) => EligibilityMutationResult<EligibilityRuleTemplate>;
  addOverride: (input: OverrideRuleInput) => EligibilityMutationResult<FundEligibilityOverride>;
  updateOverride: (id: string, input: OverrideRuleInput) => EligibilityMutationResult<FundEligibilityOverride>;
  toggleRule: (
    kind: "template" | "override",
    id: string,
    actor: string,
  ) => EligibilityMutationResult<EligibilityRuleTemplate | FundEligibilityOverride>;
};
const TODAY = "2026-09-23";
const hasErrors = (errors: Record<string, string | undefined>) => Object.keys(errors).length > 0;
export const useEligibilityRuleStore = create<State>((set, get) => ({
  templates: ELIGIBILITY_TEMPLATES,
  overrides: ELIGIBILITY_OVERRIDES,
  activities: ELIGIBILITY_ACTIVITIES,
  nextSequence: 100,
  addTemplate: (input) => {
    const errors = validateTemplate(input, get().templates);
    if (hasErrors(errors)) return { ok: false, message: "Correct the highlighted rule details.", fieldErrors: errors };
    const n = get().nextSequence;
    const value = {
      ...input,
      id: `rule-session-${n}`,
      code: input.code.trim().toUpperCase(),
      createdAt: TODAY,
      updatedAt: TODAY,
    };
    const activity = {
      id: `elig-activity-session-${n}`,
      ruleId: value.id,
      date: TODAY,
      action: "Template rule created",
      actor: input.actor,
      note: value.name,
    };
    set((s) => ({ templates: [value, ...s.templates], activities: [activity, ...s.activities], nextSequence: n + 1 }));
    return { ok: true, value };
  },
  updateTemplate: (id, input) => {
    const current = get().templates.find((x) => x.id === id);
    if (!current) return { ok: false, message: "Rule was not found." };
    const errors = validateTemplate(input, get().templates, id);
    if (hasErrors(errors)) return { ok: false, message: "Correct the highlighted rule details.", fieldErrors: errors };
    const value = { ...current, ...input, id, code: current.code, createdAt: current.createdAt, updatedAt: TODAY };
    const activity = {
      id: `elig-activity-session-${id}-${get().activities.length}`,
      ruleId: id,
      date: TODAY,
      action: "Template rule updated",
      actor: input.actor,
      note: value.name,
    };
    set((s) => ({
      templates: s.templates.map((x) => (x.id === id ? value : x)),
      activities: [activity, ...s.activities],
    }));
    return { ok: true, value };
  },
  addOverride: (input) => {
    const errors = validateOverride(input, get().overrides);
    if (hasErrors(errors))
      return { ok: false, message: "Correct the highlighted override details.", fieldErrors: errors };
    const n = get().nextSequence;
    const value = { ...input, id: `override-session-${n}`, code: input.code.trim().toUpperCase(), updatedAt: TODAY };
    const activity = {
      id: `elig-override-activity-session-${n}`,
      ruleId: value.id,
      date: TODAY,
      action: `${value.mode} override created`,
      actor: input.actor,
      note: value.name || value.code,
    };
    set((s) => ({ overrides: [value, ...s.overrides], activities: [activity, ...s.activities], nextSequence: n + 1 }));
    return { ok: true, value };
  },
  updateOverride: (id, input) => {
    const current = get().overrides.find((x) => x.id === id);
    if (!current) return { ok: false, message: "Override was not found." };
    const errors = validateOverride(input, get().overrides, id);
    if (hasErrors(errors))
      return { ok: false, message: "Correct the highlighted override details.", fieldErrors: errors };
    const value = { ...current, ...input, id, code: current.code, updatedAt: TODAY };
    const activity = {
      id: `elig-override-activity-session-${id}-${get().activities.length}`,
      ruleId: id,
      date: TODAY,
      action: "Override updated",
      actor: input.actor,
      note: value.name || value.code,
    };
    set((s) => ({
      overrides: s.overrides.map((x) => (x.id === id ? value : x)),
      activities: [activity, ...s.activities],
    }));
    return { ok: true, value };
  },
  toggleRule: (kind, id, actor) => {
    if (!actor || actor === "Unassigned") return { ok: false, message: "Select the office recording this change." };
    const collection = kind === "template" ? get().templates : get().overrides;
    const current = collection.find((x) => x.id === id);
    if (!current) return { ok: false, message: "Rule was not found." };
    const value = { ...current, active: !current.active, updatedAt: TODAY };
    const activity = {
      id: `elig-toggle-${id}-${get().activities.length}`,
      ruleId: id,
      date: TODAY,
      action: value.active ? "Rule activated" : "Rule deactivated",
      actor,
      note: value.code,
    };
    if (kind === "template")
      set((s) => ({
        templates: s.templates.map((x) => (x.id === id ? (value as EligibilityRuleTemplate) : x)),
        activities: [activity, ...s.activities],
      }));
    else
      set((s) => ({
        overrides: s.overrides.map((x) => (x.id === id ? (value as FundEligibilityOverride) : x)),
        activities: [activity, ...s.activities],
      }));
    return { ok: true, value };
  },
}));
