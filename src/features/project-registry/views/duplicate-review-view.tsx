"use client";

import { AlertTriangle, CheckCircle2, GitCompareArrows, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { useShellStore } from "@/stores/shell-store";

import {
  DUPLICATE_OUTCOMES,
  type DuplicateCase,
  DuplicateCaseTable,
  DuplicateFilterSelect,
  DuplicateReviewPanel,
} from "../components/duplicate-review-workspace";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { DuplicateReviewOutcome, DuplicateReviewRecord } from "../types/project";
import { filterProjectsByScope } from "../utils/project-utils";
import styles from "./duplicate-review.module.css";

const TODAY = "2026-09-23";
const REVIEW_STATUSES = ["Pending Review", "In Review", "Cleared", "Resolved"];
const CONFIDENCE_LEVELS = ["High confidence", "Moderate confidence"];

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

export function DuplicateReviewView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const saveDuplicateReview = useProjectRegistryStore((state) => state.saveDuplicateReview);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [reviewStatus, setReviewStatus] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const [barangay, setBarangay] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState("");
  const [draft, setDraft] = useState<DuplicateReviewRecord>();
  const [feedback, setFeedback] = useState({ projectId: "", text: "" });
  const [confirmDefer, setConfirmDefer] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const cases = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction)
        .flatMap((project): DuplicateCase[] => {
          const matchId = project.duplicateReview.matchedProjectId;
          const matchedProject = matchId ? projectMap.get(matchId) : undefined;
          const isReviewCandidate =
            project.pipelineStatus === "Prioritized" ||
            (project.pipelineStatus === "Deferred" &&
              ["Consolidate", "Confirmed Duplicate"].includes(project.duplicateReview.outcome));
          return matchedProject && isReviewCandidate ? [{ project, matchedProject }] : [];
        })
        .toSorted((a, b) => {
          const confidenceDifference = b.project.duplicateReview.confidence - a.project.duplicateReview.confidence;
          return confidenceDifference || a.project.code.localeCompare(b.project.code);
        }),
    [projects, projectMap, fiscalYear, jurisdiction],
  );
  const options = useMemo(
    () => ({
      barangays: unique(cases.map(({ project }) => project.barangay ?? "Municipality-wide")),
      projectTypes: unique(cases.map(({ project }) => project.projectType)),
    }),
    [cases],
  );
  const filteredCases = useMemo(
    () =>
      cases.filter(({ project, matchedProject }) => {
        const review = project.duplicateReview;
        if (deferredSearch) {
          const haystack = [project.code, project.title, matchedProject.code, matchedProject.title, project.barangay]
            .join(" ")
            .toLocaleLowerCase();
          if (!haystack.includes(deferredSearch)) return false;
        }
        if (reviewStatus !== "all" && review.status !== reviewStatus) return false;
        if (outcome !== "all" && review.outcome !== outcome) return false;
        if (confidence === "High confidence" && review.confidence < 90) return false;
        if (confidence === "Moderate confidence" && review.confidence >= 90) return false;
        if (barangay !== "all" && (project.barangay ?? "Municipality-wide") !== barangay) return false;
        if (projectType !== "all" && project.projectType !== projectType) return false;
        return true;
      }),
    [cases, deferredSearch, reviewStatus, outcome, confidence, barangay, projectType],
  );
  const selectedCase = filteredCases.find(({ project }) => project.id === selectedId) ?? filteredCases[0];
  const storedRecord = selectedCase?.project.duplicateReview;
  const activeRecord = selectedCase
    ? storedRecord?.reviewedAt
      ? storedRecord
      : draftProjectId === selectedCase.project.id && draft
        ? draft
        : storedRecord
    : undefined;
  const hasFilters = Boolean(
    search ||
      reviewStatus !== "all" ||
      outcome !== "all" ||
      confidence !== "all" ||
      barangay !== "all" ||
      projectType !== "all",
  );
  const summary = {
    cases: filteredCases.length,
    highConfidence: filteredCases.filter(({ project }) => project.duplicateReview.confidence >= 90).length,
    pending: filteredCases.filter(({ project }) =>
      ["Pending Review", "In Review"].includes(project.duplicateReview.status),
    ).length,
    resolved: filteredCases.filter(({ project }) => Boolean(project.duplicateReview.reviewedAt)).length,
  };

  const selectCase = (duplicateCase: DuplicateCase) => {
    setSelectedId(duplicateCase.project.id);
    setDraftProjectId(duplicateCase.project.id);
    setDraft(structuredClone(duplicateCase.project.duplicateReview));
    setFeedback({ projectId: "", text: "" });
    setConfirmDefer(false);
  };
  const updateRecord = (changes: Partial<DuplicateReviewRecord>) => {
    if (!selectedCase || !activeRecord) return;
    setDraftProjectId(selectedCase.project.id);
    setDraft({ ...activeRecord, ...changes, status: "In Review" });
    setFeedback({ projectId: "", text: "" });
  };
  const validateRecord = () => {
    if (!selectedCase || !activeRecord) return false;
    if (activeRecord.outcome === "Pending") {
      setFeedback({ projectId: selectedCase.project.id, text: "Select a resolution outcome before saving." });
      return false;
    }
    if (activeRecord.reviewer === "Unassigned") {
      setFeedback({ projectId: selectedCase.project.id, text: "Assign the office responsible for this review." });
      return false;
    }
    if (!activeRecord.note.trim()) {
      setFeedback({ projectId: selectedCase.project.id, text: "Document the comparison findings before saving." });
      return false;
    }
    return true;
  };
  const commitResolution = () => {
    if (!selectedCase || !activeRecord) return;
    const isDeferredOutcome = activeRecord.outcome === "Consolidate" || activeRecord.outcome === "Confirmed Duplicate";
    const resolvedRecord: DuplicateReviewRecord = {
      ...activeRecord,
      status: isDeferredOutcome ? "Resolved" : "Cleared",
      reviewedAt: TODAY,
    };
    const updated = saveDuplicateReview(selectedCase.project.id, resolvedRecord);
    if (!updated) return;
    setSelectedId(updated.id);
    setDraftProjectId(updated.id);
    setDraft(structuredClone(updated.duplicateReview));
    setConfirmDefer(false);
    setFeedback({
      projectId: updated.id,
      text: isDeferredOutcome
        ? "Resolution saved and project moved to Deferred."
        : "Saved duplicate review resolution.",
    });
  };
  const saveResolution = () => {
    if (!validateRecord() || !activeRecord) return;
    if (activeRecord.outcome === "Consolidate" || activeRecord.outcome === "Confirmed Duplicate") {
      setConfirmDefer(true);
      return;
    }
    commitResolution();
  };
  const clearFilters = () => {
    setSearch("");
    setReviewStatus("all");
    setOutcome("all");
    setConfidence("all");
    setBarangay("all");
    setProjectType("all");
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Portfolio integrity control</span>
          </div>
          <h2>Duplicate & overlap review</h2>
          <p>
            Compare prioritized proposals with existing projects, document scope relationships, and prevent duplicate
            public investment.
          </p>
        </div>
        <div className={styles.rulesBadge}>
          <ShieldCheck size={15} />
          <span>Rules scan</span>
          <strong>{cases.length} cases</strong>
        </div>
      </header>

      {confirmDefer && selectedCase && activeRecord ? (
        <section className={styles.confirmBanner}>
          <div>
            <strong>Confirm {activeRecord.outcome.toLocaleLowerCase()} resolution?</strong>
            <p>
              {selectedCase.project.code} will move to Deferred and the decision will be added to its activity trail.
            </p>
          </div>
          <div>
            <button type="button" onClick={() => setConfirmDefer(false)}>
              Cancel
            </button>
            <button type="button" onClick={commitResolution}>
              <ShieldAlert size={13} /> Confirm and defer
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.summaryStrip}>
        <div>
          <GitCompareArrows size={17} />
          <span>Suspected matches</span>
          <strong>{summary.cases}</strong>
        </div>
        <div>
          <AlertTriangle size={17} />
          <span>High confidence</span>
          <strong>{summary.highConfidence}</strong>
        </div>
        <div>
          <ShieldAlert size={17} />
          <span>Pending review</span>
          <strong>{summary.pending}</strong>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Resolved / cleared</span>
          <strong>{summary.resolved}</strong>
        </div>
      </section>

      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search duplicate review cases</span>
            <input
              type="search"
              value={search}
              placeholder="Search candidate or matched project…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <DuplicateFilterSelect
            value={reviewStatus}
            label="Review status filter"
            placeholder="All review statuses"
            options={REVIEW_STATUSES}
            onChange={setReviewStatus}
          />
          <DuplicateFilterSelect
            value={outcome}
            label="Resolution outcome filter"
            placeholder="All outcomes"
            options={DUPLICATE_OUTCOMES.slice(1)}
            onChange={setOutcome}
          />
          <DuplicateFilterSelect
            value={confidence}
            label="Confidence filter"
            placeholder="All confidence levels"
            options={CONFIDENCE_LEVELS}
            onChange={setConfidence}
          />
          <DuplicateFilterSelect
            value={barangay}
            label="Barangay filter"
            placeholder="All barangays"
            options={options.barangays}
            onChange={setBarangay}
          />
          <DuplicateFilterSelect
            value={projectType}
            label="Project type filter"
            placeholder="All project types"
            options={options.projectTypes}
            onChange={setProjectType}
          />
          {hasFilters ? (
            <button className={styles.clearButton} type="button" onClick={clearFilters}>
              Clear
            </button>
          ) : null}
        </div>
        <div className={styles.workspaceGrid}>
          <div className={styles.queuePane}>
            <div className={styles.queueHeading}>
              <div>
                <h3>Potential duplicate cases</h3>
                <p>Confidence descending · candidate project code</p>
              </div>
              <strong>{filteredCases.length} records</strong>
            </div>
            <DuplicateCaseTable cases={filteredCases} selectedId={selectedCase?.project.id} onSelect={selectCase} />
          </div>
          <DuplicateReviewPanel
            duplicateCase={selectedCase}
            record={activeRecord}
            message={feedback.projectId === selectedCase?.project.id ? feedback.text : ""}
            onOutcomeChange={(nextOutcome: DuplicateReviewOutcome) => updateRecord({ outcome: nextOutcome })}
            onReviewerChange={(reviewer) => updateRecord({ reviewer })}
            onNoteChange={(note) => updateRecord({ note })}
            onSave={saveResolution}
          />
        </div>
      </section>
    </main>
  );
}
