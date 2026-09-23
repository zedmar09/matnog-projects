import { Save, X } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { FundRegistryFieldErrors } from "../types/fund-source";
import styles from "../views/fund-source-registry.module.css";
import { REGISTRY_ACTORS } from "./fund-source-form";

export type FiscalDraft = {
  fiscalYear: string;
  appropriation: number;
  commitments: number;
  obligations: number;
  disbursements: number;
  actor: string;
};

export function FiscalProfileForm({
  draft,
  errors,
  creating,
  onChange,
  onSave,
  onCancel,
}: {
  draft: FiscalDraft;
  errors: FundRegistryFieldErrors;
  creating: boolean;
  onChange: (changes: Partial<FiscalDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className={styles.fiscalForm}>
      <div className={styles.sectionHeading}>
        <div>
          <strong>{creating ? "Add fiscal profile" : "Edit fiscal profile"}</strong>
          <span>Amounts in Philippine pesos</span>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close fiscal profile form">
          <X size={14} />
        </button>
      </div>
      <div className={styles.financialFormGrid}>
        <label>
          <span>Fiscal year</span>
          <input
            value={draft.fiscalYear}
            disabled={!creating}
            inputMode="numeric"
            onChange={(event) => onChange({ fiscalYear: event.target.value })}
          />
          {errors.fiscalYear ? <small>{errors.fiscalYear}</small> : null}
        </label>
        {(["appropriation", "commitments", "obligations", "disbursements"] as const).map((key) => (
          <label key={key}>
            <span>{key[0].toUpperCase() + key.slice(1)}</span>
            <input
              type="number"
              min="0"
              value={draft[key]}
              onChange={(event) => onChange({ [key]: Number(event.target.value) })}
            />
            {errors[key] ? <small>{errors[key]}</small> : null}
          </label>
        ))}
        <div>
          <span>Recorded by</span>
          <Select value={draft.actor} onValueChange={(actor) => onChange({ actor })}>
            <SelectTrigger className={styles.formSelect} aria-label="Fiscal profile recorded by">
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
          {errors.actor ? <small>{errors.actor}</small> : null}
        </div>
      </div>
      <button className={styles.primaryButton} type="button" onClick={onSave}>
        <Save size={13} /> Save fiscal profile
      </button>
    </section>
  );
}
