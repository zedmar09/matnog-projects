"use client";

import { BarChart3, Calculator, CheckCircle2, ClipboardList, Search, Settings2 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { useShellStore } from "@/stores/shell-store";

import {
  CriteriaConfiguration,
  SCORING_STATUSES,
  ScoringPanel,
  ScoringQueue,
  WorkspaceSelect,
} from "../components/scoring-workspace";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { Project, ProjectScoring, ScoringCriterion } from "../types/project";
import { filterProjectsByScope } from "../utils/project-utils";
import { getWeightedScore } from "../utils/scoring-utils";
import styles from "./scoring-workspace.module.css";

const TODAY = "2026-09-23";

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

function draftWeights(criteria: ScoringCriterion[]) {
  return Object.fromEntries(criteria.map((criterion) => [criterion.id, criterion.weight]));
}

export function ScoringWorkspaceView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const criteria = useProjectRegistryStore((state) => state.scoringCriteria);
  const saveProjectScoring = useProjectRegistryStore((state) => state.saveProjectScoring);
  const updateScoringCriteria = useProjectRegistryStore((state) => state.updateScoringCriteria);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [office, setOffice] = useState("all");
  const [barangay, setBarangay] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState("");
  const [draft, setDraft] = useState<ProjectScoring>();
  const [feedback, setFeedback] = useState({ projectId: "", text: "" });
  const [configurationOpen, setConfigurationOpen] = useState(false);
  const [weightDraft, setWeightDraft] = useState<Record<string, number>>(() => draftWeights(criteria));
  const [configurationMessage, setConfigurationMessage] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const eligibleProjects = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction).filter(
        (project) =>
          project.pipelineStatus === "Under Review" &&
          project.technicalReview.status === "Completed" &&
          project.technicalReview.recommendation === "Advance to Scoring",
      ),
    [projects, fiscalYear, jurisdiction],
  );
  const options = useMemo(
    () => ({
      sources: unique(eligibleProjects.map((project) => project.proposalSource)),
      offices: unique(eligibleProjects.map((project) => project.implementingDepartment)),
      barangays: unique(eligibleProjects.map((project) => project.barangay ?? "Municipality-wide")),
    }),
    [eligibleProjects],
  );
  const filteredProjects = useMemo(
    () =>
      eligibleProjects
        .filter((project) => {
          if (deferredSearch) {
            const haystack = [
              project.code,
              project.title,
              project.proposalSource,
              project.implementingDepartment,
              project.scoring.assessor,
              project.barangay ?? "Municipality-wide",
            ]
              .join(" ")
              .toLocaleLowerCase();
            if (!haystack.includes(deferredSearch)) return false;
          }
          if (status !== "all" && project.scoring.status !== status) return false;
          if (source !== "all" && project.proposalSource !== source) return false;
          if (office !== "all" && project.implementingDepartment !== office) return false;
          if (barangay !== "all" && (project.barangay ?? "Municipality-wide") !== barangay) return false;
          return true;
        })
        .toSorted((a, b) => {
          const statusOrder = { "In Progress": 0, "Not Started": 1, Finalized: 2 };
          const order = statusOrder[a.scoring.status] - statusOrder[b.scoring.status];
          return order || getWeightedScore(b.scoring, criteria) - getWeightedScore(a.scoring, criteria);
        }),
    [eligibleProjects, deferredSearch, status, source, office, barangay, criteria],
  );
  const selectedProject = filteredProjects.find((project) => project.id === selectedId) ?? filteredProjects[0];
  const activeScoring = selectedProject
    ? draftProjectId === selectedProject.id && draft
      ? draft
      : selectedProject.scoring
    : undefined;
  const hasFilters = Boolean(search || status !== "all" || source !== "all" || office !== "all" || barangay !== "all");

  const selectProject = (project: Project) => {
    setSelectedId(project.id);
    setDraftProjectId(project.id);
    setDraft(structuredClone(project.scoring));
    setFeedback({ projectId: "", text: "" });
  };
  const updateScoring = (changes: Partial<ProjectScoring>) => {
    if (!selectedProject || !activeScoring) return;
    setDraftProjectId(selectedProject.id);
    setDraft({
      ...activeScoring,
      ...changes,
      status: activeScoring.status === "Not Started" ? "In Progress" : (changes.status ?? activeScoring.status),
    });
    setFeedback({ projectId: "", text: "" });
  };
  const updateEntry = (criterionId: string, changes: { rating?: number; rationale?: string }) => {
    if (!activeScoring) return;
    updateScoring({
      entries: activeScoring.entries.map((entry) =>
        entry.criterionId === criterionId ? { ...entry, ...changes } : entry,
      ),
    });
  };
  const saveScoring = (scoring = activeScoring) => {
    if (!selectedProject || !scoring) return;
    setSelectedId(selectedProject.id);
    const updated = saveProjectScoring(selectedProject.id, scoring);
    if (!updated) return;
    setDraftProjectId(selectedProject.id);
    setDraft(structuredClone(updated.scoring));
    setFeedback({ projectId: selectedProject.id, text: "Saved scoring draft." });
  };
  const finalizeScoring = () => {
    if (!selectedProject || !activeScoring) return;
    if (activeScoring.assessor === "Unassigned") {
      return setFeedback({ projectId: selectedProject.id, text: "Assign an assessor before finalizing the score." });
    }
    if (activeScoring.entries.some((entry) => entry.rating === null)) {
      return setFeedback({ projectId: selectedProject.id, text: "Rate every criterion before finalizing the score." });
    }
    if (activeScoring.entries.some((entry) => !entry.rationale.trim())) {
      return setFeedback({ projectId: selectedProject.id, text: "Provide an evidence rationale for every criterion." });
    }
    const finalized: ProjectScoring = { ...activeScoring, status: "Finalized", finalizedAt: TODAY };
    saveScoring(finalized);
    setFeedback({ projectId: selectedProject.id, text: "Score finalized for the priority ranking phase." });
  };
  const saveWeights = () => {
    const updatedCriteria = criteria.map((criterion) => ({
      ...criterion,
      weight: weightDraft[criterion.id] ?? criterion.weight,
    }));
    const saved = updateScoringCriteria(updatedCriteria);
    setConfigurationMessage(saved ? "Scoring weights saved." : "Weights must be positive and total 100%.");
  };
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSource("all");
    setOffice("all");
    setBarangay("all");
  };
  const scoredProjects = filteredProjects.filter((project) => project.scoring.status === "Finalized");
  const averageScore = scoredProjects.length
    ? scoredProjects.reduce((sum, project) => sum + getWeightedScore(project.scoring, criteria), 0) /
      scoredProjects.length
    : 0;
  const summary = {
    eligible: filteredProjects.length,
    unscored: filteredProjects.filter((project) => project.scoring.status === "Not Started").length,
    inProgress: filteredProjects.filter((project) => project.scoring.status === "In Progress").length,
    finalized: scoredProjects.length,
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Weighted assessment</span>
          </div>
          <h2>Scoring workspace</h2>
          <p>Apply the approved multi-criteria model to technically cleared proposals before priority ranking.</p>
        </div>
        <button
          className={styles.configureButton}
          type="button"
          onClick={() => {
            setConfigurationOpen((open) => !open);
            setWeightDraft(draftWeights(criteria));
            setConfigurationMessage("");
          }}
        >
          <Settings2 size={15} /> Configure weights
        </button>
      </header>

      {configurationOpen ? (
        <CriteriaConfiguration
          criteria={criteria}
          weightDraft={weightDraft}
          message={configurationMessage}
          onWeightChange={(id, weight) => {
            setWeightDraft((current) => ({ ...current, [id]: weight }));
            setConfigurationMessage("");
          }}
          onSave={saveWeights}
          onClose={() => setConfigurationOpen(false)}
        />
      ) : null}

      <section className={styles.summaryStrip}>
        <div>
          <ClipboardList size={17} />
          <span>Eligible proposals</span>
          <strong>{summary.eligible}</strong>
        </div>
        <div>
          <Calculator size={17} />
          <span>Awaiting score</span>
          <strong>{summary.unscored}</strong>
        </div>
        <div>
          <BarChart3 size={17} />
          <span>In progress</span>
          <strong>{summary.inProgress}</strong>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Finalized · Avg {averageScore.toFixed(1)}</span>
          <strong>{summary.finalized}</strong>
        </div>
      </section>

      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search scoring workspace</span>
            <input
              type="search"
              value={search}
              placeholder="Search code, proposal, source, assessor, office, or barangay…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <WorkspaceSelect
            value={status}
            label="Scoring status filter"
            placeholder="All scoring statuses"
            options={SCORING_STATUSES}
            onChange={setStatus}
          />
          <WorkspaceSelect
            value={source}
            label="Proposal source filter"
            placeholder="All proposal sources"
            options={options.sources}
            onChange={setSource}
          />
          <WorkspaceSelect
            value={office}
            label="Office filter"
            placeholder="All offices"
            options={options.offices}
            onChange={setOffice}
          />
          <WorkspaceSelect
            value={barangay}
            label="Barangay filter"
            placeholder="All barangays"
            options={options.barangays}
            onChange={setBarangay}
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
                <h3>Eligible proposals</h3>
                <p>Technically cleared and recommended to advance to scoring.</p>
              </div>
              <strong>{filteredProjects.length} records</strong>
            </div>
            <ScoringQueue
              projects={filteredProjects}
              criteria={criteria}
              selectedId={selectedProject?.id}
              onSelect={selectProject}
            />
          </div>
          <ScoringPanel
            project={selectedProject}
            scoring={activeScoring}
            criteria={criteria}
            message={feedback.projectId === selectedProject?.id ? feedback.text : ""}
            onAssessorChange={(assessor) => updateScoring({ assessor })}
            onRatingChange={(criterionId, rating) => updateEntry(criterionId, { rating })}
            onRationaleChange={(criterionId, rationale) => updateEntry(criterionId, { rationale })}
            onNotesChange={(notes) => updateScoring({ notes })}
            onSave={() => saveScoring()}
            onFinalize={finalizeScoring}
          />
        </div>
      </section>
    </main>
  );
}
