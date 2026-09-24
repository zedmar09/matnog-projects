"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Info,
  Minus,
  Plus,
  Save,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { FundingSource, Project } from "../types/project";

import styles from "./project-proposal.module.css";

const steps = [
  "Project details",
  "Location & scope",
  "Organization & timeline",
  "Budget & funding",
  "Review & save",
];

const PROJECT_TYPES = [
  "Road and transport", "Water supply", "Health facility", "Disaster resilience",
  "Coastal protection", "Education facility", "Drainage", "Livelihood",
  "Public building", "Digital service", "Electrification", "Fishery",
  "Social welfare", "Irrigation",
];

const PROPOSAL_SOURCES = [
  "Barangay Development Council", "Municipal Development Council",
  "Municipal Planning Office", "Sangguniang Bayan Resolution",
  "Citizen Request / Petition", "Department Head Proposal",
  "Disaster Risk Assessment", "National Government Directive",
];

const DEPARTMENTS = [
  "Municipal Engineering Office", "Municipal Planning & Development Office",
  "Municipal Agriculture Office", "Municipal Health Office",
  "Municipal Social Welfare & Development Office",
  "Municipal Disaster Risk Reduction & Management Office",
  "Municipal Budget Office", "Municipal Environment & Natural Resources Office",
  "Municipal Treasurer's Office", "General Services Office",
];

const BENEFICIARY_SECTORS = [
  "Farmers", "Fisherfolk", "Women", "Youth", "Senior Citizens",
  "Indigenous Peoples", "Persons with Disability", "Out-of-School Youth",
  "Children", "Solo Parents", "Informal Settlers", "General Population",
];

const PLAN_REFERENCES = [
  "Comprehensive Development Plan (CDP)", "Local Development Investment Program (LDIP)",
  "Annual Investment Program (AIP)", "Barangay Development Plan (BDP)",
  "Comprehensive Land Use Plan (CLUP)", "Local Climate Change Action Plan (LCCAP)",
  "Local Disaster Risk Reduction Management Plan (LDRRMP)", "Gender and Development (GAD) Plan",
];

const FUNDING_SOURCES: FundingSource[] = [
  "20% Development Fund", "General Fund", "Local DRRM Fund",
  "Special Education Fund", "Barangay Development Fund",
  "National Government Grant", "Provincial Assistance",
];

type EditData = {
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

function fromProject(p: Project): EditData {
  return {
    title: p.title,
    description: p.description,
    problemStatement: p.problemStatement,
    expectedOutcome: p.expectedOutcome,
    projectType: p.projectType,
    tags: [...p.tags],
    emergency: p.emergency,
    barangay: p.barangay ?? "municipal",
    location: p.location,
    beneficiaries: String(p.beneficiaries),
    beneficiarySectors: [...p.beneficiarySectors],
    proposalSource: p.proposalSource,
    implementingDepartment: p.implementingDepartment,
    requestingOffice: p.requestingOffice,
    leadOfficer: p.leadOfficer,
    fiscalYear: p.fiscalYear,
    multiYear: p.multiYear,
    planReferences: [...p.planReferences],
    targetStart: p.targetStart,
    targetCompletion: p.targetCompletion,
    funding: p.funding.length > 0
      ? p.funding.map((f) => ({ source: f.source, amount: String(f.amount) }))
      : [{ source: "20% Development Fund" as FundingSource, amount: "" }],
  };
}

function RequiredMark() {
  return <span style={{ color: "#dc2626", fontWeight: 700 }}> *</span>;
}

function Field({
  label, required, value, onChange, type = "text", placeholder, children, help, className = "",
}: {
  label: string; required?: boolean; value?: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; children?: React.ReactNode; help?: string; className?: string;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable field
    <label className={`${styles.field} ${className}`}>
      <span>{label}{required && <RequiredMark />}</span>
      {children ?? (
        <input type={type} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange?.(e.target.value)} />
      )}
      {help && <small>{help}</small>}
    </label>
  );
}

function TextareaField({
  label, required, value, onChange, placeholder, help, className = "", rows = 3,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; help?: string; className?: string; rows?: number;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable field
    <label className={`${styles.field} ${className}`}>
      <span>{label}{required && <RequiredMark />}</span>
      <textarea value={value} placeholder={placeholder} required={required} rows={rows} onChange={(e) => onChange(e.target.value)} />
      {help && <small>{help}</small>}
    </label>
  );
}

function ShadcnSelectField({
  label, value, onChange, options, required = false, placeholder = "Select", className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
  required?: boolean; placeholder?: string; className?: string;
}) {
  return (
    <Field label={label} required={required} className={className}>
      <Select value={value} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger aria-label={label}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{placeholder}</SelectItem>
          {options.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  );
}

function TagsInput({ label, tags, onChange, placeholder, className = "" }: {
  label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string; className?: string;
}) {
  const [input, setInput] = useState("");
  const add = (value: string) => { const t = value.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setInput(""); };
  return (
    <div className={`${styles.field} ${className}`}>
      <span>{label}</span>
      <div className={styles.tagsWrap}>
        {tags.map((t) => (
          <span key={t} className={styles.tag}>
            {t}<button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}>×</button>
          </span>
        ))}
        <input
          value={input} placeholder={tags.length === 0 ? placeholder : ""}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } if (e.key === "Backspace" && input === "" && tags.length) onChange(tags.slice(0, -1)); }}
          onBlur={() => add(input)}
        />
      </div>
    </div>
  );
}

export function ProjectEditView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useProjectRegistryStore((s) => s.projects.find((p) => p.id === projectId));
  const updateProject = useProjectRegistryStore((s) => s.updateProject);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<EditData>(() => project ? fromProject(project) : fromProject({} as Project));
  const [error, setError] = useState("");

  if (!project) {
    return (
      <div className={styles.page} style={{ display: "grid", minHeight: 400, placeItems: "center", textAlign: "center" }}>
        <div>
          <FolderKanban size={28} />
          <h2 style={{ margin: "12px 0 6px", fontSize: 20 }}>Project not found</h2>
          <p style={{ color: "#7c8e8b", fontSize: 13 }}>This record does not exist or the page was reloaded.</p>
          <Link href="/projects/all" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, padding: "10px 16px", background: "#202124", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Return to all projects
          </Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof EditData>(key: K, value: EditData[K]) =>
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (validation.length) {
      setError(`Complete the required fields: ${validation.join(", ")}.`);
      return;
    }

    const funding = data.funding
      .filter((f) => Number(f.amount) > 0)
      .map((f) => ({
        source: f.source,
        amount: Number(f.amount),
        share: totalBudget > 0 ? Math.round((Number(f.amount) / totalBudget) * 100) : 0,
        eligibility: "For validation" as const,
      }));

    updateProject(project.id, {
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
    });

    router.push(`/projects/${project.id}?saved=1`);
  };

  const addFunding = () => set("funding", [...data.funding, { source: "General Fund" as FundingSource, amount: "" }]);
  const removeFunding = (i: number) => set("funding", data.funding.filter((_, idx) => idx !== i));
  const setFunding = (i: number, key: "source" | "amount", value: string) =>
    set("funding", data.funding.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));
  const toggleSector = (s: string) =>
    set("beneficiarySectors", data.beneficiarySectors.includes(s) ? data.beneficiarySectors.filter((x) => x !== s) : [...data.beneficiarySectors, s]);
  const togglePlan = (p: string) =>
    set("planReferences", data.planReferences.includes(p) ? data.planReferences.filter((x) => x !== p) : [...data.planReferences, p]);

  const fmt = (n: number) => n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 });

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Edit Project</h1>
            <p>{project.code} · {project.title}</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href={`/projects/${project.id}`}>
              <ChevronLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.formCentered}>
          {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
          <form className={`${styles.card} ${styles.formCard}`} onSubmit={submit} noValidate>
            <div className={styles.stepper}>
              {steps.map((label, index) => (
                <button
                  type="button" key={label}
                  className={`${styles.step} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}
                  onClick={() => setStep(index)}
                >
                  <span className={styles.stepNumber}>{index < step ? <Check size={12} /> : index + 1}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className={styles.formBody}>
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Project information</h2>
                  <p className={styles.sectionHelp}>Update the project details, description, and expected outcomes.</p>
                  <div className={styles.formGrid}>
                    <Field label="Project title" required className={styles.span3} value={data.title} onChange={(v) => set("title", v)} placeholder="e.g. Construction of Barangay Health Station" />
                    <TextareaField label="Project description" required className={styles.span3} value={data.description} onChange={(v) => set("description", v)} placeholder="Provide a comprehensive description..." />
                    <TextareaField label="Problem statement" required className={styles.span3} value={data.problemStatement} onChange={(v) => set("problemStatement", v)} placeholder="What problem does this project solve?" />
                    <TextareaField label="Expected outcome" required className={styles.span3} value={data.expectedOutcome} onChange={(v) => set("expectedOutcome", v)} placeholder="What measurable results will this deliver?" />
                    <ShadcnSelectField label="Project type" required value={data.projectType} onChange={(v) => set("projectType", v)} options={PROJECT_TYPES} placeholder="Select project type" />
                    <TagsInput label="Tags / keywords" className={styles.span2} tags={data.tags} onChange={(v) => set("tags", v)} placeholder="Type and press Enter" />
                    <label className={`${styles.checkboxField} ${styles.span3}`}>
                      <input type="checkbox" checked={data.emergency} onChange={(e) => set("emergency", e.target.checked)} />
                      This is an emergency or urgent project
                    </label>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Location and beneficiary scope</h2>
                  <p className={styles.sectionHelp}>Specify where the project will be implemented and who it will serve.</p>
                  <div className={styles.formGrid}>
                    <Field label="Barangay / scope" required>
                      <Select value={data.barangay} onValueChange={(v) => set("barangay", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Barangay"><SelectValue placeholder="Select barangay" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select barangay or scope</SelectItem>
                          <SelectItem value="municipal">Municipality-wide</SelectItem>
                          {MATNOG_BARANGAYS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Specific location / site" required className={styles.span2} value={data.location} onChange={(v) => set("location", v)} placeholder="e.g. Purok 3, along National Highway" />
                    <Field label="Number of direct beneficiaries" required type="number" value={data.beneficiaries} onChange={(v) => set("beneficiaries", v)} placeholder="e.g. 3200" />
                    <div className={`${styles.field} ${styles.span2}`}>
                      <span>Beneficiary sectors <RequiredMark /></span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {BENEFICIARY_SECTORS.map((s) => (
                          <label key={s} className={styles.checkboxField} style={{ minHeight: 28, fontSize: 11 }}>
                            <input type="checkbox" checked={data.beneficiarySectors.includes(s)} onChange={() => toggleSector(s)} style={{ width: 14, height: 14 }} /> {s}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Responsible offices and timeline</h2>
                  <p className={styles.sectionHelp}>Update the offices responsible and the project timeline.</p>
                  <div className={styles.formGrid}>
                    <ShadcnSelectField label="Proposal source" required value={data.proposalSource} onChange={(v) => set("proposalSource", v)} options={PROPOSAL_SOURCES} placeholder="Select source" />
                    <ShadcnSelectField label="Implementing department" required value={data.implementingDepartment} onChange={(v) => set("implementingDepartment", v)} options={DEPARTMENTS} placeholder="Select department" />
                    <Field label="Requesting office" required value={data.requestingOffice} onChange={(v) => set("requestingOffice", v)} placeholder="e.g. Barangay Council of Bolo" />
                    <Field label="Lead officer / focal person" required value={data.leadOfficer} onChange={(v) => set("leadOfficer", v)} placeholder="e.g. Engr. Maria Santos" />
                    <ShadcnSelectField label="Fiscal year" value={data.fiscalYear} onChange={(v) => set("fiscalYear", v)} options={["2024", "2025", "2026"]} />
                    <label className={styles.checkboxField}>
                      <input type="checkbox" checked={data.multiYear} onChange={(e) => set("multiYear", e.target.checked)} /> Multi-year project
                    </label>
                    <Field label="Target start date" required type="date" value={data.targetStart} onChange={(v) => set("targetStart", v)} />
                    <Field label="Target completion date" required type="date" value={data.targetCompletion} onChange={(v) => set("targetCompletion", v)} />
                    <div className={`${styles.field} ${styles.span3}`}>
                      <span>Development plan references</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {PLAN_REFERENCES.map((p) => (
                          <label key={p} className={styles.checkboxField} style={{ minHeight: 28, fontSize: 11 }}>
                            <input type="checkbox" checked={data.planReferences.includes(p)} onChange={() => togglePlan(p)} style={{ width: 14, height: 14 }} /> {p}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Budget estimate and funding sources</h2>
                  <p className={styles.sectionHelp}>Update the estimated cost and funding sources.</p>
                  <div className={styles.formGrid}>
                    <div className={styles.span3}>
                      {data.funding.map((f, i) => (
                        <div key={`funding-${i}`} className={styles.fundingRow} style={{ marginBottom: 10 }}>
                          <Field label={i === 0 ? "Funding source" : ""}>
                            <Select value={f.source} onValueChange={(v) => setFunding(i, "source", v)}>
                              <SelectTrigger aria-label="Funding source"><SelectValue /></SelectTrigger>
                              <SelectContent>{FUNDING_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </Field>
                          <Field label={i === 0 ? "Amount (PHP)" : ""} type="number" value={f.amount} onChange={(v) => setFunding(i, "amount", v)} placeholder="e.g. 2500000" />
                          {data.funding.length > 1 && (
                            <button type="button" className={styles.removeButton} onClick={() => removeFunding(i)} aria-label="Remove">
                              <Minus size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className={styles.addButton} onClick={addFunding}><Plus size={14} /> Add another funding source</button>
                    </div>
                    <div className={`${styles.budgetTotal} ${styles.span3}`}>
                      <span>Total estimated budget</span>
                      <strong>{fmt(totalBudget)}</strong>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and save</h2>
                  <p className={styles.sectionHelp}>Review changes before saving.</p>
                  <div className={styles.reviewGrid}>
                    <section className={styles.reviewCard}>
                      <h3>Project Details</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Title</dt><dd>{data.title || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Type</dt><dd>{data.projectType || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Emergency</dt><dd>{data.emergency ? "Yes" : "No"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Location & Scope</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Barangay</dt><dd>{data.barangay === "municipal" ? "Municipality-wide" : data.barangay || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Beneficiaries</dt><dd>{data.beneficiaries ? Number(data.beneficiaries).toLocaleString() : "—"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Organization & Timeline</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Department</dt><dd>{data.implementingDepartment || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Lead officer</dt><dd>{data.leadOfficer || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Timeline</dt><dd>{data.targetStart && data.targetCompletion ? `${data.targetStart} to ${data.targetCompletion}` : "—"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Budget & Funding</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Total budget</dt><dd><strong>{fmt(totalBudget)}</strong></dd></div>
                      </dl>
                    </section>
                  </div>
                  {validation.length > 0 && (
                    <p className={styles.error} style={{ marginTop: 14, fontSize: 12 }}>
                      Required before saving: {validation.join(", ")}.
                    </p>
                  )}
                </>
              )}
            </div>

            <footer className={styles.formFooter}>
              <button type="button" className={styles.secondaryButton} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <ChevronLeft size={14} /> Previous
              </button>
              {step < steps.length - 1 ? (
                <button type="button" className={styles.primaryButton} onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button type="submit" className={styles.primaryButton}>
                  <Save size={14} /> Save changes
                </button>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
