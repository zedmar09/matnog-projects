"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Layers,
  Send,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { IMPLEMENTING_DEPARTMENTS } from "@/features/project-registry/constants/proposal-options";

import { COLOR_OPTIONS, ICON_MAP, ICON_OPTIONS, useProjectTypeStore } from "../stores/project-type-store";

import styles from "./project-type-form.module.css";

const steps = [
  "Name & description",
  "Icon & appearance",
  "Department & funds",
  "Review & save",
];

const FUND_SOURCES = [
  "20% Development Fund",
  "General Fund",
  "Local DRRM Fund",
  "Special Education Fund",
  "Barangay Development Fund",
  "National Government Grant",
  "Provincial Assistance",
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

type FormData = {
  name: string;
  description: string;
  iconKey: string;
  color: string;
  department: string;
  eligibleFunds: string[];
  active: boolean;
};

export function ProjectTypeEditView({ typeId }: { typeId: string }) {
  const router = useRouter();
  const typeRecord = useProjectTypeStore((s) => s.getTypeById(typeId));
  const updateType = useProjectTypeStore((s) => s.updateType);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");

  const [data, setData] = useState<FormData>(() => {
    if (!typeRecord) {
      return { name: "", description: "", iconKey: "layers", color: COLOR_OPTIONS[0], department: "", eligibleFunds: [], active: true };
    }
    return {
      name: typeRecord.name,
      description: typeRecord.description,
      iconKey: typeRecord.iconKey,
      color: typeRecord.color,
      department: typeRecord.department,
      eligibleFunds: [...typeRecord.eligibleFunds],
      active: typeRecord.active,
    };
  });

  if (!typeRecord) {
    return (
      <div className={styles.page}>
        <div style={{ display: "grid", minHeight: 400, placeItems: "center", alignContent: "center", padding: 40, color: "#7b8e8a", textAlign: "center" }}>
          <Layers size={40} />
          <h2 style={{ margin: "12px 0 4px", color: "#3d5753", fontSize: 18 }}>Project type not found</h2>
          <p style={{ margin: "0 0 14px", fontSize: 12 }}>The requested project type does not exist.</p>
          <Link href="/settings/project-types" style={{ color: "#14785f", fontWeight: 600, textDecoration: "none" }}>Back to Project Types</Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((c) => ({ ...c, [key]: value }));

  function toggleFund(fund: string) {
    setData((f) => ({
      ...f,
      eligibleFunds: f.eligibleFunds.includes(fund)
        ? f.eligibleFunds.filter((e) => e !== fund)
        : [...f.eligibleFunds, fund],
    }));
  }

  function handleSubmit() {
    updateType(typeId, data);
    setFeedback(`"${data.name}" has been updated.`);
    window.setTimeout(() => router.push(`/settings/project-types/${typeId}`), 1200);
  }

  const SelectedIcon = ICON_MAP[data.iconKey];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Configuration</p>
            <h1>Edit: {typeRecord.name}</h1>
            <p>Update the configuration for this project type. Required fields are marked with *.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href={`/settings/project-types/${typeId}`}>
              <ChevronLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.formCentered}>
          {feedback && <div className={`${styles.toast} ${styles.success}`}>{feedback}</div>}
          <div className={`${styles.card} ${styles.formCard}`}>
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
                  <h2 className={styles.sectionTitle}>Name and description</h2>
                  <p className={styles.sectionHelp}>
                    Update the display name and description for this project type.
                  </p>
                  <div className={styles.formGrid}>
                    <Field
                      label="Type name"
                      required
                      className={styles.span3}
                      value={data.name}
                      onChange={(v) => set("name", v)}
                      placeholder="e.g. Road and transport"
                      help="The name as it will appear across the project registry and reports."
                    />
                    <TextareaField
                      label="Description"
                      required
                      className={styles.span3}
                      value={data.description}
                      onChange={(v) => set("description", v)}
                      placeholder="Describe the scope and purpose of this project type"
                      help="A clear description helps users select the correct type when creating proposals."
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Icon and appearance</h2>
                  <p className={styles.sectionHelp}>
                    Choose an icon and accent color that will visually represent this project type across the system.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Icon" required className={styles.span3}>
                      <div className={styles.iconPicker}>
                        {ICON_OPTIONS.map((key) => {
                          const Icon = ICON_MAP[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              className={`${styles.iconOption} ${data.iconKey === key ? styles.iconOptionSelected : ""}`}
                              onClick={() => set("iconKey", key)}
                              title={key}
                            >
                              <Icon size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                    <Field label="Color" required className={styles.span3}>
                      <div className={styles.colorPicker}>
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`${styles.colorOption} ${data.color === color ? styles.colorOptionSelected : ""}`}
                            style={{ background: color }}
                            onClick={() => set("color", color)}
                            title={color}
                          />
                        ))}
                      </div>
                    </Field>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Department and eligible funds</h2>
                  <p className={styles.sectionHelp}>
                    Update the implementing department and eligible fund sources for projects of this type.
                  </p>
                  <div className={styles.formGrid}>
                    <Field label="Implementing department" required className={styles.span3}>
                      <Select value={data.department} onValueChange={(v) => set("department", v === "__none__" ? "" : v)}>
                        <SelectTrigger aria-label="Implementing department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select department</SelectItem>
                          {IMPLEMENTING_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Eligible fund sources" className={styles.span3}>
                      <div className={styles.checkGroup}>
                        {FUND_SOURCES.map((fund) => (
                          <label
                            key={fund}
                            className={`${styles.checkItem} ${data.eligibleFunds.includes(fund) ? styles.checkItemChecked : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={data.eligibleFunds.includes(fund)}
                              onChange={() => toggleFund(fund)}
                            />
                            {fund}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and save</h2>
                  <p className={styles.sectionHelp}>
                    Review all changes before saving. You can go back to any step to make adjustments.
                  </p>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewPreview}>
                      <span className={styles.reviewIconWrap} style={{ color: data.color, background: `${data.color}14` }}>
                        {SelectedIcon && <SelectedIcon size={26} />}
                      </span>
                      <div>
                        <h3>{data.name || "Untitled type"}</h3>
                        <p>{data.description || "No description provided"}</p>
                      </div>
                    </div>
                    <section className={styles.reviewCard}>
                      <h3>Details</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Name</dt><dd>{data.name || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Department</dt><dd>{data.department || "—"}</dd></div>
                        <div className={styles.dataRow}><dt>Status</dt><dd><span className={`${styles.badge} ${styles.active}`}>{data.active ? "Active" : "Inactive"}</span></dd></div>
                      </dl>
                    </section>
                    <section className={styles.reviewCard}>
                      <h3>Appearance</h3>
                      <dl className={styles.dataList}>
                        <div className={styles.dataRow}><dt>Icon</dt><dd>{data.iconKey}</dd></div>
                        <div className={styles.dataRow}>
                          <dt>Color</dt>
                          <dd style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 12, height: 12, borderRadius: "50%", background: data.color, display: "inline-block" }} />
                            {data.color}
                          </dd>
                        </div>
                      </dl>
                    </section>
                    {data.eligibleFunds.length > 0 && (
                      <div className={styles.fundTagsReview}>
                        {data.eligibleFunds.map((fund) => (
                          <span key={fund} className={styles.fundTagSmall}>
                            <Landmark size={8} /> {fund}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={step === 0 && !data.name.trim()}
                    onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                  >
                    Continue <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!data.name.trim()}
                    onClick={handleSubmit}
                  >
                    <Send size={14} /> Save changes
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
