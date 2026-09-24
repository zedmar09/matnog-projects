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
import { useMonitoringStore, type ProgressUpdateInput } from "../stores/monitoring-store";
import type { ProgressUpdateType, WorkItem } from "../types/progress-update";

import styles from "./progress-form.module.css";

const steps = [
  "Project & period",
  "Reporter & progress",
  "Work items & issues",
  "Review & submit",
];

const REPORT_TYPES: ProgressUpdateType[] = ["Weekly", "Bi-weekly", "Monthly", "Milestone", "Ad-hoc"];

const REPORTERS = [
  { name: "Engr. Carlos M. Reyes", designation: "Municipal Engineer" },
  { name: "Engr. Maria D. Santos", designation: "Assistant Municipal Engineer" },
  { name: "Ar. Noel B. Fronda", designation: "Municipal Planning Officer" },
  { name: "Engr. Rafael T. Dizon", designation: "Project Engineer" },
  { name: "LGOO Ana P. Santos", designation: "Local Government Operations Officer" },
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

type FormWorkItem = {
  description: string;
  unit: string;
  targetQty: string;
  accomplishedQty: string;
};

type FormData = {
  projectId: string;
  reportType: ProgressUpdateType | "";
  periodStart: string;
  periodEnd: string;
  reporter: string;
  previousPhysical: string;
  currentPhysical: string;
  previousFinancial: string;
  currentFinancial: string;
  slippageDays: string;
  workItems: FormWorkItem[];
  issues: string;
  nextSteps: string;
};

function makeInitial(): FormData {
  return {
    projectId: "",
    reportType: "",
    periodStart: "",
    periodEnd: "",
    reporter: "",
    previousPhysical: "0",
    currentPhysical: "",
    previousFinancial: "0",
    currentFinancial: "",
    slippageDays: "0",
    workItems: [{ description: "", unit: "", targetQty: "", accomplishedQty: "" }],
    issues: "",
    nextSteps: "",
  };
}

function statusClass(status: string) {
  if (status === "Verified") return styles.active;
  if (status === "Returned") return styles.danger;
  if (status === "Draft") return styles.warning;
  if (status === "Submitted") return styles.info;
  return "";
}

export function ProgressNewView() {
  const router = useRouter();
  const projects = useProjectRegistryStore((s) => s.projects);
  const addProgressUpdate = useMonitoringStore((s) => s.addProgressUpdate);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(makeInitial);
  const [error, setError] = useState("");

  const updatableProjects = useMemo(
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

  const selectedReporter = REPORTERS.find((r) => r.name === data.reporter);

  const validation = useMemo(() => {
    const missing: string[] = [];
    if (!data.projectId) missing.push("project");
    if (!data.reportType) missing.push("report type");
    if (!data.periodStart) missing.push("period start");
    if (!data.periodEnd) missing.push("period end");
    if (!data.reporter) missing.push("reporter");
    if (!data.currentPhysical) missing.push("current physical progress");
    if (!data.currentFinancial) missing.push("current financial progress");
    return missing;
  }, [data]);

  const submit = (event: FormEvent, asDraft: boolean) => {
    event.preventDefault();
    if (!asDraft && validation.length) {
      setError(`Complete the required fields: ${validation.join(", ")}.`);
      return;
    }
    if (!selectedProject) return;

    const workItems: WorkItem[] = data.workItems
      .filter((w) => w.description)
      .map((w, i) => {
        const target = Number(w.targetQty) || 0;
        const accomplished = Number(w.accomplishedQty) || 0;
        return {
          id: `work-new-${i + 1}`,
          description: w.description,
          unit: w.unit,
          targetQty: target,
          accomplishedQty: accomplished,
          percentage: target > 0 ? Math.min(100, Math.round((accomplished / target) * 100)) : 0,
        };
      });

    const input: ProgressUpdateInput = {
      projectId: selectedProject.id,
      projectCode: selectedProject.code,
      projectTitle: selectedProject.title,
      barangay: selectedProject.barangay,
      projectType: selectedProject.projectType,
      contractor: selectedProject.contractor,
      reportType: data.reportType as ProgressUpdateType,
      status: asDraft ? "Draft" : "Submitted",
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      submittedBy: data.reporter,
      designation: selectedReporter?.designation ?? "",
      previousPhysical: Number(data.previousPhysical) || 0,
      currentPhysical: Number(data.currentPhysical) || 0,
      previousFinancial: Number(data.previousFinancial) || 0,
      currentFinancial: Number(data.currentFinancial) || 0,
      slippageDays: Number(data.slippageDays) || 0,
      workItems,
      issues: data.issues.trim(),
      nextSteps: data.nextSteps.trim(),
      submit: !asDraft,
    };

    const update = addProgressUpdate(input);
    router.push(`/monitoring/progress/${update.id}`);
  };

  const addWorkItem = () =>
    set("workItems", [...data.workItems, { description: "", unit: "", targetQty: "", accomplishedQty: "" }]);
  const removeWorkItem = (index: number) =>
    set("workItems", data.workItems.filter((_, i) => i !== index));
  const setWorkItem = (index: number, key: string, value: string) =>
    set("workItems", data.workItems.map((w, i) => (i === index ? { ...w, [key]: value } : w)));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>New Progress Report</h1>
            <p>Create a new progress update report for a monitored project. Required fields are marked with *.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/monitoring/progress">
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
                  <h2 className={styles.sectionTitle}>Project and reporting period</h2>
                  <p className={styles.sectionHelp}>
                    Select the project and define the reporting period for this progress update.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Project" required className={styles.span3}>
                      <Select value={data.projectId} onValueChange={(v) => set("projectId", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select a project</SelectItem>
                          {updatableProjects.map((p) => (
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
                      label="Report type"
                      required
                      value={data.reportType}
                      onChange={(v) => set("reportType", v as ProgressUpdateType)}
                      options={REPORT_TYPES}
                      placeholder="Select report type"
                    />
                    <Field
                      label="Period start"
                      required
                      type="date"
                      value={data.periodStart}
                      onChange={(v) => set("periodStart", v)}
                      help="Start date of the reporting period."
                    />
                    <Field
                      label="Period end"
                      required
                      type="date"
                      value={data.periodEnd}
                      onChange={(v) => set("periodEnd", v)}
                      help="End date of the reporting period."
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Reporter and progress</h2>
                  <p className={styles.sectionHelp}>
                    Assign the reporter and record physical and financial progress for this period.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Submitted by" required className={styles.span2}>
                      <Select value={data.reporter} onValueChange={(v) => set("reporter", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Reporter">
                          <SelectValue placeholder="Select reporter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select reporter</SelectItem>
                          {REPORTERS.map((r) => (
                            <SelectItem key={r.name} value={r.name}>
                              {r.name} — {r.designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {selectedReporter && (
                      <div className={styles.field}>
                        <span>Designation</span>
                        <input type="text" value={selectedReporter.designation} readOnly style={{ background: "#f7fbfa" }} />
                      </div>
                    )}
                    <Field
                      label="Previous physical (%)"
                      type="number"
                      value={data.previousPhysical}
                      onChange={(v) => set("previousPhysical", v)}
                      placeholder="0"
                      help="Physical progress at the end of the previous period."
                    />
                    <Field
                      label="Current physical (%)"
                      required
                      type="number"
                      value={data.currentPhysical}
                      onChange={(v) => set("currentPhysical", v)}
                      placeholder="e.g. 45"
                      help="Physical progress at the end of this period (0-100%)."
                    />
                    <Field
                      label="Slippage (days)"
                      type="number"
                      value={data.slippageDays}
                      onChange={(v) => set("slippageDays", v)}
                      placeholder="0"
                      help="Number of calendar days behind schedule. 0 if on track."
                    />
                    <Field
                      label="Previous financial (%)"
                      type="number"
                      value={data.previousFinancial}
                      onChange={(v) => set("previousFinancial", v)}
                      placeholder="0"
                      help="Financial disbursement at end of previous period."
                    />
                    <Field
                      label="Current financial (%)"
                      required
                      type="number"
                      value={data.currentFinancial}
                      onChange={(v) => set("currentFinancial", v)}
                      placeholder="e.g. 38"
                      help="Financial disbursement at end of this period (0-100%)."
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Work items, issues & next steps</h2>
                  <p className={styles.sectionHelp}>
                    List the work accomplished this period, any issues encountered, and planned next steps.
                  </p>
                  <div>
                    {data.workItems.map((w, i) => (
                      <div key={`work-${i}`} className={styles.workItemCard}>
                        <div className={styles.workItemHeader}>
                          <strong>Work Item #{i + 1}</strong>
                          {data.workItems.length > 1 && (
                            <button type="button" className={styles.removeButton} onClick={() => removeWorkItem(i)} aria-label="Remove work item">
                              <Minus size={14} />
                            </button>
                          )}
                        </div>
                        <div className={styles.formGrid}>
                          <Field
                            label="Description"
                            className={styles.span2}
                            value={w.description}
                            onChange={(v) => setWorkItem(i, "description", v)}
                            placeholder="e.g. Earthworks and excavation"
                          />
                          <Field
                            label="Unit"
                            value={w.unit}
                            onChange={(v) => setWorkItem(i, "unit", v)}
                            placeholder="e.g. cu.m."
                          />
                          <Field
                            label="Target qty"
                            type="number"
                            value={w.targetQty}
                            onChange={(v) => setWorkItem(i, "targetQty", v)}
                            placeholder="e.g. 150"
                          />
                          <Field
                            label="Accomplished qty"
                            type="number"
                            value={w.accomplishedQty}
                            onChange={(v) => setWorkItem(i, "accomplishedQty", v)}
                            placeholder="e.g. 95"
                          />
                        </div>
                      </div>
                    ))}
                    <button type="button" className={styles.addButton} onClick={addWorkItem}>
                      <Plus size={14} /> Add another work item
                    </button>
                  </div>
                  <div className={styles.formGrid} style={{ marginTop: 18 }}>
                    <TextareaField
                      label="Issues & concerns"
                      className={styles.span3}
                      value={data.issues}
                      onChange={(v) => set("issues", v)}
                      placeholder="e.g. Intermittent rainfall caused 2-day work stoppage. Contractor adjusted schedule accordingly."
                      help="Describe any issues, delays, or concerns encountered during this period."
                    />
                    <TextareaField
                      label="Next steps"
                      className={styles.span3}
                      value={data.nextSteps}
                      onChange={(v) => set("nextSteps", v)}
                      placeholder="e.g. Continue with structural framing and begin wall construction in the next period."
                      help="Planned activities for the next reporting period."
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and submit</h2>
                  <p className={styles.sectionHelp}>
                    Review all details before submitting. You can save as draft to complete later.
                  </p>
                  <div className={styles.reviewGrid}>
                    <section className={styles.reviewCard}>
                      <h3>Project & Period</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Project</dt><dd>{selectedProject?.title ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Project code</dt><dd>{selectedProject?.code ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Barangay</dt><dd>{selectedProject?.barangay ?? "Municipality-wide"}</dd></div>
                        <div className={styles.dataRow}><dt>Report type</dt><dd>{data.reportType || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Period</dt><dd>{data.periodStart && data.periodEnd ? `${data.periodStart} to ${data.periodEnd}` : "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Contractor</dt><dd>{selectedProject?.contractor ?? "Not assigned"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Reporter & Progress</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Submitted by</dt><dd>{data.reporter || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Designation</dt><dd>{selectedReporter?.designation ?? "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Physical progress</dt><dd>{data.previousPhysical}% → {data.currentPhysical || "—"}%</dd></div>
                        <div className={styles.dataRow}><dt>Financial progress</dt><dd>{data.previousFinancial}% → {data.currentFinancial || "—"}%</dd></div>
                        <div className={styles.dataRow}><dt>Slippage</dt><dd>{Number(data.slippageDays) > 0 ? `${data.slippageDays} days behind` : "On track"}</dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard} style={{ gridColumn: "1 / -1" }}>
                      <h3>Work Items ({data.workItems.filter((w) => w.description).length})</h3>
                      {data.workItems.filter((w) => w.description).length > 0 ? (
                        <table className={styles.workItemTable}>
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Unit</th>
                              <th>Target</th>
                              <th>Accomplished</th>
                              <th>%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.workItems.filter((w) => w.description).map((w, i) => {
                              const target = Number(w.targetQty) || 0;
                              const accomplished = Number(w.accomplishedQty) || 0;
                              const pct = target > 0 ? Math.min(100, Math.round((accomplished / target) * 100)) : 0;
                              return (
                                <tr key={`rev-work-${i}`}>
                                  <td>{w.description}</td>
                                  <td>{w.unit || "—"}</td>
                                  <td>{w.targetQty || "—"}</td>
                                  <td>{w.accomplishedQty || "—"}</td>
                                  <td>{pct}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ color: "#849693", fontSize: 12, margin: 0 }}>No work items added yet.</p>
                      )}
                    </section>
                    {(data.issues || data.nextSteps) && (
                      <section className={styles.reviewCard} style={{ gridColumn: "1 / -1" }}>
                        <h3>Issues & Next Steps</h3>
                        <dl className={styles.dataList}>
                          {data.issues && <div className={styles.dataRow}><dt>Issues</dt><dd>{data.issues}</dd></div>}
                          {data.nextSteps && <div className={styles.dataRow}><dt>Next steps</dt><dd>{data.nextSteps}</dd></div>}
                        </dl>
                      </section>
                    )}
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
                    <Send size={14} /> Submit report
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
