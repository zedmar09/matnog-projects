"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Info,
  Minus,
  Plus,
  Save,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { useMonitoringStore } from "../stores/monitoring-store";
import type { InspectionFinding, InspectionRating, InspectionType } from "../types/inspection";

import styles from "./inspection-form.module.css";

const steps = [
  "Project & schedule",
  "Inspector & progress",
  "Findings & rating",
  "Review & save",
];

const INSPECTION_TYPES: InspectionType[] = [
  "Routine",
  "Milestone",
  "Pre-Final",
  "Final",
  "Spot Check",
  "Follow-up",
];

const RATING_OPTIONS: InspectionRating[] = [
  "Satisfactory",
  "Needs Improvement",
  "Unsatisfactory",
  "Not Assessed",
];

const INSPECTORS = [
  { name: "Engr. Carlos M. Reyes", designation: "Municipal Engineer" },
  { name: "Engr. Maria D. Santos", designation: "Assistant Municipal Engineer" },
  { name: "Ar. Noel B. Fronda", designation: "Municipal Planning Officer" },
  { name: "Engr. Rafael T. Dizon", designation: "Project Engineer" },
  { name: "LGOO Ana P. Santos", designation: "Local Government Operations Officer" },
];

const FINDING_AREAS = [
  "Structural works",
  "Concrete quality",
  "Steel reinforcement",
  "Drainage alignment",
  "Excavation depth",
  "Material storage",
  "Safety compliance",
  "Workmanship quality",
  "Site cleanliness",
  "Road grading",
];

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
  className = "",
  rows = 3,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) {
  return (
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

type FormData = {
  projectId: string;
  inspectionType: InspectionType | "";
  scheduledDate: string;
  inspector: string;
  physicalProgress: string;
  financialProgress: string;
  overallRating: InspectionRating | "";
  remarks: string;
  findings: {
    area: string;
    observation: string;
    rating: InspectionRating | "";
    actionRequired: string;
  }[];
};

function statusClass(status: string) {
  if (status === "Satisfactory") return styles.active;
  if (status === "Unsatisfactory") return styles.danger;
  if (status === "Needs Improvement") return styles.warning;
  return "";
}

export function InspectionEditView({ inspectionId }: { inspectionId: string }) {
  const router = useRouter();
  const inspection = useMonitoringStore((s) => s.inspections.find((i) => i.id === inspectionId));
  const updateInspection = useMonitoringStore((s) => s.updateInspection);
  const projects = useProjectRegistryStore((s) => s.projects);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [data, setData] = useState<FormData>(() => {
    if (!inspection) return { projectId: "", inspectionType: "", scheduledDate: "", inspector: "", physicalProgress: "", financialProgress: "", overallRating: "", remarks: "", findings: [] };
    return {
      projectId: inspection.projectId,
      inspectionType: inspection.inspectionType,
      scheduledDate: inspection.scheduledDate,
      inspector: inspection.inspector,
      physicalProgress: String(inspection.physicalProgressAtInspection),
      financialProgress: String(inspection.financialProgressAtInspection),
      overallRating: inspection.overallRating,
      remarks: inspection.remarks,
      findings: inspection.findings.map((f) => ({
        area: f.area,
        observation: f.observation,
        rating: f.rating,
        actionRequired: f.actionRequired,
      })),
    };
  });

  const inspectableProjects = useMemo(
    () => projects.filter((p) => ["Implementation", "Inspection", "Closeout", "Completed", "Procurement"].includes(p.deliveryStage)),
    [projects],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === data.projectId),
    [projects, data.projectId],
  );

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((c) => ({ ...c, [key]: value }));

  const selectedInspector = INSPECTORS.find((i) => i.name === data.inspector);

  const validation = useMemo(() => {
    const missing: string[] = [];
    if (!data.projectId) missing.push("project");
    if (!data.inspectionType) missing.push("inspection type");
    if (!data.scheduledDate) missing.push("scheduled date");
    if (!data.inspector) missing.push("inspector");
    if (!data.physicalProgress) missing.push("physical progress");
    if (!data.financialProgress) missing.push("financial progress");
    if (!data.overallRating) missing.push("overall rating");
    if (!data.remarks.trim()) missing.push("remarks");
    return missing;
  }, [data]);

  if (!inspection) {
    return (
      <div className={styles.page}>
        <div style={{ padding: 40, textAlign: "center" }}>
          <ClipboardCheck size={28} />
          <h2>Inspection not found</h2>
          <Link href="/monitoring/inspections">Return to inspections</Link>
        </div>
      </div>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (validation.length) {
      setError(`Complete the required fields: ${validation.join(", ")}.`);
      return;
    }

    const findings: InspectionFinding[] = data.findings
      .filter((f) => f.area && f.observation)
      .map((f, i) => ({
        id: `finding-${inspectionId}-${i + 1}`,
        area: f.area,
        observation: f.observation,
        rating: (f.rating || "Not Assessed") as InspectionRating,
        actionRequired: f.actionRequired,
      }));

    updateInspection(inspectionId, {
      projectId: data.projectId,
      projectCode: selectedProject?.code ?? inspection.projectCode,
      projectTitle: selectedProject?.title ?? inspection.projectTitle,
      barangay: selectedProject?.barangay ?? inspection.barangay,
      projectType: selectedProject?.projectType ?? inspection.projectType,
      contractor: selectedProject?.contractor ?? inspection.contractor,
      inspectionType: data.inspectionType as InspectionType,
      scheduledDate: data.scheduledDate,
      inspector: data.inspector,
      inspectorDesignation: selectedInspector?.designation ?? "",
      physicalProgressAtInspection: Number(data.physicalProgress) || 0,
      financialProgressAtInspection: Number(data.financialProgress) || 0,
      overallRating: (data.overallRating || "Not Assessed") as InspectionRating,
      findings,
      remarks: data.remarks.trim(),
    });

    router.push(`/monitoring/inspections/${inspectionId}?saved=1`);
  };

  const addFinding = () =>
    set("findings", [...data.findings, { area: "", observation: "", rating: "", actionRequired: "" }]);
  const removeFinding = (index: number) =>
    set("findings", data.findings.filter((_, i) => i !== index));
  const setFinding = (index: number, key: string, value: string) =>
    set("findings", data.findings.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Edit Inspection</h1>
            <p>Update the inspection record for {inspection.code}. Required fields are marked with *.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href={`/monitoring/inspections/${inspectionId}`}>
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
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Project and schedule</h2>
                  <p className={styles.sectionHelp}>Update the project assignment and inspection schedule.</p>
                  <div className={styles.formGrid}>
                    <Field label="Project" required className={styles.span3}>
                      <Select value={data.projectId} onValueChange={(v) => set("projectId", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select a project</SelectItem>
                          {inspectableProjects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.code} — {p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {selectedProject && (
                      <div className={`${styles.infoBox} ${styles.span3}`}>
                        <Info size={20} />
                        <div>
                          <strong>{selectedProject.title}</strong>
                          <small>{selectedProject.barangay ?? "Municipality-wide"} · {selectedProject.projectType} · {selectedProject.deliveryStage}</small>
                        </div>
                      </div>
                    )}
                    <ShadcnSelectField
                      label="Inspection type"
                      required
                      value={data.inspectionType}
                      onChange={(v) => set("inspectionType", v as InspectionType)}
                      options={INSPECTION_TYPES}
                      placeholder="Select inspection type"
                    />
                    <Field label="Scheduled date" required type="date" value={data.scheduledDate} onChange={(v) => set("scheduledDate", v)} />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Inspector and progress</h2>
                  <p className={styles.sectionHelp}>Update inspector assignment and progress readings.</p>
                  <div className={styles.formGrid}>
                    <Field label="Inspector" required className={styles.span2}>
                      <Select value={data.inspector} onValueChange={(v) => set("inspector", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Inspector">
                          <SelectValue placeholder="Select inspector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select inspector</SelectItem>
                          {INSPECTORS.map((i) => (
                            <SelectItem key={i.name} value={i.name}>{i.name} — {i.designation}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {selectedInspector && (
                      <div className={styles.field}>
                        <span>Designation</span>
                        <input type="text" value={selectedInspector.designation} readOnly style={{ background: "#f7fbfa" }} />
                      </div>
                    )}
                    <Field label="Physical progress (%)" required type="number" value={data.physicalProgress} onChange={(v) => set("physicalProgress", v)} placeholder="e.g. 65" />
                    <Field label="Financial progress (%)" required type="number" value={data.financialProgress} onChange={(v) => set("financialProgress", v)} placeholder="e.g. 58" />
                    <ShadcnSelectField label="Overall rating" required value={data.overallRating} onChange={(v) => set("overallRating", v as InspectionRating)} options={RATING_OPTIONS} placeholder="Select rating" />
                    <TextareaField label="General remarks" required className={styles.span3} value={data.remarks} onChange={(v) => set("remarks", v)} placeholder="General observations..." />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Inspection findings</h2>
                  <p className={styles.sectionHelp}>Update findings for each inspected area.</p>
                  <div>
                    {data.findings.map((f, i) => (
                      <div key={`finding-${i}`} className={styles.findingCard}>
                        <div className={styles.findingHeader}>
                          <strong>Finding #{i + 1}</strong>
                          {data.findings.length > 1 && (
                            <button type="button" className={styles.removeButton} onClick={() => removeFinding(i)} aria-label="Remove finding">
                              <Minus size={14} />
                            </button>
                          )}
                        </div>
                        <div className={styles.formGrid}>
                          <ShadcnSelectField label="Area inspected" value={f.area} onChange={(v) => setFinding(i, "area", v)} options={FINDING_AREAS} placeholder="Select area" />
                          <ShadcnSelectField label="Rating" value={f.rating} onChange={(v) => setFinding(i, "rating", v)} options={RATING_OPTIONS} placeholder="Rate this area" />
                          <TextareaField label="Observation" className={styles.span3} value={f.observation} onChange={(v) => setFinding(i, "observation", v)} placeholder="Observation details..." rows={2} />
                          <TextareaField label="Action required" className={styles.span3} value={f.actionRequired} onChange={(v) => setFinding(i, "actionRequired", v)} placeholder="Required action..." rows={2} />
                        </div>
                      </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={addFinding}>
                      <Plus size={14} /> Add another finding
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and save</h2>
                  <p className={styles.sectionHelp}>Review all changes before saving.</p>
                  <div className={styles.reviewGrid}>
                    <section className={styles.reviewCard}>
                      <h3>Project & Schedule</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Project</dt><dd>{selectedProject?.title ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Project code</dt><dd>{selectedProject?.code ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Inspection type</dt><dd>{data.inspectionType || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Scheduled date</dt><dd>{data.scheduledDate || "—"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Inspector & Progress</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Inspector</dt><dd>{data.inspector || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Physical progress</dt><dd>{data.physicalProgress ? `${data.physicalProgress}%` : "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Financial progress</dt><dd>{data.financialProgress ? `${data.financialProgress}%` : "—"}</dd></div>
                        <div className={styles.dataRow}>
                          <dt>Overall rating</dt>
                          <dd>{data.overallRating ? <span className={`${styles.badge} ${statusClass(data.overallRating)}`}>{data.overallRating}</span> : "—"}</dd>
                        </div>
                        <div className={styles.dataRow}><dt>Remarks</dt><dd>{data.remarks || "—"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard} style={{ gridColumn: "1 / -1" }}>
                      <h3>Findings ({data.findings.filter((f) => f.area).length})</h3>
                      {data.findings.filter((f) => f.area).length > 0 ? (
                        <dl className={styles.dataList}>
                          {data.findings.filter((f) => f.area).map((f, i) => (
                            <div key={`rev-${i}`} className={styles.dataRow}>
                              <dt>{f.area}</dt>
                              <dd>
                                {f.rating && <span className={`${styles.badge} ${statusClass(f.rating)}`} style={{ marginRight: 6 }}>{f.rating}</span>}
                                {f.observation}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p style={{ color: "#849693", fontSize: 12, margin: 0 }}>No findings.</p>
                      )}
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
              <div style={{ display: "flex", gap: 8 }}>
                {step < steps.length - 1 ? (
                  <button type="button" className={styles.primaryButton} onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                    Continue <ChevronRight size={14} />
                  </button>
                ) : (
                  <button type="submit" className={styles.primaryButton}>
                    <Save size={14} /> Save changes
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
