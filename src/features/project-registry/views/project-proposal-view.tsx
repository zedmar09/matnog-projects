"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Minus,
  Plus,
  Save,
  Send,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { FundingSource, ProjectFundingAllocation, ProjectProposalInput } from "../types/project";

import styles from "./project-proposal.module.css";

const steps = [
  "Project details",
  "Location & scope",
  "Organization & timeline",
  "Budget & funding",
  "Review & submit",
];

const PROJECT_TYPES = [
  "Road and transport",
  "Water supply",
  "Health facility",
  "Disaster resilience",
  "Coastal protection",
  "Education facility",
  "Drainage",
  "Livelihood",
  "Public building",
  "Digital service",
  "Electrification",
  "Fishery",
  "Social welfare",
  "Irrigation",
];

const PROPOSAL_SOURCES = [
  "Barangay Development Council",
  "Municipal Development Council",
  "Municipal Planning Office",
  "Sangguniang Bayan Resolution",
  "Citizen Request / Petition",
  "Department Head Proposal",
  "Disaster Risk Assessment",
  "National Government Directive",
];

const DEPARTMENTS = [
  "Municipal Engineering Office",
  "Municipal Planning & Development Office",
  "Municipal Agriculture Office",
  "Municipal Health Office",
  "Municipal Social Welfare & Development Office",
  "Municipal Disaster Risk Reduction & Management Office",
  "Municipal Budget Office",
  "Municipal Environment & Natural Resources Office",
  "Municipal Treasurer's Office",
  "General Services Office",
];

const BENEFICIARY_SECTORS = [
  "Farmers",
  "Fisherfolk",
  "Women",
  "Youth",
  "Senior Citizens",
  "Indigenous Peoples",
  "Persons with Disability",
  "Out-of-School Youth",
  "Children",
  "Solo Parents",
  "Informal Settlers",
  "General Population",
];

const PLAN_REFERENCES = [
  "Comprehensive Development Plan (CDP)",
  "Local Development Investment Program (LDIP)",
  "Annual Investment Program (AIP)",
  "Barangay Development Plan (BDP)",
  "Comprehensive Land Use Plan (CLUP)",
  "Local Climate Change Action Plan (LCCAP)",
  "Local Disaster Risk Reduction Management Plan (LDRRMP)",
  "Gender and Development (GAD) Plan",
];

const FUNDING_SOURCES: FundingSource[] = [
  "20% Development Fund",
  "General Fund",
  "Local DRRM Fund",
  "Special Education Fund",
  "Barangay Development Fund",
  "National Government Grant",
  "Provincial Assistance",
];

type ProposalData = {
  title: string;
  description: string;
  problemStatement: string;
  expectedOutcome: string;
  projectType: string;
  tags: string[];
  emergency: boolean;
  barangay: string;
  location: string;
  beneficiaries: string;
  beneficiarySectors: string[];
  proposalSource: string;
  implementingDepartment: string;
  requestingOffice: string;
  leadOfficer: string;
  fiscalYear: string;
  multiYear: boolean;
  planReferences: string[];
  targetStart: string;
  targetCompletion: string;
  funding: { source: FundingSource; amount: string }[];
};

function makeInitial(fiscalYear: string): ProposalData {
  return {
    title: "",
    description: "",
    problemStatement: "",
    expectedOutcome: "",
    projectType: "",
    tags: [],
    emergency: false,
    barangay: "",
    location: "",
    beneficiaries: "",
    beneficiarySectors: [],
    proposalSource: "",
    implementingDepartment: "",
    requestingOffice: "",
    leadOfficer: "",
    fiscalYear,
    multiYear: false,
    planReferences: [],
    targetStart: "",
    targetCompletion: "",
    funding: [{ source: "20% Development Fund", amount: "" }],
  };
}

function RequiredMark() {
  return <span style={{ color: "#dc2626", fontWeight: 700 }}> *</span>;
}

function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  children,
  help,
  className = "",
}: {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
  help?: string;
  className?: string;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable field
    <label className={`${styles.field} ${className}`}>
      <span>
        {label}
        {required && <RequiredMark />}
      </span>
      {children ?? (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
      {help && <small>{help}</small>}
    </label>
  );
}

function TextareaField({
  label,
  required,
  value,
  onChange,
  placeholder,
  help,
  className = "",
  rows = 3,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  className?: string;
  rows?: number;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable field
    <label className={`${styles.field} ${className}`}>
      <span>
        {label}
        {required && <RequiredMark />}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        required={required}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
      {help && <small>{help}</small>}
    </label>
  );
}

function ShadcnSelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Select",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} required={required} className={className}>
      <Select value={value} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{placeholder}</SelectItem>
          {options.map((v) => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function TagsInput({
  label,
  tags,
  onChange,
  placeholder,
  help,
  className = "",
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  help?: string;
  className?: string;
}) {
  const [input, setInput] = useState("");
  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput("");
  };
  return (
    <div className={`${styles.field} ${className}`}>
      <span>{label}</span>
      <div className={styles.tagsWrap}>
        {tags.map((t) => (
          <span key={t} className={styles.tag}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}>×</button>
          </span>
        ))}
        <input
          value={input}
          placeholder={tags.length === 0 ? placeholder : ""}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
            if (e.key === "Backspace" && input === "" && tags.length) onChange(tags.slice(0, -1));
          }}
          onBlur={() => add(input)}
        />
      </div>
      {help && <small className={styles.field}>{help}</small>}
    </div>
  );
}

export function ProjectProposalView() {
  const router = useRouter();
  const fiscalYear = useShellStore((s) => s.fiscalYear);
  const addProposal = useProjectRegistryStore((s) => s.addProposal);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProposalData>(() => makeInitial(fiscalYear));
  const [error, setError] = useState("");

  const set = <K extends keyof ProposalData>(key: K, value: ProposalData[K]) =>
    setData((c) => ({ ...c, [key]: value }));

  const totalBudget = data.funding.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const validation = useMemo(() => {
    const missing: string[] = [];
    if (!data.title.trim()) missing.push("project title");
    if (!data.description.trim()) missing.push("description");
    if (!data.problemStatement.trim()) missing.push("problem statement");
    if (!data.expectedOutcome.trim()) missing.push("expected outcome");
    if (!data.projectType) missing.push("project type");
    if (!data.barangay) missing.push("barangay / scope");
    if (!data.location.trim()) missing.push("specific location");
    if (!data.beneficiaries || Number(data.beneficiaries) <= 0) missing.push("number of beneficiaries");
    if (data.beneficiarySectors.length === 0) missing.push("beneficiary sector(s)");
    if (!data.proposalSource) missing.push("proposal source");
    if (!data.implementingDepartment) missing.push("implementing department");
    if (!data.requestingOffice.trim()) missing.push("requesting office");
    if (!data.leadOfficer.trim()) missing.push("lead officer");
    if (!data.targetStart) missing.push("target start date");
    if (!data.targetCompletion) missing.push("target completion date");
    if (totalBudget <= 0) missing.push("budget amount");
    return missing;
  }, [data, totalBudget]);

  const stepForField = (field: string): number => {
    if (["project title", "description", "problem statement", "expected outcome", "project type"].includes(field)) return 0;
    if (["barangay / scope", "specific location", "number of beneficiaries", "beneficiary sector(s)"].includes(field)) return 1;
    if (["proposal source", "implementing department", "requesting office", "lead officer", "target start date", "target completion date"].includes(field)) return 2;
    if (field === "budget amount") return 3;
    return 0;
  };

  const submit = (event: FormEvent, asDraft: boolean) => {
    event.preventDefault();
    if (!asDraft && validation.length) {
      setError(`Complete the required fields: ${validation.join(", ")}.`);
      setStep(stepForField(validation[0]));
      return;
    }

    const funding: ProjectProposalInput["funding"] = data.funding
      .filter((f) => Number(f.amount) > 0)
      .map((f) => ({
        source: f.source,
        amount: Number(f.amount),
        share: totalBudget > 0 ? Math.round((Number(f.amount) / totalBudget) * 100) : 0,
        eligibility: "For validation" as const,
      }));

    const input: ProjectProposalInput = {
      title: data.title.trim(),
      description: data.description.trim(),
      problemStatement: data.problemStatement.trim(),
      expectedOutcome: data.expectedOutcome.trim(),
      projectType: data.projectType,
      proposalSource: data.proposalSource,
      implementingDepartment: data.implementingDepartment,
      requestingOffice: data.requestingOffice.trim(),
      leadOfficer: data.leadOfficer.trim(),
      barangay: data.barangay === "municipal" ? null : data.barangay,
      location: data.location.trim(),
      beneficiaries: Number(data.beneficiaries) || 0,
      beneficiarySectors: data.beneficiarySectors,
      fiscalYear: data.fiscalYear,
      multiYear: data.multiYear,
      planReferences: data.planReferences,
      funding,
      budget: totalBudget,
      targetStart: data.targetStart,
      targetCompletion: data.targetCompletion,
      tags: data.tags,
      emergency: data.emergency,
      submit: !asDraft,
    };

    const project = addProposal(input);
    router.push(`/projects/all?saved=${project.code}`);
  };

  const addFunding = () =>
    set("funding", [...data.funding, { source: "General Fund", amount: "" }]);
  const removeFunding = (index: number) =>
    set("funding", data.funding.filter((_, i) => i !== index));
  const setFunding = (index: number, key: "source" | "amount", value: string) =>
    set("funding", data.funding.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  const toggleSector = (sector: string) =>
    set(
      "beneficiarySectors",
      data.beneficiarySectors.includes(sector)
        ? data.beneficiarySectors.filter((s) => s !== sector)
        : [...data.beneficiarySectors, sector],
    );

  const togglePlan = (plan: string) =>
    set(
      "planReferences",
      data.planReferences.includes(plan)
        ? data.planReferences.filter((p) => p !== plan)
        : [...data.planReferences, plan],
    );

  const fmt = (n: number) => n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 });

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>New Project Proposal</h1>
            <p>Fill out all required fields to submit a project proposal for municipal review. Required fields are marked with *.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/projects/all">
              <ChevronLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.formCentered}>
          {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
          <form className={`${styles.card} ${styles.formCard}`} onSubmit={(e) => submit(e, false)} noValidate>
            <div className={styles.stepper}>
              {steps.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={`${styles.step} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}
                  onClick={() => setStep(index)}
                >
                  <span className={styles.stepNumber}>{index < step ? <Check size={12} /> : index + 1}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className={styles.formBody}>
              {/* Step 0: Project Details */}
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Project information</h2>
                  <p className={styles.sectionHelp}>
                    Describe the project, the problem it addresses, and the expected outcome for the community.
                  </p>
                  <div className={styles.formGrid}>
                    <Field
                      label="Project title"
                      required
                      className={styles.span3}
                      value={data.title}
                      onChange={(v) => set("title", v)}
                      placeholder="e.g. Construction of Barangay Health Station in Bolo"
                      help="Use a clear, descriptive title that identifies the project type, location, and scope."
                    />
                    <TextareaField
                      label="Project description"
                      required
                      className={styles.span3}
                      value={data.description}
                      onChange={(v) => set("description", v)}
                      placeholder="e.g. Construction of a one-storey barangay health station with two consultation rooms, a pharmacy area, a reception, and a birthing room to serve 3,200 residents of Barangay Bolo."
                      help="Provide a comprehensive description including scope of work, specifications, and deliverables."
                    />
                    <TextareaField
                      label="Problem statement"
                      required
                      className={styles.span3}
                      value={data.problemStatement}
                      onChange={(v) => set("problemStatement", v)}
                      placeholder="e.g. Barangay Bolo currently has no health facility. The nearest Rural Health Unit is 8 km away, forcing residents to travel by tricycle for basic medical consultations, prenatal check-ups, and immunizations."
                      help="What specific problem or gap does this project solve? Include data or evidence if available."
                    />
                    <TextareaField
                      label="Expected outcome"
                      required
                      className={styles.span3}
                      value={data.expectedOutcome}
                      onChange={(v) => set("expectedOutcome", v)}
                      placeholder="e.g. A fully operational health station reducing average travel time for medical care from 45 minutes to under 5 minutes for 3,200 residents, with capacity for 30 daily consultations."
                      help="What measurable results will the project deliver upon completion?"
                    />
                    <ShadcnSelectField
                      label="Project type"
                      required
                      value={data.projectType}
                      onChange={(v) => set("projectType", v)}
                      options={PROJECT_TYPES}
                      placeholder="Select project type"
                    />
                    <TagsInput
                      label="Tags / keywords"
                      className={styles.span2}
                      tags={data.tags}
                      onChange={(v) => set("tags", v)}
                      placeholder="Type and press Enter to add tags (e.g. infrastructure, health, priority)"
                      help="Optional. Helps categorize and search for this project later."
                    />
                    <label className={`${styles.checkboxField} ${styles.span3}`}>
                      <input type="checkbox" checked={data.emergency} onChange={(e) => set("emergency", e.target.checked)} />
                      This is an emergency or urgent project (disaster response, calamity recovery, public safety)
                    </label>
                  </div>
                </>
              )}

              {/* Step 1: Location & Scope */}
              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Location and beneficiary scope</h2>
                  <p className={styles.sectionHelp}>
                    Specify where the project will be implemented and who it will serve.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Barangay / scope" required>
                      <Select
                        value={data.barangay}
                        onValueChange={(v) => set("barangay", v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger aria-label="Barangay">
                          <SelectValue placeholder="Select barangay or municipality-wide" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select barangay or scope</SelectItem>
                          <SelectItem value="municipal">Municipality-wide</SelectItem>
                          {MATNOG_BARANGAYS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      label="Specific location / site"
                      required
                      className={styles.span2}
                      value={data.location}
                      onChange={(v) => set("location", v)}
                      placeholder="e.g. Purok 3, along National Highway, beside Barangay Hall"
                      help="Provide the exact site address or description for the project location."
                    />
                    <Field
                      label="Number of direct beneficiaries"
                      required
                      type="number"
                      value={data.beneficiaries}
                      onChange={(v) => set("beneficiaries", v)}
                      placeholder="e.g. 3200"
                      help="Estimated number of people who will directly benefit from this project."
                    />
                    <div className={`${styles.field} ${styles.span2}`}>
                      <span>Beneficiary sectors <RequiredMark /></span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {BENEFICIARY_SECTORS.map((sector) => (
                          <label key={sector} className={styles.checkboxField} style={{ minHeight: 28, fontSize: 11 }}>
                            <input
                              type="checkbox"
                              checked={data.beneficiarySectors.includes(sector)}
                              onChange={() => toggleSector(sector)}
                              style={{ width: 14, height: 14 }}
                            />
                            {sector}
                          </label>
                        ))}
                      </div>
                      <small style={{ color: "#849693", fontSize: 10 }}>Select all sectors that apply to this project.</small>
                    </div>
                    <div className={`${styles.infoBox} ${styles.span3}`}>
                      <Info size={20} />
                      <div>
                        <strong>Geo-tagging and site photos</strong>
                        <small>Site coordinates and photos can be uploaded after the proposal is submitted, during the readiness assessment stage.</small>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Organization & Timeline */}
              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Responsible offices and timeline</h2>
                  <p className={styles.sectionHelp}>
                    Identify the offices responsible, the source of this proposal, and the project timeline.
                  </p>
                  <div className={styles.formGrid}>
                    <ShadcnSelectField
                      label="Proposal source"
                      required
                      value={data.proposalSource}
                      onChange={(v) => set("proposalSource", v)}
                      options={PROPOSAL_SOURCES}
                      placeholder="Select where this proposal originated"
                    />
                    <ShadcnSelectField
                      label="Implementing department"
                      required
                      value={data.implementingDepartment}
                      onChange={(v) => set("implementingDepartment", v)}
                      options={DEPARTMENTS}
                      placeholder="Select responsible department"
                    />
                    <Field
                      label="Requesting office"
                      required
                      value={data.requestingOffice}
                      onChange={(v) => set("requestingOffice", v)}
                      placeholder="e.g. Barangay Council of Bolo"
                      help="The office or body formally requesting this project."
                    />
                    <Field
                      label="Lead officer / focal person"
                      required
                      value={data.leadOfficer}
                      onChange={(v) => set("leadOfficer", v)}
                      placeholder="e.g. Engr. Maria Santos"
                      help="The person responsible for overseeing this project's implementation."
                    />
                    <ShadcnSelectField
                      label="Fiscal year"
                      value={data.fiscalYear}
                      onChange={(v) => set("fiscalYear", v)}
                      options={["2024", "2025", "2026"]}
                      placeholder="Select fiscal year"
                    />
                    <label className={styles.checkboxField}>
                      <input type="checkbox" checked={data.multiYear} onChange={(e) => set("multiYear", e.target.checked)} />
                      Multi-year project (spans more than one fiscal year)
                    </label>
                    <Field
                      label="Target start date"
                      required
                      type="date"
                      value={data.targetStart}
                      onChange={(v) => set("targetStart", v)}
                    />
                    <Field
                      label="Target completion date"
                      required
                      type="date"
                      value={data.targetCompletion}
                      onChange={(v) => set("targetCompletion", v)}
                    />
                    <div className={styles.span3} />
                    <div className={`${styles.field} ${styles.span3}`}>
                      <span>Development plan references</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {PLAN_REFERENCES.map((plan) => (
                          <label key={plan} className={styles.checkboxField} style={{ minHeight: 28, fontSize: 11 }}>
                            <input
                              type="checkbox"
                              checked={data.planReferences.includes(plan)}
                              onChange={() => togglePlan(plan)}
                              style={{ width: 14, height: 14 }}
                            />
                            {plan}
                          </label>
                        ))}
                      </div>
                      <small style={{ color: "#849693", fontSize: 10 }}>
                        Select all municipal or national development plans this project aligns with.
                      </small>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Budget & Funding */}
              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Budget estimate and funding sources</h2>
                  <p className={styles.sectionHelp}>
                    Provide the estimated cost and identify the fund sources. Multiple sources can be added for blended funding.
                  </p>
                  <div className={styles.formGrid}>
                    <div className={styles.span3}>
                      {data.funding.map((f, i) => (
                        <div key={`funding-${i}`} className={styles.fundingRow} style={{ marginBottom: 10 }}>
                          <Field label={i === 0 ? "Funding source" : ""}>
                            <Select value={f.source} onValueChange={(v) => setFunding(i, "source", v)}>
                              <SelectTrigger aria-label="Funding source">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FUNDING_SOURCES.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field
                            label={i === 0 ? "Amount (PHP)" : ""}
                            type="number"
                            value={f.amount}
                            onChange={(v) => setFunding(i, "amount", v)}
                            placeholder="e.g. 2500000"
                          />
                          {data.funding.length > 1 && (
                            <button type="button" className={styles.removeButton} onClick={() => removeFunding(i)} aria-label="Remove funding source">
                              <Minus size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className={styles.addButton} onClick={addFunding}>
                        <Plus size={14} /> Add another funding source
                      </button>
                    </div>
                    <div className={`${styles.budgetTotal} ${styles.span3}`}>
                      <span>Total estimated budget</span>
                      <strong>{fmt(totalBudget)}</strong>
                    </div>
                    <div className={`${styles.infoBox} ${styles.span3}`}>
                      <Info size={20} />
                      <div>
                        <strong>Fund eligibility validation</strong>
                        <small>
                          Each funding source will be validated against eligibility rules during the technical review stage. Ensure the project type and scope align with the selected fund sources.
                        </small>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Review & Submit */}
              {step === 4 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and submit</h2>
                  <p className={styles.sectionHelp}>
                    Review all information before submitting. You can also save as draft to complete later.
                  </p>
                  <div className={styles.reviewGrid}>
                    <section className={styles.reviewCard}>
                      <h3>Project Details</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Title</dt><dd>{data.title || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Type</dt><dd>{data.projectType || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Description</dt><dd>{data.description || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Problem</dt><dd>{data.problemStatement || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Expected outcome</dt><dd>{data.expectedOutcome || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Emergency</dt><dd>{data.emergency ? "Yes" : "No"}</dd></div>
                        {data.tags.length > 0 && (
                          <div className={styles.dataRow}><dt>Tags</dt><dd>{data.tags.join(", ")}</dd></div>
                        )}
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Location & Scope</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}>
                          <dt>Barangay</dt>
                          <dd>{data.barangay === "municipal" ? "Municipality-wide" : data.barangay || "—"}</dd>
                        </div>
                        <div className={styles.dataRow}><dt>Location</dt><dd>{data.location || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Beneficiaries</dt><dd>{data.beneficiaries ? Number(data.beneficiaries).toLocaleString() : "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Sectors</dt><dd>{data.beneficiarySectors.join(", ") || "—"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Organization & Timeline</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Source</dt><dd>{data.proposalSource || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Department</dt><dd>{data.implementingDepartment || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Requesting office</dt><dd>{data.requestingOffice || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Lead officer</dt><dd>{data.leadOfficer || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Fiscal year</dt><dd>{data.fiscalYear}{data.multiYear ? " (multi-year)" : ""}</dd></div>
                        <div className={styles.dataRow}><dt>Timeline</dt><dd>{data.targetStart && data.targetCompletion ? `${data.targetStart} to ${data.targetCompletion}` : "—"}</dd></div>
                        {data.planReferences.length > 0 && (
                          <div className={styles.dataRow}><dt>Plan references</dt><dd>{data.planReferences.join(", ")}</dd></div>
                        )}
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Budget & Funding</h3>
                      <dl className={styles.dataList}>
                        {data.funding.filter((f) => Number(f.amount) > 0).map((f, i) => (
                          <div key={`rev-${i}`} className={styles.dataRow}>
                            <dt>{f.source}</dt>
                            <dd>{fmt(Number(f.amount))}</dd>
                          </div>
                        ))}
                        <div className={styles.dataRow}>
                          <dt><strong>Total budget</strong></dt>
                          <dd><strong>{fmt(totalBudget)}</strong></dd>
                        </div>
                      </dl>
                    </section>
                  </div>
                  {validation.length > 0 && (
                    <p className={styles.error} style={{ marginTop: 14, fontSize: 12 }}>
                      Required before submitting: {validation.join(", ")}.
                    </p>
                  )}
                </>
              )}
            </div>

            <footer className={styles.formFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {step === steps.length - 1 && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={(e) => submit(e, true)}
                  >
                    <Save size={14} /> Save as draft
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                  >
                    Continue <ChevronRight size={14} />
                  </button>
                ) : (
                  <button type="submit" className={styles.primaryButton}>
                    <Send size={14} /> Submit proposal
                  </button>
                )}
              </div>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
