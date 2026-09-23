export type FundCategory =
  | "General Fund"
  | "Development Fund"
  | "DRRM Fund"
  | "GAD"
  | "SK"
  | "Sectoral Appropriation"
  | "Special Education Fund"
  | "Trust Fund"
  | "External Grant"
  | "Loan";

export type FundOwnership = "Municipal" | "Barangay";

export type FundSource = {
  id: string;
  code: string;
  name: string;
  category: FundCategory;
  ownership: FundOwnership;
  barangay: string | null;
  managingOffice: string;
  legalBasis: string;
  purpose: string;
  restrictions: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FundFiscalProfile = {
  id: string;
  fundSourceId: string;
  fiscalYear: string;
  appropriation: number;
  commitments: number;
  obligations: number;
  disbursements: number;
  updatedAt: string;
};

export type FundRegistryActivity = {
  id: string;
  fundSourceId: string;
  date: string;
  action: string;
  actor: string;
  note: string;
};

export type FundSourceInput = Omit<FundSource, "id" | "createdAt" | "updatedAt"> & {
  actor: string;
};

export type FundSourceUpdate = Omit<FundSourceInput, "code" | "active">;

export type FundFiscalProfileInput = Omit<FundFiscalProfile, "id" | "updatedAt"> & {
  actor: string;
};

export type FundRegistryFieldErrors = Partial<Record<string, string>>;

export type FundRegistryResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; fieldErrors?: FundRegistryFieldErrors };
