"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Landmark,
  MapPin,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { FundingHandoffRecord, FundingHandoffStatus, Project } from "../types/project";
import { filterProjectsByScope, formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import { getWeightedScore } from "../utils/scoring-utils";
import styles from "./prioritized-portfolio.module.css";

const TODAY = "2026-09-23";
const HANDOFF_STATUSES: FundingHandoffStatus[] = [
  "Not Started",
  "For Fund Validation",
  "Ready for Funding Review",
  "Returned for Portfolio Review",
];
const ASSIGNED_OFFICES = [
  "Unassigned",
  "Municipal Budget Office",
  "Local Finance Committee",
  "Municipal Treasurer's Office",
];
const REVIEW_OFFICERS = [
  "Unassigned",
  "Municipal Planning and Development Office",
  "Municipal Budget Office",
  "Local Finance Committee Secretariat",
];

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

function PortfolioSelect({
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

function HandoffBadge({ status }: { status: FundingHandoffStatus }) {
  return <span className={`${styles.statusBadge} ${styles[`status${status.replaceAll(" ", "")}`]}`}>{status}</span>;
}

function isDuplicateCleared(project: Project) {
  return (
    project.duplicateReview.status === "Cleared" ||
    project.duplicateReview.outcome === "No Conflict" ||
    project.duplicateReview.outcome === "Related - Coordinate"
  );
}

export function PrioritizedPortfolioView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const criteria = useProjectRegistryStore((state) => state.scoringCriteria);
  const saveFundingHandoff = useProjectRegistryStore((state) => state.saveFundingHandoff);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [handoffStatus, setHandoffStatus] = useState("all");
  const [duplicateStatus, setDuplicateStatus] = useState("all");
  const [fundSource, setFundSource] = useState("all");
  const [office, setOffice] = useState("all");
  const [barangay, setBarangay] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState("");
  const [draft, setDraft] = useState<FundingHandoffRecord>();
  const [feedback, setFeedback] = useState({ projectId: "", text: "", success: false });
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const portfolio = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction)
        .filter((project) => project.pipelineStatus === "Prioritized")
        .toSorted((a, b) => {
          const rankDifference = a.priorityRank - b.priorityRank;
          return rankDifference || getWeightedScore(b.scoring, criteria) - getWeightedScore(a.scoring, criteria);
        }),
    [projects, fiscalYear, jurisdiction, criteria],
  );
  const options = useMemo(
    () => ({
      funds: unique(portfolio.flatMap((project) => project.funding.map((allocation) => allocation.source))),
      offices: unique(portfolio.map((project) => project.implementingDepartment)),
      barangays: unique(portfolio.map((project) => project.barangay ?? "Municipality-wide")),
      projectTypes: unique(portfolio.map((project) => project.projectType)),
    }),
    [portfolio],
  );
  const filteredProjects = useMemo(
    () =>
      portfolio.filter((project) => {
        const duplicateLabel = isDuplicateCleared(project) ? "Cleared" : "Action required";
        if (deferredSearch) {
          const haystack = [
            project.code,
            project.title,
            project.implementingDepartment,
            project.barangay,
            ...project.planReferences,
          ]
            .join(" ")
            .toLocaleLowerCase();
          if (!haystack.includes(deferredSearch)) return false;
        }
        if (handoffStatus !== "all" && project.fundingHandoff.status !== handoffStatus) return false;
        if (duplicateStatus !== "all" && duplicateLabel !== duplicateStatus) return false;
        if (fundSource !== "all" && !project.funding.some((allocation) => allocation.source === fundSource))
          return false;
        if (office !== "all" && project.implementingDepartment !== office) return false;
        if (barangay !== "all" && (project.barangay ?? "Municipality-wide") !== barangay) return false;
        if (projectType !== "all" && project.projectType !== projectType) return false;
        return true;
      }),
    [portfolio, deferredSearch, handoffStatus, duplicateStatus, fundSource, office, barangay, projectType],
  );
  const selectedProject = filteredProjects.find((project) => project.id === selectedId) ?? filteredProjects[0];
  const activeRecord = selectedProject
    ? draftProjectId === selectedProject.id && draft
      ? draft
      : selectedProject.fundingHandoff
    : undefined;
  const selectedRank = selectedProject ? portfolio.findIndex((project) => project.id === selectedProject.id) + 1 : 0;
  const hasFilters = Boolean(
    search ||
      handoffStatus !== "all" ||
      duplicateStatus !== "all" ||
      fundSource !== "all" ||
      office !== "all" ||
      barangay !== "all" ||
      projectType !== "all",
  );
  const totalValue = filteredProjects.reduce((sum, project) => sum + project.budget, 0);
  const summary = {
    projects: filteredProjects.length,
    ready: filteredProjects.filter((project) => project.fundingHandoff.status === "Ready for Funding Review").length,
    blockers: filteredProjects.filter((project) => !isDuplicateCleared(project)).length,
  };

  const selectProject = (project: Project) => {
    setSelectedId(project.id);
    setDraftProjectId(project.id);
    setDraft(structuredClone(project.fundingHandoff));
    setFeedback({ projectId: "", text: "", success: false });
  };
  const updateDraft = (changes: Partial<FundingHandoffRecord>) => {
    if (!selectedProject || !activeRecord) return;
    setDraftProjectId(selectedProject.id);
    setDraft({ ...activeRecord, ...changes });
    setFeedback({ projectId: "", text: "", success: false });
  };
  const saveHandoff = () => {
    if (!selectedProject || !activeRecord) return;
    if (activeRecord.status === "Ready for Funding Review" && !isDuplicateCleared(selectedProject)) {
      return setFeedback({
        projectId: selectedProject.id,
        text: "Resolve the duplicate review before marking this project ready.",
        success: false,
      });
    }
    if (activeRecord.status !== "Not Started" && activeRecord.assignedOffice === "Unassigned") {
      return setFeedback({
        projectId: selectedProject.id,
        text: "Assign the office responsible for the funding review.",
        success: false,
      });
    }
    if (activeRecord.updatedBy === "Unassigned") {
      return setFeedback({
        projectId: selectedProject.id,
        text: "Select the officer or office recording this handoff.",
        success: false,
      });
    }
    if (activeRecord.status !== "Not Started" && !activeRecord.note.trim()) {
      return setFeedback({
        projectId: selectedProject.id,
        text: "Document the funding-planning handoff before saving.",
        success: false,
      });
    }
    const record = { ...activeRecord, updatedAt: TODAY };
    const updated = saveFundingHandoff(selectedProject.id, record);
    if (!updated) return;
    setDraftProjectId(updated.id);
    setDraft(structuredClone(updated.fundingHandoff));
    setFeedback({
      projectId: updated.id,
      text: "Funding-planning handoff saved to the activity trail.",
      success: true,
    });
  };
  const clearFilters = () => {
    setSearch("");
    setHandoffStatus("all");
    setDuplicateStatus("all");
    setFundSource("all");
    setOffice("all");
    setBarangay("all");
    setProjectType("all");
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Approved priority portfolio</span>
          </div>
          <h2>Prioritized projects</h2>
          <p>
            Review the published municipal priority list, clear portfolio controls, and prepare qualified projects for
            funding planning.
          </p>
        </div>
        <div className={styles.stageBadge}>
          <Landmark size={16} />
          <span>Next control</span>
          <strong>Funding planning</strong>
        </div>
      </header>

      <section className={styles.summaryStrip}>
        <div>
          <ClipboardCheck size={17} />
          <span>Prioritized projects</span>
          <strong>{summary.projects}</strong>
        </div>
        <div>
          <Banknote size={17} />
          <span>Portfolio value</span>
          <strong>{formatCompactCurrency(totalValue)}</strong>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Ready for funding</span>
          <strong>{summary.ready}</strong>
        </div>
        <div>
          <AlertCircle size={17} />
          <span>Review blockers</span>
          <strong>{summary.blockers}</strong>
        </div>
      </section>

      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search prioritized projects</span>
            <input
              type="search"
              value={search}
              placeholder="Search project, code, office, barangay, or plan…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <PortfolioSelect
            value={handoffStatus}
            label="Funding readiness filter"
            placeholder="All readiness statuses"
            options={HANDOFF_STATUSES}
            onChange={setHandoffStatus}
          />
          <PortfolioSelect
            value={duplicateStatus}
            label="Duplicate review filter"
            placeholder="All duplicate reviews"
            options={["Cleared", "Action required"]}
            onChange={setDuplicateStatus}
          />
          <PortfolioSelect
            value={fundSource}
            label="Fund source filter"
            placeholder="All fund sources"
            options={options.funds}
            onChange={setFundSource}
          />
          <PortfolioSelect
            value={office}
            label="Implementing office filter"
            placeholder="All offices"
            options={options.offices}
            onChange={setOffice}
          />
          <PortfolioSelect
            value={barangay}
            label="Barangay filter"
            placeholder="All barangays"
            options={options.barangays}
            onChange={setBarangay}
          />
          <PortfolioSelect
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
                <h3>Priority portfolio</h3>
                <p>Published rank · weighted score · project code</p>
              </div>
              <strong>{filteredProjects.length} records</strong>
            </div>
            {!filteredProjects.length ? (
              <div className={styles.emptyQueue}>
                <FileSearch size={24} />
                <h3>No prioritized projects found</h3>
                <p>Adjust the portfolio filters or publish recommended projects from Priority Ranking.</p>
              </div>
            ) : (
              <div className={styles.tableScroller}>
                <table className={styles.portfolioTable}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Project</th>
                      <th>Score</th>
                      <th>Budget</th>
                      <th>Controls</th>
                      <th>Funding readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className={project.id === selectedProject?.id ? styles.selectedRow : ""}>
                        <td>
                          <span className={styles.rankPill}>
                            #{portfolio.findIndex((item) => item.id === project.id) + 1}
                          </span>
                        </td>
                        <td className={styles.projectCell}>
                          <button type="button" onClick={() => selectProject(project)}>
                            <strong>{project.title}</strong>
                            <span>
                              {project.code} · {project.barangay ?? "Municipality-wide"}
                            </span>
                            <small>{project.implementingDepartment}</small>
                          </button>
                        </td>
                        <td className={styles.scoreCell}>
                          <strong>{getWeightedScore(project.scoring, criteria).toFixed(1)}</strong>
                          <span>/100</span>
                        </td>
                        <td className={styles.moneyCell}>
                          {formatCompactCurrency(project.budget)}
                          <small>{project.funding[0]?.source}</small>
                        </td>
                        <td>
                          <span className={isDuplicateCleared(project) ? styles.controlClear : styles.controlBlocked}>
                            {isDuplicateCleared(project) ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                            {isDuplicateCleared(project) ? "Cleared" : "Action required"}
                          </span>
                        </td>
                        <td>
                          <HandoffBadge status={project.fundingHandoff.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className={styles.detailPanel}>
            {!selectedProject || !activeRecord ? (
              <div className={styles.noSelection}>
                <Landmark size={26} />
                <h3>Select a prioritized project</h3>
                <p>Choose a project to review its readiness and prepare the funding-planning handoff.</p>
              </div>
            ) : (
              <>
                <header className={styles.panelHeader}>
                  <div>
                    <span>{selectedProject.code}</span>
                    <h3>{selectedProject.title}</h3>
                    <p>
                      <MapPin size={12} /> {selectedProject.location}
                    </p>
                  </div>
                  <Link href={`/projects/${selectedProject.id}`}>
                    Full record <ArrowUpRight size={13} />
                  </Link>
                </header>
                <section className={styles.rankHero}>
                  <div>
                    <span>Published rank</span>
                    <strong>#{selectedRank}</strong>
                  </div>
                  <div>
                    <span>Weighted score</span>
                    <strong>
                      {getWeightedScore(selectedProject.scoring, criteria).toFixed(1)}
                      <small>/100</small>
                    </strong>
                  </div>
                  <HandoffBadge status={activeRecord.status} />
                </section>
                {feedback.projectId === selectedProject.id ? (
                  <div className={feedback.success ? styles.successMessage : styles.errorMessage}>
                    {feedback.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {feedback.text}
                  </div>
                ) : null}
                {!isDuplicateCleared(selectedProject) ? (
                  <div className={styles.blockerCallout}>
                    <AlertCircle size={15} />
                    <div>
                      <strong>Duplicate review blocks final handoff</strong>
                      <p>Resolve the suspected overlap before selecting Ready for Funding Review.</p>
                    </div>
                  </div>
                ) : null}
                <section className={styles.factGrid}>
                  <div>
                    <Banknote size={13} />
                    <span>Proposed budget</span>
                    <strong>{formatCompactCurrency(selectedProject.budget)}</strong>
                  </div>
                  <div>
                    <ClipboardCheck size={13} />
                    <span>Plan references</span>
                    <strong>{selectedProject.planReferences.length}</strong>
                  </div>
                  <div>
                    <ShieldCheck size={13} />
                    <span>Duplicate review</span>
                    <strong>{selectedProject.duplicateReview.status}</strong>
                  </div>
                  <div>
                    <Landmark size={13} />
                    <span>Funding sources</span>
                    <strong>{selectedProject.funding.length}</strong>
                  </div>
                </section>
                <section className={styles.evidenceSection}>
                  <div className={styles.sectionHeading}>
                    <strong>Portfolio evidence</strong>
                    <span>
                      Published{" "}
                      {selectedProject.priorityRanking.publishedAt
                        ? formatShortDate(selectedProject.priorityRanking.publishedAt)
                        : "—"}
                    </span>
                  </div>
                  <dl>
                    <div>
                      <dt>Priority decision</dt>
                      <dd>{selectedProject.priorityRanking.decision}</dd>
                    </div>
                    <div>
                      <dt>Committee basis</dt>
                      <dd>{selectedProject.priorityRanking.committeeNote || "No committee note recorded."}</dd>
                    </div>
                    <div>
                      <dt>Plan linkage</dt>
                      <dd>{selectedProject.planReferences.join(" · ")}</dd>
                    </div>
                    <div>
                      <dt>Duplicate outcome</dt>
                      <dd>{selectedProject.duplicateReview.outcome}</dd>
                    </div>
                  </dl>
                </section>
                <section className={styles.handoffSection}>
                  <div className={styles.sectionHeading}>
                    <strong>Funding-planning handoff</strong>
                    <span>
                      {activeRecord.updatedAt
                        ? `Updated ${formatShortDate(activeRecord.updatedAt)}`
                        : "Not yet recorded"}
                    </span>
                  </div>
                  <div className={styles.fieldGrid}>
                    <div>
                      <span>Status</span>
                      <Select
                        value={activeRecord.status}
                        onValueChange={(value) => updateDraft({ status: value as FundingHandoffStatus })}
                      >
                        <SelectTrigger className={styles.formSelect} aria-label="Funding handoff status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HANDOFF_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <span>Assigned office</span>
                      <Select
                        value={activeRecord.assignedOffice}
                        onValueChange={(assignedOffice) => updateDraft({ assignedOffice })}
                      >
                        <SelectTrigger className={styles.formSelect} aria-label="Assigned funding office">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNED_OFFICES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <span>Recorded by</span>
                      <Select value={activeRecord.updatedBy} onValueChange={(updatedBy) => updateDraft({ updatedBy })}>
                        <SelectTrigger className={styles.formSelect} aria-label="Handoff recorded by">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REVIEW_OFFICERS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <label className={styles.noteField}>
                    <span>Handoff note</span>
                    <textarea
                      rows={4}
                      value={activeRecord.note}
                      placeholder="Document fiscal validation requirements, source considerations, or return instructions…"
                      onChange={(event) => updateDraft({ note: event.target.value })}
                    />
                  </label>
                  <button className={styles.saveButton} type="button" onClick={saveHandoff}>
                    <Save size={14} /> Save funding handoff
                  </button>
                  <p className={styles.disclaimer}>
                    This records portfolio readiness only. It does not assign an appropriation or change the project to
                    Funded.
                  </p>
                </section>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
