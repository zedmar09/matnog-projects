"use client";

import { create } from "zustand";

import { createFundRegistryDummyData } from "../data/fund-source-dummy-data";
import type {
  FundFiscalProfile,
  FundFiscalProfileInput,
  FundRegistryActivity,
  FundRegistryResult,
  FundSource,
  FundSourceInput,
  FundSourceUpdate,
} from "../types/fund-source";
import {
  canDeactivateFund,
  findFiscalProfile,
  validateFiscalProfile,
  validateFundSource,
} from "../utils/fund-source-utils";

type FundSourceStore = {
  sources: FundSource[];
  profiles: FundFiscalProfile[];
  activities: FundRegistryActivity[];
  nextSequence: number;
  addFundSource: (input: FundSourceInput) => FundRegistryResult<FundSource>;
  updateFundSource: (id: string, input: FundSourceUpdate) => FundRegistryResult<FundSource>;
  setFundSourceActive: (
    id: string,
    active: boolean,
    actor: string,
    note: string,
    fiscalYear: string,
  ) => FundRegistryResult<FundSource>;
  addFiscalProfile: (input: FundFiscalProfileInput) => FundRegistryResult<FundFiscalProfile>;
  updateFiscalProfile: (id: string, input: FundFiscalProfileInput) => FundRegistryResult<FundFiscalProfile>;
  getFundSourceById: (id: string) => FundSource | undefined;
};

const seed = createFundRegistryDummyData();
const TODAY = "2026-09-23";

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.keys(errors).length > 0;
}

function activity(id: string, fundSourceId: string, action: string, actor: string, note: string): FundRegistryActivity {
  return { id, fundSourceId, date: TODAY, action, actor, note };
}

export const useFundSourceStore = create<FundSourceStore>((set, get) => ({
  ...seed,
  nextSequence: seed.sources.length + 1,
  addFundSource: (input) => {
    const errors = validateFundSource(input, get().sources);
    if (hasErrors(errors)) return { ok: false, message: "Correct the highlighted fund details.", fieldErrors: errors };
    const sequence = get().nextSequence;
    const source: FundSource = {
      ...input,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      barangay: input.ownership === "Barangay" ? input.barangay : null,
      id: `fund-session-${sequence}`,
      createdAt: TODAY,
      updatedAt: TODAY,
    };
    const nextActivity = activity(
      `fund-activity-session-${sequence}-1`,
      source.id,
      "Fund source registered",
      input.actor,
      "Fund identity and governance details added to the registry.",
    );
    set((state) => ({
      sources: [source, ...state.sources],
      activities: [nextActivity, ...state.activities],
      nextSequence: sequence + 1,
    }));
    return { ok: true, value: source };
  },
  updateFundSource: (id, input) => {
    const current = get().sources.find((source) => source.id === id);
    if (!current) return { ok: false, message: "Fund source was not found." };
    const errors = validateFundSource(input, get().sources, id);
    if (hasErrors(errors)) return { ok: false, message: "Correct the highlighted fund details.", fieldErrors: errors };
    const updated: FundSource = {
      ...current,
      ...input,
      name: input.name.trim(),
      barangay: input.ownership === "Barangay" ? input.barangay : null,
      id: current.id,
      code: current.code,
      active: current.active,
      updatedAt: TODAY,
    };
    const nextActivity = activity(
      `fund-activity-session-${id}-${get().activities.length + 1}`,
      id,
      "Fund source details updated",
      input.actor,
      "Governance, purpose, or administration details were revised.",
    );
    set((state) => ({
      sources: state.sources.map((source) => (source.id === id ? updated : source)),
      activities: [nextActivity, ...state.activities],
    }));
    return { ok: true, value: updated };
  },
  setFundSourceActive: (id, active, actorName, note, fiscalYear) => {
    const current = get().sources.find((source) => source.id === id);
    if (!current) return { ok: false, message: "Fund source was not found." };
    if (!actorName.trim() || actorName === "Unassigned")
      return {
        ok: false,
        message: "Select the officer recording this status change.",
        fieldErrors: { actor: "Recorded by is required." },
      };
    if (!note.trim())
      return {
        ok: false,
        message: "Document the reason for this status change.",
        fieldErrors: { note: "Status-change note is required." },
      };
    if (!active) {
      const safeguard = canDeactivateFund(findFiscalProfile(get().profiles, id, fiscalYear));
      if (!safeguard.allowed) return { ok: false, message: safeguard.message };
    }
    const updated = { ...current, active, updatedAt: TODAY };
    const nextActivity = activity(
      `fund-activity-session-${id}-${get().activities.length + 1}`,
      id,
      active ? "Fund source activated" : "Fund source deactivated",
      actorName,
      note.trim(),
    );
    set((state) => ({
      sources: state.sources.map((source) => (source.id === id ? updated : source)),
      activities: [nextActivity, ...state.activities],
    }));
    return { ok: true, value: updated };
  },
  addFiscalProfile: (input) => {
    if (!get().sources.some((source) => source.id === input.fundSourceId))
      return { ok: false, message: "Fund source was not found." };
    if (findFiscalProfile(get().profiles, input.fundSourceId, input.fiscalYear))
      return {
        ok: false,
        message: "A fiscal profile already exists for this year.",
        fieldErrors: { fiscalYear: "Select a year without an existing profile." },
      };
    const errors = validateFiscalProfile(input);
    if (hasErrors(errors))
      return { ok: false, message: "Correct the highlighted financial amounts.", fieldErrors: errors };
    const profile: FundFiscalProfile = {
      ...input,
      id: `profile-${input.fundSourceId}-${input.fiscalYear}`,
      updatedAt: TODAY,
    };
    const nextActivity = activity(
      `fund-activity-session-${profile.id}`,
      input.fundSourceId,
      "Fiscal profile added",
      input.actor,
      `FY ${input.fiscalYear} appropriation and balances recorded.`,
    );
    set((state) => ({ profiles: [profile, ...state.profiles], activities: [nextActivity, ...state.activities] }));
    return { ok: true, value: profile };
  },
  updateFiscalProfile: (id, input) => {
    const current = get().profiles.find((profile) => profile.id === id);
    if (!current) return { ok: false, message: "Fiscal profile was not found." };
    const duplicate = get().profiles.some(
      (profile) =>
        profile.id !== id && profile.fundSourceId === input.fundSourceId && profile.fiscalYear === input.fiscalYear,
    );
    if (duplicate)
      return {
        ok: false,
        message: "A fiscal profile already exists for this year.",
        fieldErrors: { fiscalYear: "Select a unique fiscal year." },
      };
    const errors = validateFiscalProfile(input);
    if (hasErrors(errors))
      return { ok: false, message: "Correct the highlighted financial amounts.", fieldErrors: errors };
    const updated: FundFiscalProfile = {
      ...current,
      ...input,
      id: current.id,
      fundSourceId: current.fundSourceId,
      updatedAt: TODAY,
    };
    const nextActivity = activity(
      `fund-activity-session-${id}-${get().activities.length + 1}`,
      current.fundSourceId,
      "Fiscal profile updated",
      input.actor,
      `FY ${input.fiscalYear} financial balances were updated.`,
    );
    set((state) => ({
      profiles: state.profiles.map((profile) => (profile.id === id ? updated : profile)),
      activities: [nextActivity, ...state.activities],
    }));
    return { ok: true, value: updated };
  },
  getFundSourceById: (id) => get().sources.find((source) => source.id === id),
}));
