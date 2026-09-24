"use client";

import {
  CheckCircle2,
  ClipboardList,
  Gauge,
  Info,
  Pencil,
  Scale,
  Star,
  Target,
  Weight,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import type { ScoringCriterion } from "@/features/project-registry/types/project";

import styles from "./scoring-criteria-settings.module.css";

const RATING_SCALE = [
  { value: 5, label: "Excellent", description: "Fully meets or exceeds the criterion with strong evidence and no gaps.", color: "#0d7357", bg: "#e0f5eb" },
  { value: 4, label: "Very Good", description: "Substantially meets the criterion with minor areas for improvement.", color: "#1a8d6e", bg: "#e6f5ef" },
  { value: 3, label: "Satisfactory", description: "Adequately meets the criterion but with noticeable gaps or limitations.", color: "#7c6e1c", bg: "#fef9e7" },
  { value: 2, label: "Fair", description: "Partially meets the criterion; significant concerns or missing elements.", color: "#b47a1d", bg: "#fff3d8" },
  { value: 1, label: "Poor", description: "Fails to meet the criterion or provides insufficient evidence.", color: "#b43d3d", bg: "#fef2f2" },
];

export function ScoringCriteriaSettingsView() {
  const criteria = useProjectRegistryStore((s) => s.scoringCriteria);
  const updateScoringCriteria = useProjectRegistryStore((s) => s.updateScoringCriteria);
  const projects = useProjectRegistryStore((s) => s.projects);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ScoringCriterion[]>([]);
  const [feedback, setFeedback] = useState("");

  const scoredCount = useMemo(
    () => projects.filter((p) => p.scoring.status === "Finalized").length,
    [projects],
  );

  const inProgressCount = useMemo(
    () => projects.filter((p) => p.scoring.status === "In Progress").length,
    [projects],
  );

  const maxWeight = useMemo(
    () => Math.max(...criteria.map((c) => c.weight)),
    [criteria],
  );

  const draftTotal = useMemo(
    () => draft.reduce((sum, c) => sum + (c.weight || 0), 0),
    [draft],
  );

  function startEditing() {
    setDraft(criteria.map((c) => ({ ...c })));
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft([]);
  }

  function setDraftWeight(index: number, value: string) {
    const num = value === "" ? 0 : Math.max(0, Math.min(100, parseInt(value, 10) || 0));
    setDraft((d) => d.map((c, i) => (i === index ? { ...c, weight: num } : c)));
  }

  function handleSave() {
    const ok = updateScoringCriteria(draft);
    if (ok) {
      setEditing(false);
      setDraft([]);
      setFeedback("Scoring criteria weights updated successfully.");
      window.setTimeout(() => setFeedback(""), 3500);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Configuration</p>
            <h1>Scoring Criteria</h1>
            <p>Manage the weighted criteria used to evaluate and prioritize project proposals.</p>
          </div>
          {!editing && (
            <button type="button" className={styles.heroButton} onClick={startEditing}>
              <Pencil size={16} /> Edit Weights
            </button>
          )}
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.summaryGrid}>
          <article>
            <span className={styles.summaryIcon}><ClipboardList size={18} /></span>
            <div>
              <span>Criteria</span>
              <strong>{criteria.length}</strong>
              <small>evaluation dimensions</small>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}><Weight size={18} /></span>
            <div>
              <span>Total weight</span>
              <strong>{criteria.reduce((s, c) => s + c.weight, 0)}%</strong>
              <small>must equal 100%</small>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}><CheckCircle2 size={18} /></span>
            <div>
              <span>Scored</span>
              <strong>{scoredCount}</strong>
              <small>finalized projects</small>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}><Gauge size={18} /></span>
            <div>
              <span>In progress</span>
              <strong>{inProgressCount}</strong>
              <small>being evaluated</small>
            </div>
          </article>
        </section>

        <div className={styles.infoCard}>
          <Info size={18} />
          <div>
            Each project proposal is evaluated against these criteria during the scoring phase.
            Assessors rate every criterion on a 1–5 scale. The weighted score (0–100) determines
            the proposal&rsquo;s position in the priority ranking queue.
          </div>
        </div>

        {editing ? (
          <>
            <div className={styles.editBar}>
              <div className={styles.editBarLeft}>
                <h2>Editing Weights</h2>
                <span className={`${styles.totalBadge} ${draftTotal === 100 ? styles.totalValid : styles.totalInvalid}`}>
                  {draftTotal}% / 100%
                </span>
              </div>
              <div className={styles.editBarRight}>
                <button type="button" className={styles.cancelButton} onClick={cancelEditing}>Cancel</button>
                <button
                  type="button"
                  className={styles.saveButton}
                  disabled={draftTotal !== 100 || draft.some((c) => c.weight <= 0)}
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
            <div className={styles.criteriaList}>
              {draft.map((criterion, index) => (
                <div key={criterion.id} className={styles.editCriterionCard}>
                  <span className={styles.criterionRank}>{index + 1}</span>
                  <div className={styles.editCriterionInfo}>
                    <h3>{criterion.label}</h3>
                    <p>{criterion.description}</p>
                  </div>
                  <div className={styles.weightInput}>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={criterion.weight || ""}
                      onChange={(e) => setDraftWeight(index, e.target.value)}
                    />
                    <span>%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.criteriaList}>
            {criteria.map((criterion, index) => (
              <div key={criterion.id} className={styles.criterionCard}>
                <span className={styles.criterionRank}>{index + 1}</span>
                <div className={styles.criterionContent}>
                  <h3>{criterion.label}</h3>
                  <p>{criterion.description}</p>
                  <div className={styles.criterionMeta}>
                    <span className={styles.metaChip}>
                      <Target size={10} /> Priority #{index + 1}
                    </span>
                    <span className={styles.metaChip}>
                      <Scale size={10} /> {criterion.weight}% weight
                    </span>
                    <span className={styles.metaChip}>
                      <Star size={10} /> 1–5 rating scale
                    </span>
                  </div>
                </div>
                <div className={styles.criterionWeight}>
                  <span className={styles.weightValue}>
                    {criterion.weight}<span>%</span>
                  </span>
                  <div className={styles.weightBar}>
                    <div
                      className={styles.weightBarFill}
                      style={{ width: `${(criterion.weight / maxWeight) * 100}%` }}
                    />
                  </div>
                  <span className={styles.weightLabel}>Weight</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className={styles.scaleCard}>
          <h2>Rating Scale Reference</h2>
          <table className={styles.scaleTable}>
            <thead>
              <tr>
                <th>Rating</th>
                <th>Label</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {RATING_SCALE.map((r) => (
                <tr key={r.value}>
                  <td>
                    <span
                      className={styles.ratingBadge}
                      style={{ color: r.color, background: r.bg }}
                    >
                      {r.value}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#294743" }}>{r.label}</td>
                  <td>{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {feedback && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}
    </div>
  );
}
