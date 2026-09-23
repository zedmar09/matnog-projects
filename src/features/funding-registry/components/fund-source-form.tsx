import { X } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import type { FundCategory, FundOwnership, FundRegistryFieldErrors, FundSourceInput } from "../types/fund-source";
import styles from "../views/fund-source-registry.module.css";

export const FUND_CATEGORIES: FundCategory[] = [
  "General Fund",
  "Development Fund",
  "DRRM Fund",
  "GAD",
  "SK",
  "Sectoral Appropriation",
  "Special Education Fund",
  "Trust Fund",
  "External Grant",
  "Loan",
];
export const FUND_OFFICES = [
  "Municipal Budget Office",
  "Municipal Treasurer's Office",
  "Municipal Planning and Development Office",
  "Local Finance Committee",
  "Municipal DRRM Office",
  "Municipal Engineering Office",
  "Municipal Social Welfare and Development Office",
  "Local School Board",
  "GAD Focal Point System",
];
export const REGISTRY_ACTORS = [
  "Unassigned",
  "Municipal Budget Office",
  "Municipal Treasurer's Office",
  "Municipal Planning and Development Office",
  "Local Finance Committee Secretariat",
];

export type FundSourceDraft = FundSourceInput;

function FieldError({ text }: { text?: string }) {
  return text ? <small className={styles.fieldError}>{text}</small> : null;
}

export function FundSourceForm({
  draft,
  errors,
  editing,
  onChange,
  onSave,
  onCancel,
}: {
  draft: FundSourceDraft;
  errors: FundRegistryFieldErrors;
  editing: boolean;
  onChange: (changes: Partial<FundSourceDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className={styles.formPanel}>
      <header>
        <div>
          <span>{editing ? "Registry maintenance" : "New registry entry"}</span>
          <h3>{editing ? "Edit fund source" : "Add fund source"}</h3>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close fund source form">
          <X size={15} />
        </button>
      </header>
      <div className={styles.formBody}>
        <div className={styles.twoColumnFields}>
          <label>
            <span>Fund code</span>
            <input value={draft.code} disabled={editing} onChange={(event) => onChange({ code: event.target.value })} />
            <FieldError text={errors.code} />
          </label>
          <label>
            <span>Fund name</span>
            <input value={draft.name} onChange={(event) => onChange({ name: event.target.value })} />
            <FieldError text={errors.name} />
          </label>
          <div>
            <span>Category</span>
            <Select
              value={draft.category}
              onValueChange={(category) => onChange({ category: category as FundCategory })}
            >
              <SelectTrigger className={styles.formSelect} aria-label="Fund category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUND_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span>Ownership</span>
            <Select
              value={draft.ownership}
              onValueChange={(ownership) =>
                onChange({
                  ownership: ownership as FundOwnership,
                  barangay: ownership === "Municipal" ? null : draft.barangay,
                })
              }
            >
              <SelectTrigger className={styles.formSelect} aria-label="Fund ownership">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Municipal">Municipal</SelectItem>
                <SelectItem value="Barangay">Barangay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {draft.ownership === "Barangay" ? (
            <div>
              <span>Barangay</span>
              <Select value={draft.barangay ?? "unselected"} onValueChange={(barangay) => onChange({ barangay })}>
                <SelectTrigger className={styles.formSelect} aria-label="Owning barangay">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unselected">Select barangay</SelectItem>
                  {MATNOG_BARANGAYS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError text={errors.barangay} />
            </div>
          ) : null}
          <div>
            <span>Managing office</span>
            <Select
              value={draft.managingOffice || "unselected"}
              onValueChange={(managingOffice) =>
                onChange({ managingOffice: managingOffice === "unselected" ? "" : managingOffice })
              }
            >
              <SelectTrigger className={styles.formSelect} aria-label="Managing office">
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unselected">Select office</SelectItem>
                {FUND_OFFICES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError text={errors.managingOffice} />
          </div>
        </div>
        <label>
          <span>Legal basis</span>
          <input value={draft.legalBasis} onChange={(event) => onChange({ legalBasis: event.target.value })} />
          <FieldError text={errors.legalBasis} />
        </label>
        <label>
          <span>Public spending purpose</span>
          <textarea rows={3} value={draft.purpose} onChange={(event) => onChange({ purpose: event.target.value })} />
          <FieldError text={errors.purpose} />
        </label>
        <label>
          <span>Restrictions</span>
          <textarea
            rows={3}
            value={draft.restrictions}
            onChange={(event) => onChange({ restrictions: event.target.value })}
          />
          <FieldError text={errors.restrictions} />
        </label>
        <div>
          <span>Recorded by</span>
          <Select value={draft.actor} onValueChange={(actor) => onChange({ actor })}>
            <SelectTrigger className={styles.formSelect} aria-label="Fund change recorded by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGISTRY_ACTORS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError text={errors.actor} />
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onSave}>
            {editing ? "Save fund details" : "Add fund source"}
          </button>
        </div>
      </div>
    </section>
  );
}
