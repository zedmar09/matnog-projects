"use client";

import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  ClipboardPenLine,
  FileSearch,
  MapPin,
  Save,
  Settings2,
} from "lucide-react";
import Link from "next/link";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import type { Project, ProjectScoring, ScoringCriterion, ScoringStatus } from "../types/project";
import { formatCompactCurrency } from "../utils/project-utils";
import { getScoringCompletion, getWeightedScore } from "../utils/scoring-utils";
import styles from "../views/scoring-workspace.module.css";

export const ASSESSORS = ["Unassigned", "MPDC Carlo M. Fronda", "Engr. Mara D. Reyes", "LGOO Ana P. Santos"];
export const SCORING_STATUSES: ScoringStatus[] = ["Not Started", "In Progress", "Finalized"];

export function WorkspaceSelect({
  value,
  label,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={styles.filterSelect} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem value={option} key={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ScoringStatusBadge({ status }: { status: ScoringStatus }) {
  return <span className={`${styles.statusBadge} ${styles[`status${status.replace(" ", "")}`]}`}>{status}</span>;
}

export function CriteriaConfiguration({
  criteria,
  weightDraft,
  message,
  onWeightChange,
  onSave,
  onClose,
}: {
  criteria: ScoringCriterion[];
  weightDraft: Record<string, number>;
  message: string;
  onWeightChange: (id: string, weight: number) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const total = criteria.reduce((sum, criterion) => sum + (weightDraft[criterion.id] ?? 0), 0);
  return (
    <section className={styles.criteriaConfig}>
      <header>
        <div>
          <span>
            <Settings2 size={14} /> FY 2026 scoring model
          </span>
          <h3>Criteria weights</h3>
          <p>Weights apply to all draft and finalized scores in the current dummy-data session.</p>
        </div>
        <div className={total === 100 ? styles.validTotal : styles.invalidTotal}>
          <span>Total weight</span>
          <strong>{total}%</strong>
        </div>
      </header>
      <div className={styles.criteriaGrid}>
        {criteria.map((criterion) => (
          <label key={criterion.id}>
            <span>{criterion.label}</span>
            <small>{criterion.description}</small>
            <div>
              <input
                type="number"
                min="1"
                max="100"
                value={weightDraft[criterion.id] ?? 0}
                onChange={(event) => onWeightChange(criterion.id, Number(event.target.value))}
              />
              <span>%</span>
            </div>
          </label>
        ))}
      </div>
      <footer>
        {message ? (
          <span className={total === 100 ? styles.configSuccess : styles.configError}>{message}</span>
        ) : (
          <span>Weights must total exactly 100%.</span>
        )}
        <div>
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button" disabled={total !== 100} onClick={onSave}>
            <Save size={13} /> Save weights
          </button>
        </div>
      </footer>
    </section>
  );
}

export function ScoringQueue({
  projects,
  criteria,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  criteria: ScoringCriterion[];
  selectedId?: string;
  onSelect: (project: Project) => void;
}) {
  if (!projects.length) {
    return (
      <div className={styles.emptyQueue}>
        <FileSearch size={23} />
        <h3>No eligible proposals found</h3>
        <p>Adjust the current filters or complete a technical review with an advance recommendation.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableScroller}>
      <table className={styles.scoreTable}>
        <thead>
          <tr>
            <th>Proposal</th>
            <th>Source</th>
            <th>Scoring status</th>
            <th>Assessor</th>
            <th>Weighted score</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const score = getWeightedScore(project.scoring, criteria);
            const completion = getScoringCompletion(project.scoring, criteria);
            return (
              <tr className={project.id === selectedId ? styles.selectedRow : ""} key={project.id}>
                <td className={styles.proposalCell}>
                  <button type="button" onClick={() => onSelect(project)}>
                    <strong>{project.title}</strong>
                    <span>
                      {project.code} · {project.barangay ?? "Municipality-wide"}
                    </span>
                  </button>
                </td>
                <td>
                  <strong className={styles.sourceText}>{project.proposalSource}</strong>
                  <small>{project.implementingDepartment}</small>
                </td>
                <td>
                  <ScoringStatusBadge status={project.scoring.status} />
                </td>
                <td className={styles.assessorCell}>{project.scoring.assessor}</td>
                <td>
                  <div className={styles.tableScore}>
                    <strong>{score.toFixed(1)}</strong>
                    <span>{completion}% complete</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ScoringPanel({
  project,
  scoring,
  criteria,
  message,
  onAssessorChange,
  onRatingChange,
  onRationaleChange,
  onNotesChange,
  onSave,
  onFinalize,
}: {
  project?: Project;
  scoring?: ProjectScoring;
  criteria: ScoringCriterion[];
  message: string;
  onAssessorChange: (value: string) => void;
  onRatingChange: (criterionId: string, rating: number) => void;
  onRationaleChange: (criterionId: string, rationale: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onFinalize: () => void;
}) {
  if (!project || !scoring) {
    return (
      <aside className={styles.scoringPanel}>
        <div className={styles.noSelection}>
          <Calculator size={25} />
          <h3>Select a proposal</h3>
          <p>Choose an eligible record to begin its weighted assessment.</p>
        </div>
      </aside>
    );
  }

  const score = getWeightedScore(scoring, criteria);
  const completion = getScoringCompletion(scoring, criteria);
  const entries = new Map(scoring.entries.map((entry) => [entry.criterionId, entry]));
  const success = message.startsWith("Saved") || message.startsWith("Score finalized");
  const locked = scoring.status === "Finalized";

  return (
    <aside className={styles.scoringPanel}>
      <header className={styles.panelHeader}>
        <div>
          <span>{project.code}</span>
          <h3>{project.title}</h3>
          <p>
            <MapPin size={12} /> {project.location}
          </p>
        </div>
        <Link href={`/projects/${project.id}`}>
          Full record <ArrowUpRight size={13} />
        </Link>
      </header>
      <div className={styles.scoreHero}>
        <div>
          <span>Weighted score</span>
          <strong>
            {score.toFixed(1)}
            <small>/100</small>
          </strong>
        </div>
        <div className={styles.scoreProgress}>
          <span>
            <i style={{ width: `${completion}%` }} />
          </span>
          <small>{completion}% of criteria rated</small>
        </div>
        <ScoringStatusBadge status={scoring.status} />
      </div>

      {message ? (
        <div className={success ? styles.successMessage : styles.errorMessage}>
          {success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {message}
        </div>
      ) : null}

      <section className={styles.assignmentSection}>
        <div className={styles.sectionHeading}>
          <div>
            <ClipboardPenLine size={15} />
            <span>Scoring assignment</span>
          </div>
          <small>{project.proposalSource}</small>
        </div>
        <div className={styles.assignmentGrid}>
          <div className={styles.fieldLabel}>
            <span>Assigned assessor</span>
            <Select value={scoring.assessor} disabled={locked} onValueChange={onAssessorChange}>
              <SelectTrigger className={styles.formSelect} aria-label="Assigned assessor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSESSORS.map((assessor) => (
                  <SelectItem value={assessor} key={assessor}>
                    {assessor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.budgetFact}>
            <span>Proposed budget</span>
            <strong>{formatCompactCurrency(project.budget)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.criteriaSection}>
        <div className={styles.sectionHeading}>
          <div>
            <Calculator size={15} />
            <span>Weighted criteria</span>
          </div>
          <small>Rate each criterion from 1 to 5</small>
        </div>
        <div className={styles.criteriaList}>
          {criteria.map((criterion) => {
            const entry = entries.get(criterion.id);
            const points = entry?.rating ? (entry.rating / 5) * criterion.weight : 0;
            return (
              <article className={styles.criterionRow} key={criterion.id}>
                <div className={styles.criterionTop}>
                  <div>
                    <strong>{criterion.label}</strong>
                    <span>{criterion.weight}% weight</span>
                  </div>
                  <Select
                    value={entry?.rating?.toString() ?? "unrated"}
                    disabled={locked}
                    onValueChange={(value) => value !== "unrated" && onRatingChange(criterion.id, Number(value))}
                  >
                    <SelectTrigger className={styles.ratingSelect} aria-label={`${criterion.label} rating`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unrated">Not rated</SelectItem>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem value={rating.toString()} key={rating}>
                          {rating} —{" "}
                          {rating === 1
                            ? "Very low"
                            : rating === 2
                              ? "Low"
                              : rating === 3
                                ? "Moderate"
                                : rating === 4
                                  ? "High"
                                  : "Very high"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className={styles.points}>
                    <span>Points</span>
                    <strong>{points.toFixed(1)}</strong>
                  </div>
                </div>
                <p>{criterion.description}</p>
                <textarea
                  rows={2}
                  value={entry?.rationale ?? ""}
                  placeholder="Record the evidence supporting this rating…"
                  aria-label={`${criterion.label} rationale`}
                  disabled={locked}
                  onChange={(event) => onRationaleChange(criterion.id, event.target.value)}
                />
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.notesSection}>
        <label>
          <span>Overall assessor notes</span>
          <textarea
            rows={4}
            value={scoring.notes}
            disabled={locked}
            placeholder="Summarize the assessment and any ranking considerations…"
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </label>
      </section>

      <footer className={styles.panelActions}>
        <button className={styles.secondaryButton} type="button" disabled={locked} onClick={onSave}>
          <Save size={14} /> Save draft
        </button>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={scoring.status === "Finalized"}
          onClick={onFinalize}
        >
          <BadgeCheck size={14} /> {scoring.status === "Finalized" ? "Score finalized" : "Finalize score"}
        </button>
      </footer>
    </aside>
  );
}
