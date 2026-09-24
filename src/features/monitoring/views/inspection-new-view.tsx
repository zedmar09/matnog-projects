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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { useMonitoringStore, type InspectionInput } from "../stores/monitoring-store";
import type { InspectionFinding, InspectionRating, InspectionType } from "../types/inspection";

import styles from "./inspection-form.module.css";

const steps = [
  "Project & schedule",
  "Inspector & progress",
  "Findings & rating",
  "Review & submit",
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

function makeInitial(): FormData {
  return {
    projectId: "",
    inspectionType: "",
    scheduledDate: "",
    inspector: "",
    physicalProgress: "",
    financialProgress: "",
    overallRating: "",
    remarks: "",
    findings: [{ area: "", observation: "", rating: "", actionRequired: "" }],
  };
}

function statusClass(status: string) {
  if (status === "Satisfactory") return styles.active;
  if (status === "Unsatisfactory") return styles.danger;
  if (status === "Needs Improvement") return styles.warning;
  return "";
}

export function InspectionNewView() {
  const router = useRouter();
  const projects = useProjectRegistryStore((s) => s.projects);
  const addInspection = useMonitoringStore((s) => s.addInspection);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(makeInitial);
  const [error, setError] = useState("");

  const inspectableProjects = useMemo(
    () =>
      projects.filter((p) =>
        ["Implementation", "Inspection", "Closeout", "Completed", "Procurement"].includes(p.deliveryStage),
      ),
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

  const submit = (event: FormEvent, asDraft: boolean) => {
    event.preventDefault();
    if (!asDraft && validation.length) {
      setError(`Complete the required fields: ${validation.join(", ")}.`);
      return;
    }
    if (!selectedProject) return;

    const findings: InspectionFinding[] = data.findings
      .filter((f) => f.area && f.observation)
      .map((f, i) => ({
        id: `finding-new-${i + 1}`,
        area: f.area,
        observation: f.observation,
        rating: (f.rating || "Not Assessed") as InspectionRating,
        actionRequired: f.actionRequired,
      }));

    const input: InspectionInput = {
      projectId: selectedProject.id,
      projectCode: selectedProject.code,
      projectTitle: selectedProject.title,
      barangay: selectedProject.barangay,
      projectType: selectedProject.projectType,
      contractor: selectedProject.contractor,
      inspectionType: data.inspectionType as InspectionType,
      scheduledDate: data.scheduledDate,
      inspector: data.inspector,
      inspectorDesignation: selectedInspector?.designation ?? "",
      physicalProgressAtInspection: Number(data.physicalProgress) || 0,
      financialProgressAtInspection: Number(data.financialProgress) || 0,
      overallRating: (data.overallRating || "Not Assessed") as InspectionRating,
      findings,
      remarks: data.remarks.trim(),
      status: asDraft ? "Scheduled" : "Completed",
      submit: !asDraft,
    };

    const inspection = addInspection(input);
    router.push(`/monitoring/inspections/${inspection.id}`);
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
            <h1>New Inspection</h1>
            <p>Create a new site inspection record for an ongoing municipal project. Required fields are marked with *.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/monitoring/inspections">
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
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Project and schedule</h2>
                  <p className={styles.sectionHelp}>
                    Select the project to inspect and set the inspection type and scheduled date.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Project" required className={styles.span3}>
                      <Select value={data.projectId} onValueChange={(v) => set("projectId", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Project">
                          <SelectValue placeholder="Select a project to inspect" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select a project</SelectItem>
                          {inspectableProjects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code} — {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {selectedProject && (
                      <div className={`${styles.infoBox} ${styles.span3}`}>
                        <Info size={20} />
                        <div>
                          <strong>{selectedProject.title}</strong>
                          <small>
                            {selectedProject.barangay ?? "Municipality-wide"} · {selectedProject.projectType} · {selectedProject.deliveryStage} · Contractor: {selectedProject.contractor ?? "Not assigned"}
                          </small>
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
                    <Field
                      label="Scheduled date"
                      required
                      type="date"
                      value={data.scheduledDate}
                      onChange={(v) => set("scheduledDate", v)}
                      help="The date when the site inspection is planned."
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Inspector and progress</h2>
                  <p className={styles.sectionHelp}>
                    Assign the inspector and record the physical and financial progress at the time of inspection.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Inspector" required className={styles.span2}>
                      <Select value={data.inspector} onValueChange={(v) => set("inspector", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Inspector">
                          <SelectValue placeholder="Select assigned inspector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select inspector</SelectItem>
                          {INSPECTORS.map((i) => (
                            <SelectItem key={i.name} value={i.name}>
                              {i.name} — {i.designation}
                            </SelectItem>
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
                    <Field
                      label="Physical progress (%)"
                      required
                      type="number"
                      value={data.physicalProgress}
                      onChange={(v) => set("physicalProgress", v)}
                      placeholder="e.g. 65"
                      help="Estimated physical accomplishment at the time of this inspection (0-100%)."
                    />
                    <Field
                      label="Financial progress (%)"
                      required
                      type="number"
                      value={data.financialProgress}
                      onChange={(v) => set("financialProgress", v)}
                      placeholder="e.g. 58"
                      help="Financial disbursement rate at the time of this inspection (0-100%)."
                    />
                    <ShadcnSelectField
                      label="Overall rating"
                      required
                      value={data.overallRating}
                      onChange={(v) => set("overallRating", v as InspectionRating)}
                      options={RATING_OPTIONS}
                      placeholder="Select overall rating"
                    />
                    <TextareaField
                      label="General remarks"
                      required
                      className={styles.span3}
                      value={data.remarks}
                      onChange={(v) => set("remarks", v)}
                      placeholder="e.g. Site inspection conducted as scheduled. Contractor workforce is adequate. Minor issues noted on drainage alignment."
                      help="Provide a summary of general observations during the site inspection."
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Inspection findings</h2>
                  <p className={styles.sectionHelp}>
                    Document specific findings and observations per area inspected. Add findings for each area checked.
                  </p>
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
                          <ShadcnSelectField
                            label="Area inspected"
                            value={f.area}
                            onChange={(v) => setFinding(i, "area", v)}
                            options={FINDING_AREAS}
                            placeholder="Select area"
                          />
                          <ShadcnSelectField
                            label="Rating"
                            value={f.rating}
                            onChange={(v) => setFinding(i, "rating", v)}
                            options={RATING_OPTIONS}
                            placeholder="Rate this area"
                          />
                          <TextareaField
                            label="Observation"
                            className={styles.span3}
                            value={f.observation}
                            onChange={(v) => setFinding(i, "observation", v)}
                            placeholder="e.g. Concrete curing was properly observed. Surface quality meets standards."
                            rows={2}
                          />
                          <TextareaField
                            label="Action required"
                            className={styles.span3}
                            value={f.actionRequired}
                            onChange={(v) => setFinding(i, "actionRequired", v)}
                            placeholder="e.g. No action required. Continue with approved schedule."
                            rows={2}
                          />
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
                  <h2 className={styles.sectionTitle}>Review and submit</h2>
                  <p className={styles.sectionHelp}>
                    Review all inspection details before submitting. You can save as scheduled to complete later.
                  </p>
                  <div className={styles.reviewGrid}>
                    <section className={styles.reviewCard}>
                      <h3>Project & Schedule</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Project</dt><dd>{selectedProject?.title ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Project code</dt><dd>{selectedProject?.code ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Barangay</dt><dd>{selectedProject?.barangay ?? "Municipality-wide"}</dd></div>
                        <div className={styles.dataRow}><dt>Inspection type</dt><dd>{data.inspectionType || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Scheduled date</dt><dd>{data.scheduledDate || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Contractor</dt><dd>{selectedProject?.contractor ?? "Not assigned"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Inspector & Progress</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Inspector</dt><dd>{data.inspector || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Designation</dt><dd>{selectedInspector?.designation ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Physical progress</dt><dd>{data.physicalProgress ? `${data.physicalProgress}%` : "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Financial progress</dt><dd>{data.financialProgress ? `${data.financialProgress}%` : "—"}</dd></div>
                        <div className={styles.dataRow}>
                          <dt>Overall rating</dt>
                          <dd>
                            {data.overallRating ? (
                              <span className={`${styles.badge} ${statusClass(data.overallRating)}`}>{data.overallRating}</span>
                            ) : "—"}
                          </dd>
                        </div>
                        <div className={styles.dataRow}><dt>Remarks</dt><dd>{data.remarks || "—"}</dd></div>
                      </dl>
                    </section>
                    <section className={`${styles.reviewCard} ${styles.span2}`} style={{ gridColumn: "1 / -1" }}>
                      <h3>Findings ({data.findings.filter((f) => f.area).length})</h3>
                      {data.findings.filter((f) => f.area).length > 0 ? (
                        <dl className={styles.dataList}>
                          {data.findings.filter((f) => f.area).map((f, i) => (
                            <div key={`rev-finding-${i}`} className={styles.dataRow}>
                              <dt>{f.area}</dt>
                              <dd>
                                {f.rating && <span className={`${styles.badge} ${statusClass(f.rating)}`} style={{ marginRight: 6 }}>{f.rating}</span>}
                                {f.observation}
                                {f.actionRequired && <><br /><small style={{ color: "#849693", fontSize: 10 }}>Action: {f.actionRequired}</small></>}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p style={{ color: "#849693", fontSize: 12, margin: 0 }}>No findings added yet.</p>
                      )}
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
                    <Save size={14} /> Save as scheduled
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
                    <Send size={14} /> Submit inspection
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
