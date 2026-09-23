"use client";

import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MapPin,
  Save,
  Scale,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import type { PriorityDecision, PriorityRankingRecord, Project, ScoringCriterion } from "../types/project";
import { formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import { getWeightedScore } from "../utils/scoring-utils";
import styles from "../views/priority-ranking.module.css";

export const COMMITTEE_DECISIONS: PriorityDecision[] = ["Pending Deliberation", "Recommended", "On Hold", "Deferred"];
export const DECISION_MAKERS = [
  "Unassigned",
  "Municipal Development Council Secretariat",
  "Local Finance Committee",
  "Municipal Planning and Development Office",
];

export function RankingFilterSelect({
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

export function decisionLabel(project: Project) {
  return project.priorityRanking.publishedAt ? "Published" : project.priorityRanking.decision;
}

export function DecisionBadge({ label }: { label: string }) {
  return <span className={`${styles.decisionBadge} ${styles[`decision${label.replaceAll(" ", "")}`]}`}>{label}</span>;
}

export function RankingTable({
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
        <h3>No ranked projects found</h3>
        <p>Adjust the filters or finalize project scores in the scoring workspace.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableScroller}>
      <table className={styles.rankingTable}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Project</th>
            <th>Score</th>
            <th>Budget</th>
            <th>Beneficiaries</th>
            <th>Committee decision</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr className={project.id === selectedId ? styles.selectedRow : ""} key={project.id}>
              <td>
                <span className={`${styles.rankPill} ${index < 3 ? styles.topRank : ""}`}>#{index + 1}</span>
              </td>
              <td className={styles.projectCell}>
                <button type="button" onClick={() => onSelect(project)}>
                  <strong>{project.title}</strong>
                  <span>
                    {project.code} · {project.barangay ?? "Municipality-wide"}
                  </span>
                  <small>{project.proposalSource}</small>
                </button>
              </td>
              <td>
                <div className={styles.scoreCell}>
                  <strong>{getWeightedScore(project.scoring, criteria).toFixed(1)}</strong>
                  <span>/100</span>
                </div>
              </td>
              <td className={styles.moneyCell}>
                {formatCompactCurrency(project.budget)}
                <small>{project.funding[0]?.source}</small>
              </td>
              <td>{project.beneficiaries.toLocaleString("en-PH")}</td>
              <td>
                <DecisionBadge label={decisionLabel(project)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankingDecisionPanel({
  project,
  rank,
  record,
  criteria,
  message,
  onDecisionChange,
  onDecidedByChange,
  onNoteChange,
  onSave,
}: {
  project?: Project;
  rank: number;
  record?: PriorityRankingRecord;
  criteria: ScoringCriterion[];
  message: string;
  onDecisionChange: (value: PriorityDecision) => void;
  onDecidedByChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSave: () => void;
}) {
  if (!project || !record) {
    return (
      <aside className={styles.decisionPanel}>
        <div className={styles.noSelection}>
          <Scale size={25} />
          <h3>Select a ranked project</h3>
          <p>Choose a project to review its score evidence and committee recommendation.</p>
        </div>
      </aside>
    );
  }

  const score = getWeightedScore(project.scoring, criteria);
  const entryMap = new Map(project.scoring.entries.map((entry) => [entry.criterionId, entry]));
  const published = Boolean(record.publishedAt);
  const success = message.startsWith("Saved");

  return (
    <aside className={styles.decisionPanel}>
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

      <section className={styles.rankHero}>
        <div className={styles.heroRank}>
          <span>Current rank</span>
          <strong>#{rank}</strong>
        </div>
        <div className={styles.heroScore}>
          <span>Weighted score</span>
          <strong>
            {score.toFixed(1)}
            <small>/100</small>
          </strong>
        </div>
        <DecisionBadge label={decisionLabel(project)} />
      </section>

      {message ? (
        <div className={success ? styles.successMessage : styles.errorMessage}>
          {success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {message}
        </div>
      ) : null}

      <section className={styles.factGrid}>
        <div>
          <Banknote size={13} />
          <span>Proposed budget</span>
          <strong>{formatCompactCurrency(project.budget)}</strong>
        </div>
        <div>
          <UsersRound size={13} />
          <span>Beneficiaries</span>
          <strong>{project.beneficiaries.toLocaleString("en-PH")}</strong>
        </div>
        <div>
          <ClipboardCheck size={13} />
          <span>Plan references</span>
          <strong>{project.planReferences.length}</strong>
        </div>
        <div>
          <BadgeCheck size={13} />
          <span>Technical review</span>
          <strong>{project.technicalReview.recommendation}</strong>
        </div>
      </section>

      <section className={styles.breakdownSection}>
        <div className={styles.sectionHeading}>
          <div>
            <Scale size={15} />
            <span>Score breakdown</span>
          </div>
          <small>Finalized {project.scoring.finalizedAt ? formatShortDate(project.scoring.finalizedAt) : "—"}</small>
        </div>
        <div className={styles.breakdownList}>
          {criteria.map((criterion) => {
            const entry = entryMap.get(criterion.id);
            const rating = entry?.rating ?? 0;
            const points = (rating / 5) * criterion.weight;
            return (
              <div key={criterion.id}>
                <div>
                  <strong>{criterion.label}</strong>
                  <span>
                    {rating}/5 · {points.toFixed(1)}/{criterion.weight} pts
                  </span>
                </div>
                <i>
                  <b style={{ width: `${rating * 20}%` }} />
                </i>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.decisionSection}>
        <div className={styles.sectionHeading}>
          <div>
            <ClipboardCheck size={15} />
            <span>Committee decision</span>
          </div>
          {published ? <small>Published {record.publishedAt ? formatShortDate(record.publishedAt) : ""}</small> : null}
        </div>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldLabel}>
            <span>Recommendation</span>
            <Select
              value={record.decision}
              disabled={published}
              onValueChange={(value) => onDecisionChange(value as PriorityDecision)}
            >
              <SelectTrigger className={styles.formSelect} aria-label="Committee recommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMITTEE_DECISIONS.map((decision) => (
                  <SelectItem value={decision} key={decision}>
                    {decision}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.fieldLabel}>
            <span>Decided by</span>
            <Select value={record.decidedBy} disabled={published} onValueChange={onDecidedByChange}>
              <SelectTrigger className={styles.formSelect} aria-label="Decision authority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DECISION_MAKERS.map((maker) => (
                  <SelectItem value={maker} key={maker}>
                    {maker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <label>
          <span>Committee note</span>
          <textarea
            rows={4}
            value={record.committeeNote}
            disabled={published}
            placeholder="Document deliberation findings and the basis for this recommendation…"
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>
      </section>

      <footer className={styles.panelActions}>
        <button type="button" disabled={published} onClick={onSave}>
          <Save size={14} /> {published ? "Decision published" : "Save decision"}
        </button>
      </footer>
    </aside>
  );
}
