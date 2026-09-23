"use client";

import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MapPin,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type {
  Project,
  TechnicalReview,
  TechnicalReviewCheckStatus,
  TechnicalReviewRecommendation,
  TechnicalReviewStatus,
} from "../types/project";
import { filterProjectsByScope, formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "./technical-review.module.css";

const TODAY = "2026-09-23";
const REVIEW_STATUSES: TechnicalReviewStatus[] = ["Pending", "In Review", "For Clarification", "Completed"];
const CHECK_STATUSES: TechnicalReviewCheckStatus[] = ["Not assessed", "Pass", "Concern"];
const RECOMMENDATIONS: TechnicalReviewRecommendation[] = [
  "Advance to Scoring",
  "Request Clarification",
  "Not Recommended",
];
const REVIEWERS = ["Unassigned", "Engr. Mara D. Reyes", "MPDC Carlo M. Fronda", "LGOO Ana P. Santos"];

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

function isOverdue(project: Project) {
  return project.technicalReview.status !== "Completed" && project.technicalReview.dueDate < TODAY;
}

function FilterSelect({
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

function ReviewBadge({ status }: { status: TechnicalReviewStatus }) {
  return <span className={`${styles.reviewBadge} ${styles[`review${status.replaceAll(" ", "")}`]}`}>{status}</span>;
}

function ReviewQueue({
  projects,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  selectedId?: string;
  onSelect: (project: Project) => void;
}) {
  if (!projects.length) {
    return (
      <div className={styles.emptyQueue}>
        <FileSearch size={23} />
        <h3>No technical reviews found</h3>
        <p>Adjust the current search or filters to see other review assignments.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableScroller}>
      <table className={styles.reviewTable}>
        <thead>
          <tr>
            <th>Proposal</th>
            <th>Review status</th>
            <th>Assigned reviewer</th>
            <th>Due date</th>
            <th>Readiness</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const selected = project.id === selectedId;
            const passedChecks = project.technicalReview.checks.filter((check) => check.status === "Pass").length;
            return (
              <tr className={selected ? styles.selectedRow : ""} key={project.id}>
                <td className={styles.proposalCell}>
                  <button type="button" onClick={() => onSelect(project)}>
                    <strong>{project.title}</strong>
                    <span>
                      {project.code} · {project.barangay ?? "Municipality-wide"}
                    </span>
                  </button>
                </td>
                <td>
                  <ReviewBadge status={project.technicalReview.status} />
                </td>
                <td className={styles.reviewerCell}>{project.technicalReview.reviewer}</td>
                <td>
                  <span className={isOverdue(project) ? styles.overdueDate : styles.dueDate}>
                    {formatShortDate(project.technicalReview.dueDate)}
                    {isOverdue(project) ? " · Overdue" : ""}
                  </span>
                </td>
                <td>
                  <span className={styles.checkProgress}>
                    <strong>
                      {passedChecks}/{project.technicalReview.checks.length}
                    </strong>{" "}
                    checks passed
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReviewPanel({
  project,
  review,
  message,
  onReviewerChange,
  onRecommendationChange,
  onCheckChange,
  onNotesChange,
  onSave,
  onComplete,
}: {
  project?: Project;
  review?: TechnicalReview;
  message: string;
  onReviewerChange: (value: string) => void;
  onRecommendationChange: (value: TechnicalReviewRecommendation) => void;
  onCheckChange: (id: string, value: TechnicalReviewCheckStatus) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onComplete: () => void;
}) {
  if (!project || !review) {
    return (
      <aside className={styles.reviewPanel}>
        <div className={styles.noSelection}>
          <ClipboardCheck size={25} />
          <h3>Select a proposal</h3>
          <p>Choose a record from the queue to open its technical review.</p>
        </div>
      </aside>
    );
  }

  const concerns = review.checks.filter((check) => check.status === "Concern").length;
  const assessed = review.checks.filter((check) => check.status !== "Not assessed").length;

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
        <Link href={`/projects/${project.id}`} aria-label={`Open ${project.title}`}>
          Full record <ArrowUpRight size={13} />
        </Link>
      </header>

      <div className={styles.quickFacts}>
        <div>
          <span>Proposed budget</span>
          <strong>{formatCompactCurrency(project.budget)}</strong>
        </div>
        <div>
          <span>Beneficiaries</span>
          <strong>{project.beneficiaries.toLocaleString("en-PH")}</strong>
        </div>
        <div>
          <span>Plan references</span>
          <strong>{project.planReferences.length}</strong>
        </div>
        <div>
          <span>Proposal complete</span>
          <strong>{project.proposalCompleteness}%</strong>
        </div>
      </div>

      {message ? (
        <div
          className={
            message.startsWith("Saved") || message.startsWith("Review") ? styles.successMessage : styles.errorMessage
          }
        >
          {message.startsWith("Saved") || message.startsWith("Review") ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {message}
        </div>
      ) : null}

      <section className={styles.assignmentSection}>
        <div className={styles.sectionHeading}>
          <div>
            <UserRoundCheck size={15} />
            <span>Review assignment</span>
          </div>
          <ReviewBadge status={review.status} />
        </div>
        <div className={styles.assignmentGrid}>
          <div className={styles.fieldLabel}>
            <span>Assigned reviewer</span>
            <Select value={review.reviewer} onValueChange={onReviewerChange}>
              <SelectTrigger className={styles.formSelect} aria-label="Assigned reviewer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVIEWERS.map((reviewer) => (
                  <SelectItem value={reviewer} key={reviewer}>
                    {reviewer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.dueFact}>
            <span>Review due</span>
            <strong className={isOverdue(project) ? styles.overdueText : ""}>{formatShortDate(review.dueDate)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.checklistSection}>
        <div className={styles.sectionHeading}>
          <div>
            <ClipboardCheck size={15} />
            <span>Technical checkpoints</span>
          </div>
          <small>
            {assessed}/{review.checks.length} assessed · {concerns} concerns
          </small>
        </div>
        <div className={styles.checklist}>
          {review.checks.map((check) => (
            <div className={styles.checkRow} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <small>{check.note || "Confirm evidence and record the assessment."}</small>
              </div>
              <Select
                value={check.status}
                onValueChange={(value) => onCheckChange(check.id, value as TechnicalReviewCheckStatus)}
              >
                <SelectTrigger
                  className={`${styles.checkSelect} ${styles[`check${check.status.replace(" ", "")}`]}`}
                  aria-label={`${check.label} status`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECK_STATUSES.map((status) => (
                    <SelectItem value={status} key={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.decisionSection}>
        <div className={styles.sectionHeading}>
          <div>
            <BadgeCheck size={15} />
            <span>Recommendation</span>
          </div>
        </div>
        <div className={styles.fieldLabel}>
          <span>Technical recommendation</span>
          <Select
            value={review.recommendation ?? "pending"}
            onValueChange={(value) => {
              if (value !== "pending") onRecommendationChange(value as TechnicalReviewRecommendation);
            }}
          >
            <SelectTrigger className={styles.formSelect} aria-label="Technical recommendation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Select recommendation</SelectItem>
              {RECOMMENDATIONS.map((recommendation) => (
                <SelectItem value={recommendation} key={recommendation}>
                  {recommendation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label>
          <span>Reviewer notes</span>
          <textarea
            rows={4}
            value={review.notes}
            placeholder="Summarize findings, concerns, and required follow-up…"
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </label>
      </section>

      <footer className={styles.panelActions}>
        <button className={styles.secondaryButton} type="button" onClick={onSave}>
          <Save size={14} /> Save review
        </button>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={review.status === "Completed"}
          onClick={onComplete}
        >
          {review.recommendation === "Request Clarification" ? <RotateCcw size={14} /> : <BadgeCheck size={14} />}
          {review.status === "Completed"
            ? "Review completed"
            : review.recommendation === "Request Clarification"
              ? "Request clarification"
              : "Complete review"}
        </button>
      </footer>
    </aside>
  );
}

export function TechnicalReviewView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const saveTechnicalReview = useProjectRegistryStore((state) => state.saveTechnicalReview);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [office, setOffice] = useState("all");
  const [barangay, setBarangay] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState("");
  const [draft, setDraft] = useState<TechnicalReview>();
  const [message, setMessage] = useState({ projectId: "", text: "" });
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const reviewProjects = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction).filter(
        (project) => project.pipelineStatus === "Under Review",
      ),
    [projects, fiscalYear, jurisdiction],
  );
  const options = useMemo(
    () => ({
      offices: unique(reviewProjects.map((project) => project.implementingDepartment)),
      barangays: unique(reviewProjects.map((project) => project.barangay ?? "Municipality-wide")),
      projectTypes: unique(reviewProjects.map((project) => project.projectType)),
    }),
    [reviewProjects],
  );
  const filteredProjects = useMemo(
    () =>
      reviewProjects
        .filter((project) => {
          if (deferredSearch) {
            const haystack = [
              project.code,
              project.title,
              project.implementingDepartment,
              project.technicalReview.reviewer,
              project.barangay ?? "Municipality-wide",
            ]
              .join(" ")
              .toLocaleLowerCase();
            if (!haystack.includes(deferredSearch)) return false;
          }
          if (status !== "all" && project.technicalReview.status !== status) return false;
          if (office !== "all" && project.implementingDepartment !== office) return false;
          if (barangay !== "all" && (project.barangay ?? "Municipality-wide") !== barangay) return false;
          if (projectType !== "all" && project.projectType !== projectType) return false;
          return true;
        })
        .toSorted((a, b) => {
          if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
          return a.technicalReview.dueDate.localeCompare(b.technicalReview.dueDate);
        }),
    [reviewProjects, deferredSearch, status, office, barangay, projectType],
  );
  const selectedProject = filteredProjects.find((project) => project.id === selectedId) ?? filteredProjects[0];
  const activeReview = selectedProject
    ? draftProjectId === selectedProject.id && draft
      ? draft
      : selectedProject.technicalReview
    : undefined;
  const hasFilters = Boolean(
    search || status !== "all" || office !== "all" || barangay !== "all" || projectType !== "all",
  );

  const selectProject = (project: Project) => {
    setSelectedId(project.id);
    setDraftProjectId(project.id);
    setDraft(structuredClone(project.technicalReview));
    setMessage({ projectId: "", text: "" });
  };
  const updateReview = (changes: Partial<TechnicalReview>) => {
    if (!selectedProject || !activeReview) return;
    setDraftProjectId(selectedProject.id);
    setDraft({ ...activeReview, ...changes });
    setMessage({ projectId: "", text: "" });
  };
  const saveReview = (review = activeReview) => {
    if (!selectedProject || !review) return;
    setSelectedId(selectedProject.id);
    const updated = saveTechnicalReview(selectedProject.id, review);
    if (updated) {
      setDraftProjectId(selectedProject.id);
      setDraft(structuredClone(updated.technicalReview));
      setMessage({ projectId: selectedProject.id, text: "Saved technical review changes." });
    }
  };
  const completeReview = () => {
    if (!activeReview) return;
    if (!selectedProject) return;
    if (activeReview.reviewer === "Unassigned")
      return setMessage({
        projectId: selectedProject.id,
        text: "Assign a reviewer before completing the assessment.",
      });
    if (activeReview.checks.some((check) => check.status === "Not assessed"))
      return setMessage({
        projectId: selectedProject.id,
        text: "Assess every technical checkpoint before continuing.",
      });
    if (!activeReview.recommendation)
      return setMessage({
        projectId: selectedProject.id,
        text: "Select a technical recommendation before continuing.",
      });
    if (
      activeReview.recommendation === "Advance to Scoring" &&
      activeReview.checks.some((check) => check.status === "Concern")
    ) {
      return setMessage({
        projectId: selectedProject.id,
        text: "Resolve checkpoint concerns before advancing this proposal to scoring.",
      });
    }
    const requestingClarification = activeReview.recommendation === "Request Clarification";
    const completedReview: TechnicalReview = {
      ...activeReview,
      status: requestingClarification ? "For Clarification" : "Completed",
      completedAt: requestingClarification ? null : TODAY,
    };
    saveReview(completedReview);
    setMessage({
      projectId: selectedProject.id,
      text: requestingClarification
        ? "Review returned for clarification."
        : "Review completed and cleared for the next pipeline phase.",
    });
  };
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setOffice("all");
    setBarangay("all");
    setProjectType("all");
  };
  const summary = {
    pending: filteredProjects.filter((project) => ["Pending", "In Review"].includes(project.technicalReview.status))
      .length,
    overdue: filteredProjects.filter(isOverdue).length,
    clarification: filteredProjects.filter((project) => project.technicalReview.status === "For Clarification").length,
    completed: filteredProjects.filter((project) => project.technicalReview.status === "Completed").length,
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Pre-scoring validation</span>
          </div>
          <h2>Technical review</h2>
          <p>Validate feasibility, plan linkage, readiness, and fund eligibility before proposals enter scoring.</p>
        </div>
        <div className={styles.headerNote}>
          <ShieldAlert size={15} />
          <span>Reviews are decision support and require an assigned municipal reviewer.</span>
        </div>
      </header>

      <section className={styles.summaryStrip}>
        <div>
          <ClipboardCheck size={17} />
          <span>Pending review</span>
          <strong>{summary.pending}</strong>
        </div>
        <div>
          <CalendarClock size={17} />
          <span>Due or overdue</span>
          <strong>{summary.overdue}</strong>
        </div>
        <div>
          <AlertCircle size={17} />
          <span>Clarification needed</span>
          <strong>{summary.clarification}</strong>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Technically cleared</span>
          <strong>{summary.completed}</strong>
        </div>
      </section>

      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search technical reviews</span>
            <input
              type="search"
              value={search}
              placeholder="Search code, proposal, reviewer, office, or barangay…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <FilterSelect
            value={status}
            label="Review status filter"
            placeholder="All review statuses"
            options={REVIEW_STATUSES}
            onChange={setStatus}
          />
          <FilterSelect
            value={office}
            label="Office filter"
            placeholder="All offices"
            options={options.offices}
            onChange={setOffice}
          />
          <FilterSelect
            value={barangay}
            label="Barangay filter"
            placeholder="All barangays"
            options={options.barangays}
            onChange={setBarangay}
          />
          <FilterSelect
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
                <h3>Review queue</h3>
                <p>Ordered by overdue status and nearest due date.</p>
              </div>
              <strong>{filteredProjects.length} records</strong>
            </div>
            <ReviewQueue projects={filteredProjects} selectedId={selectedProject?.id} onSelect={selectProject} />
          </div>
          <ReviewPanel
            project={selectedProject}
            review={activeReview}
            message={message.projectId === selectedProject?.id ? message.text : ""}
            onReviewerChange={(reviewer) =>
              updateReview({
                reviewer,
                status:
                  activeReview?.status === "Pending" && reviewer !== "Unassigned" ? "In Review" : activeReview?.status,
              })
            }
            onRecommendationChange={(recommendation) => updateReview({ recommendation })}
            onCheckChange={(id, value) =>
              updateReview({
                checks: activeReview?.checks.map((check) => (check.id === id ? { ...check, status: value } : check)),
              })
            }
            onNotesChange={(notes) => updateReview({ notes })}
            onSave={() => saveReview()}
            onComplete={completeReview}
          />
        </div>
      </section>
    </main>
  );
}
