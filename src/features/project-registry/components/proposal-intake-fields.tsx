import { AlertTriangle, Info, Landmark, MapPinned, UsersRound } from "lucide-react";
import { Controller, type FieldPath, type UseFormReturn } from "react-hook-form";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import {
  BENEFICIARY_SECTORS,
  FUNDING_SOURCES,
  IMPLEMENTING_DEPARTMENTS,
  PROJECT_TYPES,
  PROPOSAL_SOURCES,
  THEMATIC_TAGS,
} from "../constants/proposal-options";
import type { ProposalFormValues } from "../schemas/proposal-schema";
import { formatCompactCurrency } from "../utils/project-utils";
import styles from "../views/proposal-intake.module.css";

type Form = UseFormReturn<ProposalFormValues>;

function ErrorText({ message }: { message?: string }) {
  return message ? <small className={styles.fieldError}>{message}</small> : null;
}

function Field({
  label,
  required,
  error,
  hint,
  children,
  wide,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Controls are passed directly as children, including Radix Select triggers.
    <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <span>
        {label}
        {required ? <i>Required</i> : null}
      </span>
      {children}
      {error ? <ErrorText message={error} /> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

function SelectField({
  form,
  name,
  label,
  options,
  placeholder,
  required = true,
  wide,
}: {
  form: Form;
  name: FieldPath<ProposalFormValues>;
  label: string;
  options: Array<string | { value: string; label: string }>;
  placeholder: string;
  required?: boolean;
  wide?: boolean;
}) {
  const error = form.getFieldState(name, form.formState).error?.message;
  return (
    <Field label={label} required={required} error={typeof error === "string" ? error : undefined} wide={wide}>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
            <SelectTrigger className={styles.selectTrigger} aria-label={label}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => {
                const item = typeof option === "string" ? { value: option, label: option } : option;
                return (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}

function ChoiceGroup({
  label,
  options,
  values,
  error,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  error?: string;
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className={`${styles.choiceField} ${styles.fieldWide}`}>
      <legend>
        {label}
        <i>Choose one or more</i>
      </legend>
      <div className={styles.choiceGrid}>
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              type="button"
              className={selected ? styles.choiceSelected : ""}
              aria-pressed={selected}
              key={option}
              onClick={() => onToggle(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
      <ErrorText message={error} />
    </fieldset>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function ProposalSourceStep({ form }: { form: Form }) {
  return (
    <div className={styles.formGrid}>
      <SelectField
        form={form}
        name="proposalSource"
        label="Proposal source"
        options={PROPOSAL_SOURCES}
        placeholder="Choose source"
      />
      <SelectField
        form={form}
        name="fiscalYear"
        label="Fiscal year"
        options={["2026", "2027", "2028"]}
        placeholder="Choose fiscal year"
      />
      <SelectField
        form={form}
        name="implementingDepartment"
        label="Implementing office"
        options={IMPLEMENTING_DEPARTMENTS}
        placeholder="Choose responsible office"
        wide
      />
      <Field label="Requesting office or barangay" required error={form.formState.errors.requestingOffice?.message}>
        <input {...form.register("requestingOffice")} placeholder="e.g. Barangay Poblacion" />
      </Field>
      <Field label="Lead officer" required error={form.formState.errors.leadOfficer?.message}>
        <input {...form.register("leadOfficer")} placeholder="Full name and position" />
      </Field>
      <label className={`${styles.switchCard} ${styles.fieldWide}`}>
        <input type="checkbox" {...form.register("emergency")} />
        <span>
          <AlertTriangle size={17} />
          <strong>Emergency project</strong>
          <small>Flags this proposal for abbreviated routing and heightened post-hoc documentation.</small>
        </span>
      </label>
    </div>
  );
}

export function ProposalNeedStep({ form }: { form: Form }) {
  return (
    <div className={styles.formGrid}>
      <Field label="Project title" required error={form.formState.errors.title?.message} wide>
        <input {...form.register("title")} placeholder="Describe the asset, service, or intervention" />
      </Field>
      <Field label="Short description" required error={form.formState.errors.description?.message} wide>
        <textarea
          rows={3}
          {...form.register("description")}
          placeholder="Summarize what will be delivered and for whom."
        />
      </Field>
      <Field
        label="Problem statement"
        required
        error={form.formState.errors.problemStatement?.message}
        hint="State the current service gap using observable conditions."
        wide
      >
        <textarea
          rows={5}
          {...form.register("problemStatement")}
          placeholder="What problem exists, who is affected, and why does it require LGU action?"
        />
      </Field>
      <SelectField
        form={form}
        name="barangayScope"
        label="Barangay or municipal scope"
        options={[
          { value: "municipal", label: "Municipality-wide" },
          ...MATNOG_BARANGAYS.map((barangay) => ({ value: barangay, label: barangay })),
        ]}
        placeholder="Choose project scope"
      />
      <Field label="Specific location" required error={form.formState.errors.location?.message}>
        <div className={styles.inputWithIcon}>
          <MapPinned size={15} />
          <input {...form.register("location")} placeholder="Sitio, road, facility, or landmark" />
        </div>
      </Field>
      <Field label="Estimated beneficiaries" required error={form.formState.errors.beneficiaries?.message}>
        <div className={styles.inputWithIcon}>
          <UsersRound size={15} />
          <input type="number" min="1" {...form.register("beneficiaries", { valueAsNumber: true })} />
        </div>
      </Field>
      <div className={styles.scopeNote}>
        <Info size={15} />
        <p>
          Beneficiary totals are entered for this frontend prototype. A future integration can pull validated population
          counts from the resident and household registry.
        </p>
      </div>
      <Controller
        control={form.control}
        name="beneficiarySectors"
        render={({ field, fieldState }) => (
          <ChoiceGroup
            label="Beneficiary sectors"
            options={BENEFICIARY_SECTORS}
            values={field.value}
            error={fieldState.error?.message}
            onToggle={(value) => field.onChange(toggleValue(field.value, value))}
          />
        )}
      />
    </div>
  );
}

export function ProposalCostStep({ form }: { form: Form }) {
  const budget = form.watch("budget");
  return (
    <div className={styles.formGrid}>
      <Field
        label="Expected outcome"
        required
        error={form.formState.errors.expectedOutcome?.message}
        hint="Describe the change this project should produce, not the activity itself."
        wide
      >
        <textarea
          rows={4}
          {...form.register("expectedOutcome")}
          placeholder="What measurable improvement should beneficiaries experience?"
        />
      </Field>
      <SelectField
        form={form}
        name="projectType"
        label="Project type"
        options={PROJECT_TYPES}
        placeholder="Choose project type"
      />
      <Field label="Proposed cost" required error={form.formState.errors.budget?.message}>
        <div className={styles.currencyInput}>
          <span>₱</span>
          <input type="number" min="1" step="50000" {...form.register("budget", { valueAsNumber: true })} />
        </div>
        {budget > 0 ? (
          <small className={styles.derivedValue}>{formatCompactCurrency(budget)} proposed project value</small>
        ) : null}
      </Field>
      <Field label="Target start" required error={form.formState.errors.targetStart?.message}>
        <input type="date" {...form.register("targetStart")} />
      </Field>
      <Field label="Target completion" required error={form.formState.errors.targetCompletion?.message}>
        <input type="date" {...form.register("targetCompletion")} />
      </Field>
      <label className={`${styles.switchCard} ${styles.fieldWide}`}>
        <input type="checkbox" {...form.register("multiYear")} />
        <span>
          <Landmark size={17} />
          <strong>Multi-year implementation</strong>
          <small>Marks the proposal for phased annual appropriations and funding continuity review.</small>
        </span>
      </label>
    </div>
  );
}

export function ProposalFundingStep({ form }: { form: Form }) {
  const primaryShare = form.watch("primaryShare");
  return (
    <div className={styles.formGrid}>
      <section className={`${styles.subsection} ${styles.fieldWide}`}>
        <header>
          <h3>Plan hierarchy</h3>
          <p>Link the proposal to its approved planning instruments.</p>
        </header>
        <div className={styles.formGrid}>
          <Field label="CDP reference" required error={form.formState.errors.cdpReference?.message}>
            <input {...form.register("cdpReference")} placeholder="CDP-MATNOG-2023-2028" />
          </Field>
          <Field label="LDIP reference" required error={form.formState.errors.ldipReference?.message}>
            <input {...form.register("ldipReference")} placeholder="LDIP-2026-INFRA" />
          </Field>
          <Field label="AIP reference" required error={form.formState.errors.aipReference?.message} wide>
            <input {...form.register("aipReference")} placeholder="AIP-2026-001" />
          </Field>
        </div>
      </section>
      <section className={`${styles.subsection} ${styles.fieldWide}`}>
        <header>
          <h3>Proposed funding</h3>
          <p>Assign the primary fund and an optional co-funder. Eligibility is validated in later funding review.</p>
        </header>
        <div className={styles.formGrid}>
          <SelectField
            form={form}
            name="primaryFundingSource"
            label="Primary fund source"
            options={FUNDING_SOURCES}
            placeholder="Choose fund source"
          />
          <Field label="Primary share" required error={form.formState.errors.primaryShare?.message}>
            <div className={styles.percentInput}>
              <input type="number" min="1" max="100" {...form.register("primaryShare", { valueAsNumber: true })} />
              <span>%</span>
            </div>
          </Field>
          <SelectField
            form={form}
            name="secondaryFundingSource"
            label="Co-funding source"
            options={FUNDING_SOURCES}
            placeholder="No co-funder"
            required={primaryShare < 100}
            wide
          />
          {primaryShare < 100 ? (
            <div className={`${styles.fundingSplit} ${styles.fieldWide}`}>
              <span>
                Primary fund<strong>{primaryShare}%</strong>
              </span>
              <i>
                <b style={{ width: `${primaryShare}%` }} />
              </i>
              <span>
                Co-funder<strong>{100 - primaryShare}%</strong>
              </span>
            </div>
          ) : null}
        </div>
      </section>
      <Controller
        control={form.control}
        name="tags"
        render={({ field, fieldState }) => (
          <ChoiceGroup
            label="Thematic tags"
            options={THEMATIC_TAGS}
            values={field.value}
            error={fieldState.error?.message}
            onToggle={(value) => field.onChange(toggleValue(field.value, value))}
          />
        )}
      />
    </div>
  );
}
