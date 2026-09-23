"use client";

import { Banknote, CheckCircle2, CirclePause, ListOrdered, Search, Send } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { useShellStore } from "@/stores/shell-store";

import {
  COMMITTEE_DECISIONS,
  decisionLabel,
  RankingDecisionPanel,
  RankingFilterSelect,
  RankingTable,
} from "../components/priority-ranking-workspace";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { PriorityRankingRecord, Project } from "../types/project";
import { filterProjectsByScope, formatCompactCurrency } from "../utils/project-utils";
import { getWeightedScore } from "../utils/scoring-utils";
import styles from "./priority-ranking.module.css";

const TODAY = "2026-09-23";

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

export function PriorityRankingView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const criteria = useProjectRegistryStore((state) => state.scoringCriteria);
  const savePriorityDecision = useProjectRegistryStore((state) => state.savePriorityDecision);
  const publishPriorityRanking = useProjectRegistryStore((state) => state.publishPriorityRanking);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("all");
  const [source, setSource] = useState("all");
  const [office, setOffice] = useState("all");
  const [barangay, setBarangay] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState("");
  const [draft, setDraft] = useState<PriorityRankingRecord>();
  const [feedback, setFeedback] = useState({ projectId: "", text: "" });
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const rankingProjects = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction)
        .filter(
          (project) =>
            project.scoring.status === "Finalized" &&
            (project.pipelineStatus === "Under Review" || project.pipelineStatus === "Prioritized"),
        )
        .toSorted((a, b) => {
          const scoreDifference = getWeightedScore(b.scoring, criteria) - getWeightedScore(a.scoring, criteria);
          if (scoreDifference) return scoreDifference;
          if (b.beneficiaries !== a.beneficiaries) return b.beneficiaries - a.beneficiaries;
          return a.code.localeCompare(b.code);
        }),
    [projects, fiscalYear, jurisdiction, criteria],
  );
  const options = useMemo(
    () => ({
      sources: unique(rankingProjects.map((project) => project.proposalSource)),
      offices: unique(rankingProjects.map((project) => project.implementingDepartment)),
      barangays: unique(rankingProjects.map((project) => project.barangay ?? "Municipality-wide")),
      projectTypes: unique(rankingProjects.map((project) => project.projectType)),
    }),
    [rankingProjects],
  );
  const filteredProjects = useMemo(
    () =>
      rankingProjects.filter((project) => {
        if (deferredSearch) {
          const haystack = [
            project.code,
            project.title,
            project.proposalSource,
            project.implementingDepartment,
            project.barangay ?? "Municipality-wide",
          ]
            .join(" ")
            .toLocaleLowerCase();
          if (!haystack.includes(deferredSearch)) return false;
        }
        if (decision !== "all" && decisionLabel(project) !== decision) return false;
        if (source !== "all" && project.proposalSource !== source) return false;
        if (office !== "all" && project.implementingDepartment !== office) return false;
        if (barangay !== "all" && (project.barangay ?? "Municipality-wide") !== barangay) return false;
        if (projectType !== "all" && project.projectType !== projectType) return false;
        return true;
      }),
    [rankingProjects, deferredSearch, decision, source, office, barangay, projectType],
  );
  const selectedProject = filteredProjects.find((project) => project.id === selectedId) ?? filteredProjects[0];
  const activeRecord = selectedProject
    ? selectedProject.priorityRanking.publishedAt
      ? selectedProject.priorityRanking
      : draftProjectId === selectedProject.id && draft
        ? draft
        : selectedProject.priorityRanking
    : undefined;
  const selectedRank = selectedProject
    ? rankingProjects.findIndex((project) => project.id === selectedProject.id) + 1
    : 0;
  const hasFilters = Boolean(
    search || decision !== "all" || source !== "all" || office !== "all" || barangay !== "all" || projectType !== "all",
  );
  const publishable = rankingProjects.filter(
    (project) =>
      project.pipelineStatus === "Under Review" &&
      !project.priorityRanking.publishedAt &&
      project.priorityRanking.decision === "Recommended",
  );

  const selectProject = (project: Project) => {
    setSelectedId(project.id);
    setDraftProjectId(project.id);
    setDraft(structuredClone(project.priorityRanking));
    setFeedback({ projectId: "", text: "" });
  };
  const updateRecord = (changes: Partial<PriorityRankingRecord>) => {
    if (!selectedProject || !activeRecord) return;
    setDraftProjectId(selectedProject.id);
    setDraft({ ...activeRecord, ...changes });
    setFeedback({ projectId: "", text: "" });
  };
  const saveDecision = () => {
    if (!selectedProject || !activeRecord) return;
    if (activeRecord.decision !== "Pending Deliberation" && activeRecord.decidedBy === "Unassigned") {
      return setFeedback({
        projectId: selectedProject.id,
        text: "Select the committee or office responsible for this decision.",
      });
    }
    if (activeRecord.decision !== "Pending Deliberation" && !activeRecord.committeeNote.trim()) {
      return setFeedback({
        projectId: selectedProject.id,
        text: "Document the committee basis before saving this decision.",
      });
    }
    const savedRecord: PriorityRankingRecord = {
      ...activeRecord,
      decidedAt: activeRecord.decision === "Pending Deliberation" ? null : TODAY,
    };
    setSelectedId(selectedProject.id);
    const updated = savePriorityDecision(selectedProject.id, savedRecord);
    if (!updated) return;
    setDraftProjectId(selectedProject.id);
    setDraft(structuredClone(updated.priorityRanking));
    setFeedback({ projectId: selectedProject.id, text: "Saved committee ranking decision." });
  };
  const confirmPublish = () => {
    const published = publishPriorityRanking(publishable.map((project) => project.id));
    setPublishConfirm(false);
    setPublishMessage(
      published
        ? `${published} recommended ${published === 1 ? "project was" : "projects were"} published to the priority list.`
        : "No unpublished recommendations are ready.",
    );
  };
  const clearFilters = () => {
    setSearch("");
    setDecision("all");
    setSource("all");
    setOffice("all");
    setBarangay("all");
    setProjectType("all");
  };

  const totalValue = filteredProjects.reduce((sum, project) => sum + project.budget, 0);
  const summary = {
    ranked: filteredProjects.length,
    recommended: filteredProjects.filter((project) => project.priorityRanking.decision === "Recommended").length,
    held: filteredProjects.filter((project) => project.priorityRanking.decision === "On Hold").length,
    deferred: filteredProjects.filter((project) => project.priorityRanking.decision === "Deferred").length,
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Municipal investment ranking</span>
          </div>
          <h2>Priority ranking</h2>
          <p>
            Compare finalized scores, document committee decisions, and publish recommended projects to the priority
            list.
          </p>
        </div>
        <button
          className={styles.publishButton}
          type="button"
          disabled={!publishable.length}
          onClick={() => setPublishConfirm(true)}
        >
          <Send size={15} /> Publish ranking <span>{publishable.length}</span>
        </button>
      </header>

      {publishConfirm ? (
        <section className={styles.confirmBanner}>
          <div>
            <strong>
              Publish {publishable.length} recommended {publishable.length === 1 ? "project" : "projects"}?
            </strong>
            <p>This moves them to Prioritized and records the action. Funding remains a separate phase.</p>
          </div>
          <div>
            <button type="button" onClick={() => setPublishConfirm(false)}>
              Cancel
            </button>
            <button type="button" onClick={confirmPublish}>
              <Send size={13} /> Confirm publication
            </button>
          </div>
        </section>
      ) : null}
      {publishMessage ? (
        <div className={styles.publishMessage}>
          <CheckCircle2 size={14} /> {publishMessage}
        </div>
      ) : null}

      <section className={styles.summaryStrip}>
        <div>
          <ListOrdered size={17} />
          <span>Ranked projects</span>
          <strong>{summary.ranked}</strong>
        </div>
        <div>
          <Banknote size={17} />
          <span>Total proposed value</span>
          <strong>{formatCompactCurrency(totalValue)}</strong>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Recommended</span>
          <strong>{summary.recommended}</strong>
        </div>
        <div>
          <CirclePause size={17} />
          <span>Held / Deferred</span>
          <strong>{summary.held + summary.deferred}</strong>
        </div>
      </section>

      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search priority ranking</span>
            <input
              type="search"
              value={search}
              placeholder="Search code, project, source, office, or barangay…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <RankingFilterSelect
            value={decision}
            label="Committee decision filter"
            placeholder="All decisions"
            options={["Published", ...COMMITTEE_DECISIONS]}
            onChange={setDecision}
          />
          <RankingFilterSelect
            value={source}
            label="Proposal source filter"
            placeholder="All proposal sources"
            options={options.sources}
            onChange={setSource}
          />
          <RankingFilterSelect
            value={office}
            label="Office filter"
            placeholder="All offices"
            options={options.offices}
            onChange={setOffice}
          />
          <RankingFilterSelect
            value={barangay}
            label="Barangay filter"
            placeholder="All barangays"
            options={options.barangays}
            onChange={setBarangay}
          />
          <RankingFilterSelect
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
                <h3>Ranked comparison</h3>
                <p>Score descending · beneficiaries · project code tie-breaker</p>
              </div>
              <strong>{filteredProjects.length} records</strong>
            </div>
            <RankingTable
              projects={filteredProjects}
              criteria={criteria}
              selectedId={selectedProject?.id}
              onSelect={selectProject}
            />
          </div>
          <RankingDecisionPanel
            project={selectedProject}
            rank={selectedRank}
            record={activeRecord}
            criteria={criteria}
            message={feedback.projectId === selectedProject?.id ? feedback.text : ""}
            onDecisionChange={(nextDecision) => updateRecord({ decision: nextDecision })}
            onDecidedByChange={(decidedBy) => updateRecord({ decidedBy })}
            onNoteChange={(committeeNote) => updateRecord({ committeeNote })}
            onSave={saveDecision}
          />
        </div>
      </section>
    </main>
  );
}
