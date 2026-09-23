"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  FileSearch,
  GitCompareArrows,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import type { DuplicateReviewOutcome, DuplicateReviewRecord, Project } from "../types/project";
import { formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "../views/duplicate-review.module.css";

export type DuplicateCase = {
  project: Project;
  matchedProject: Project;
};

export const DUPLICATE_OUTCOMES: DuplicateReviewOutcome[] = [
  "Pending",
  "No Conflict",
  "Related - Coordinate",
  "Consolidate",
  "Confirmed Duplicate",
];

export const DUPLICATE_REVIEWERS = [
  "Unassigned",
  "Municipal Planning and Development Office",
  "Municipal Engineering Office",
  "Municipal Development Council Secretariat",
];

export function DuplicateFilterSelect({
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

export function ReviewBadge({ label }: { label: string }) {
  return (
    <span className={`${styles.reviewBadge} ${styles[`review${label.replaceAll(/[^a-zA-Z]/g, "")}`]}`}>{label}</span>
  );
}

export function DuplicateCaseTable({
  cases,
  selectedId,
  onSelect,
}: {
  cases: DuplicateCase[];
  selectedId?: string;
  onSelect: (duplicateCase: DuplicateCase) => void;
}) {
  if (!cases.length) {
    return (
      <div className={styles.emptyQueue}>
        <FileSearch size={23} />
        <h3>No match cases found</h3>
        <p>Adjust the filters or publish projects from the priority ranking workspace.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableScroller}>
      <table className={styles.caseTable}>
        <thead>
          <tr>
            <th>Candidate project</th>
            <th>Possible match</th>
            <th>Confidence</th>
            <th>Review status</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((duplicateCase) => {
            const { project, matchedProject } = duplicateCase;
            return (
              <tr className={project.id === selectedId ? styles.selectedRow : ""} key={project.id}>
                <td className={styles.projectCell}>
                  <button type="button" onClick={() => onSelect(duplicateCase)}>
                    <strong>{project.title}</strong>
                    <span>
                      {project.code} · {project.proposalSource}
                    </span>
                    <small>{project.barangay ?? "Municipality-wide"}</small>
                  </button>
                </td>
                <td className={styles.matchCell}>
                  <strong>{matchedProject.title}</strong>
                  <span>
                    {matchedProject.code} · FY {matchedProject.fiscalYear}
                  </span>
                  <small>{matchedProject.pipelineStatus}</small>
                </td>
                <td>
                  <div className={styles.confidenceCell}>
                    <strong>{project.duplicateReview.confidence}%</strong>
                    <i>
                      <b style={{ width: `${project.duplicateReview.confidence}%` }} />
                    </i>
                  </div>
                </td>
                <td>
                  <ReviewBadge label={project.duplicateReview.status} />
                  {project.duplicateReview.outcome !== "Pending" ? (
                    <small className={styles.outcomeText}>{project.duplicateReview.outcome}</small>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonRow({ label, candidate, match }: { label: string; candidate: string; match: string }) {
  return (
    <div className={styles.comparisonRow}>
      <span>{label}</span>
      <strong>{candidate}</strong>
      <strong>{match}</strong>
    </div>
  );
}

export function DuplicateReviewPanel({
  duplicateCase,
  record,
  message,
  onOutcomeChange,
  onReviewerChange,
  onNoteChange,
  onSave,
}: {
  duplicateCase?: DuplicateCase;
  record?: DuplicateReviewRecord;
  message: string;
  onOutcomeChange: (value: DuplicateReviewOutcome) => void;
  onReviewerChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSave: () => void;
}) {
  if (!duplicateCase || !record) {
    return (
      <aside className={styles.reviewPanel}>
        <div className={styles.noSelection}>
          <GitCompareArrows size={25} />
          <h3>Select a match case</h3>
          <p>Choose a candidate to compare its scope with the possible existing project.</p>
        </div>
      </aside>
    );
  }

  const { project, matchedProject } = duplicateCase;
  const locked = Boolean(record.reviewedAt);
  const success = message.startsWith("Saved") || message.startsWith("Resolution");
  const candidateFund = project.funding.map((item) => item.source).join(", ");
  const matchedFund = matchedProject.funding.map((item) => item.source).join(", ");

  return (
    <aside className={styles.reviewPanel}>
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

      <section className={styles.confidenceHero}>
        <div>
          <span>Match confidence</span>
          <strong>{record.confidence}%</strong>
        </div>
        <div className={styles.signalList}>
          {record.signals.map((signal) => (
            <span key={signal}>
              <Sparkles size={10} /> {signal}
            </span>
          ))}
        </div>
        <ReviewBadge label={record.status} />
      </section>

      {message ? (
        <div className={success ? styles.successMessage : styles.errorMessage}>
          {success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {message}
        </div>
      ) : null}

      <section className={styles.comparisonSection}>
        <div className={styles.sectionHeading}>
          <div>
            <GitCompareArrows size={15} />
            <span>Side-by-side evidence</span>
          </div>
          <small>Candidate vs possible match</small>
        </div>
        <div className={styles.comparisonHeader}>
          <span>Attribute</span>
          <strong>Candidate</strong>
          <strong>Existing project</strong>
        </div>
        <ComparisonRow label="Project code" candidate={project.code} match={matchedProject.code} />
        <ComparisonRow label="Project type" candidate={project.projectType} match={matchedProject.projectType} />
        <ComparisonRow
          label="Location"
          candidate={project.barangay ?? "Municipality-wide"}
          match={matchedProject.barangay ?? "Municipality-wide"}
        />
        <ComparisonRow label="Fiscal year" candidate={project.fiscalYear} match={matchedProject.fiscalYear} />
        <ComparisonRow
          label="Budget"
          candidate={formatCompactCurrency(project.budget)}
          match={formatCompactCurrency(matchedProject.budget)}
        />
        <ComparisonRow
          label="Beneficiaries"
          candidate={project.beneficiaries.toLocaleString("en-PH")}
          match={matchedProject.beneficiaries.toLocaleString("en-PH")}
        />
        <ComparisonRow label="Fund source" candidate={candidateFund} match={matchedFund} />
        <ComparisonRow label="Pipeline" candidate={project.pipelineStatus} match={matchedProject.pipelineStatus} />
        <div className={styles.scopeComparison}>
          <span>Scope statement</span>
          <p>{project.description}</p>
          <p>{matchedProject.description}</p>
        </div>
        <div className={styles.matchLink}>
          <ShieldCheck size={13} />
          <span>Possible match</span>
          <Link href={`/projects/${matchedProject.id}`}>
            {matchedProject.code} <ArrowUpRight size={12} />
          </Link>
        </div>
      </section>

      <section className={styles.resolutionSection}>
        <div className={styles.sectionHeading}>
          <div>
            <ShieldCheck size={15} />
            <span>Review resolution</span>
          </div>
          {locked ? <small>Recorded {record.reviewedAt ? formatShortDate(record.reviewedAt) : ""}</small> : null}
        </div>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldLabel}>
            <span>Outcome</span>
            <Select
              value={record.outcome}
              disabled={locked}
              onValueChange={(value) => onOutcomeChange(value as DuplicateReviewOutcome)}
            >
              <SelectTrigger className={styles.formSelect} aria-label="Duplicate review outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUPLICATE_OUTCOMES.map((outcome) => (
                  <SelectItem value={outcome} key={outcome}>
                    {outcome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.fieldLabel}>
            <span>Reviewed by</span>
            <Select value={record.reviewer} disabled={locked} onValueChange={onReviewerChange}>
              <SelectTrigger className={styles.formSelect} aria-label="Duplicate review authority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUPLICATE_REVIEWERS.map((reviewer) => (
                  <SelectItem value={reviewer} key={reviewer}>
                    {reviewer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <label>
          <span>Findings and resolution note</span>
          <textarea
            rows={4}
            value={record.note}
            disabled={locked}
            placeholder="Document the scope comparison, coordination requirement, or basis for duplicate resolution…"
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>
      </section>

      <footer className={styles.panelActions}>
        <div>
          <Banknote size={13} /> Candidate value <strong>{formatCompactCurrency(project.budget)}</strong>
        </div>
        <button type="button" disabled={locked} onClick={onSave}>
          <Save size={14} /> {locked ? "Resolution recorded" : "Save resolution"}
        </button>
      </footer>
    </aside>
  );
}
