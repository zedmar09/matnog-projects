import type {
  FundFiscalProfile,
  FundFiscalProfileInput,
  FundRegistryFieldErrors,
  FundSource,
  FundSourceInput,
  FundSourceUpdate,
} from "../types/fund-source";

export function getAvailableBalance(profile?: FundFiscalProfile) {
  return profile ? profile.appropriation - profile.commitments - profile.obligations : 0;
}

export function getUndisbursedObligations(profile?: FundFiscalProfile) {
  return profile ? Math.max(0, profile.obligations - profile.disbursements) : 0;
}

export function getFundUtilization(profile?: FundFiscalProfile) {
  return profile && profile.appropriation > 0 ? (profile.obligations / profile.appropriation) * 100 : 0;
}

export function findFiscalProfile(profiles: FundFiscalProfile[], fundSourceId: string, fiscalYear: string) {
  return profiles.find((profile) => profile.fundSourceId === fundSourceId && profile.fiscalYear === fiscalYear);
}

export function formatFundCurrency(amount: number) {
  if (amount >= 1_000_000_000) return `₱${Number((amount / 1_000_000_000).toFixed(1))}B`;
  if (amount >= 1_000_000) {
    const scaled = amount / 1_000_000;
    return `₱${Number(scaled.toFixed(scaled >= 10 ? 1 : 2))}M`;
  }
  if (amount >= 1_000) return `₱${Number((amount / 1_000).toFixed(1))}K`;
  return `₱${Math.round(amount)}`;
}

export function validateFundSource(
  input: FundSourceInput | FundSourceUpdate,
  existingSources: FundSource[],
  currentId?: string,
): FundRegistryFieldErrors {
  const errors: FundRegistryFieldErrors = {};
  if ("code" in input) {
    const code = input.code.trim();
    if (!code) errors.code = "Fund code is required.";
    else if (
      existingSources.some((source) => source.id !== currentId && source.code.toLowerCase() === code.toLowerCase())
    ) {
      errors.code = "This fund code is already in use.";
    }
  }
  if (!input.name.trim()) errors.name = "Fund name is required.";
  if (!input.managingOffice.trim()) errors.managingOffice = "Managing office is required.";
  if (!input.legalBasis.trim()) errors.legalBasis = "Legal basis is required.";
  if (!input.purpose.trim()) errors.purpose = "Fund purpose is required.";
  if (!input.restrictions.trim()) errors.restrictions = "Document the spending restrictions.";
  if (!input.actor.trim() || input.actor === "Unassigned") errors.actor = "Select the officer recording this change.";
  if (input.ownership === "Barangay" && !input.barangay) errors.barangay = "Select the owning barangay.";
  return errors;
}

export function validateFiscalProfile(input: FundFiscalProfileInput): FundRegistryFieldErrors {
  const errors: FundRegistryFieldErrors = {};
  if (!input.fiscalYear.trim()) errors.fiscalYear = "Fiscal year is required.";
  for (const key of ["appropriation", "commitments", "obligations", "disbursements"] as const) {
    if (!Number.isFinite(input[key]) || input[key] < 0) errors[key] = "Enter a zero or positive amount.";
  }
  if (input.commitments + input.obligations > input.appropriation) {
    errors.commitments = "Commitments and obligations cannot exceed the appropriation.";
  }
  if (input.disbursements > input.obligations) errors.disbursements = "Disbursements cannot exceed obligations.";
  if (!input.actor.trim() || input.actor === "Unassigned") errors.actor = "Select the officer recording this change.";
  return errors;
}

export function canDeactivateFund(profile?: FundFiscalProfile) {
  if (!profile) return { allowed: true, message: "" };
  const undisbursed = getUndisbursedObligations(profile);
  if (profile.commitments > 0 || undisbursed > 0) {
    return {
      allowed: false,
      message: `Clear ${formatFundCurrency(profile.commitments)} in commitments and ${formatFundCurrency(undisbursed)} in undisbursed obligations first.`,
    };
  }
  return { allowed: true, message: "" };
}
