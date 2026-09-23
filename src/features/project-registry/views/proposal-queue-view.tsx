"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileEdit,
  Inbox,
  Plus,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { Project, ProjectPipelineStatus } from "../types/project";
import { filterProjectsByScope, formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "./proposal-queue.module.css";

type QueueMode = "drafts" | "submitted";

const QUEUE_CONFIG: Record<
  QueueMode,
  {
    status: ProjectPipelineStatus;
    title: string;
    description: string;
    eyebrow: string;
    actionLabel: string;
    nextStatus: ProjectPipelineStatus;
  }
> = {
  drafts: {
    status: "Draft",
    title: "Draft proposals",
    description: "Complete, review, and submit proposals that have not yet entered the municipal review queue.",
    eyebrow: "Proposal preparation",
    actionLabel: "Submit for review",
    nextStatus: "Submitted",
  },
  submitted: {
    status: "Submitted",
    title: "Submitted proposals",
    description: "Triage newly submitted proposals and move complete records into technical review.",
    eyebrow: "Review intake",
    actionLabel: "Start review",
    nextStatus: "Under Review",
  },
};

const TODAY = new Date("2026-09-23T00:00:00Z");

function daysSince(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Math.max(0, Math.round((TODAY.getTime() - date.getTime()) / 86_400_000));
}

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

function QueueSelect({
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

function Completeness({ value }: { value: number }) {
  return (
    <div className={styles.completeness}>
      <span>
        <strong>{value}%</strong>
        {value >= 85 ? "Ready" : value >= 70 ? "Needs review" : "Incomplete"}
      </span>
      <i>
        <b style={{ width: `${value}%` }} />
      </i>
    </div>
  );
}

function ProposalRows({
  projects,
  mode,
  onTransition,
}: {
  projects: Project[];
  mode: QueueMode;
  onTransition: (project: Project) => void;
}) {
  const config = QUEUE_CONFIG[mode];
  return (
    <div className={styles.tableScroller}>
      <table className={styles.queueTable}>
        <thead>
          <tr>
            <th>Proposal</th>
            <th>Source and scope</th>
            <th>{mode === "drafts" ? "Requesting office" : "Implementing office"}</th>
            {mode === "drafts" ? <th>Completeness</th> : null}
            <th>Proposed budget</th>
            <th>{mode === "drafts" ? "Last updated" : "Submitted"}</th>
            {mode === "submitted" ? <th>Waiting time</th> : null}
            <th>
              <span className={styles.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const age = daysSince(project.lastUpdated);
            return (
              <tr key={project.id}>
                <td className={styles.proposalCell}>
                  <Link href={`/projects/${project.id}`}>
                    <strong>{project.title}</strong>
                    <span>
                      {project.code}
                      {project.emergency ? " · Emergency" : ""}
                    </span>
                  </Link>
                </td>
                <td>
                  <strong className={styles.cellStrong}>{project.proposalSource}</strong>
                  <small>{project.barangay ?? "Municipality-wide"}</small>
                </td>
                <td className={styles.officeCell}>
                  {mode === "drafts" ? project.requestingOffice : project.implementingDepartment}
                  <small>{project.leadOfficer}</small>
                </td>
                {mode === "drafts" ? (
                  <td>
                    <Completeness value={project.proposalCompleteness} />
                  </td>
                ) : null}
                <td className={styles.moneyCell}>
                  {formatCompactCurrency(project.budget)}
                  <small>{project.funding[0]?.source}</small>
                </td>
                <td>{formatShortDate(project.lastUpdated)}</td>
                {mode === "submitted" ? (
                  <td>
                    <span className={`${styles.ageBadge} ${age >= 10 ? styles.ageUrgent : ""}`}>
                      {age} {age === 1 ? "day" : "days"}
                    </span>
                  </td>
                ) : null}
                <td className={styles.actionsCell}>
                  <button type="button" onClick={() => onTransition(project)}>
                    {mode === "drafts" ? <Send size={13} /> : <FileCheck2 size={13} />}
                    {config.actionLabel}
                  </button>
                  <Link href={`/projects/${project.id}`} aria-label={`Open ${project.title}`}>
                    <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProposalQueueView({ mode }: { mode: QueueMode }) {
  const config = QUEUE_CONFIG[mode];
  const projects = useProjectRegistryStore((state) => state.projects);
  const transitionProject = useProjectRegistryStore((state) => state.transitionProject);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [office, setOffice] = useState("all");
  const [scope, setScope] = useState("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const queueProjects = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction).filter(
        (project) => project.pipelineStatus === config.status,
      ),
    [projects, fiscalYear, jurisdiction, config.status],
  );

  const options = useMemo(
    () => ({
      sources: unique(queueProjects.map((project) => project.proposalSource)),
      offices: unique(
        queueProjects.map((project) => (mode === "drafts" ? project.requestingOffice : project.implementingDepartment)),
      ),
      scopes: unique(queueProjects.map((project) => project.barangay ?? "Municipality-wide")),
    }),
    [queueProjects, mode],
  );

  const filteredProjects = useMemo(
    () =>
      queueProjects
        .filter((project) => {
          if (deferredSearch) {
            const haystack = [
              project.code,
              project.title,
              project.proposalSource,
              project.requestingOffice,
              project.implementingDepartment,
              project.leadOfficer,
              project.barangay ?? "Municipality-wide",
            ]
              .join(" ")
              .toLocaleLowerCase();
            if (!haystack.includes(deferredSearch)) return false;
          }
          if (source !== "all" && project.proposalSource !== source) return false;
          const projectOffice = mode === "drafts" ? project.requestingOffice : project.implementingDepartment;
          if (office !== "all" && projectOffice !== office) return false;
          if (scope !== "all" && (project.barangay ?? "Municipality-wide") !== scope) return false;
          return true;
        })
        .toSorted((a, b) =>
          mode === "submitted"
            ? a.lastUpdated.localeCompare(b.lastUpdated)
            : a.proposalCompleteness - b.proposalCompleteness,
        ),
    [queueProjects, deferredSearch, source, office, scope, mode],
  );

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredProjects.slice((safePage - 1) * pageSize, safePage * pageSize);
  const summary = useMemo(() => {
    const totalBudget = filteredProjects.reduce((total, project) => total + project.budget, 0);
    const averageCompleteness = filteredProjects.length
      ? Math.round(
          filteredProjects.reduce((total, project) => total + project.proposalCompleteness, 0) /
            filteredProjects.length,
        )
      : 0;
    const averageAge = filteredProjects.length
      ? Math.round(
          filteredProjects.reduce((total, project) => total + daysSince(project.lastUpdated), 0) /
            filteredProjects.length,
        )
      : 0;
    return {
      totalBudget,
      averageCompleteness,
      averageAge,
      attention:
        mode === "drafts"
          ? filteredProjects.filter((project) => project.proposalCompleteness < 80).length
          : filteredProjects.filter((project) => daysSince(project.lastUpdated) >= 10).length,
    };
  }, [filteredProjects, mode]);

  const clearFilters = () => {
    setSearch("");
    setSource("all");
    setOffice("all");
    setScope("all");
    setPage(1);
  };
  const transition = (project: Project) => {
    const updated = transitionProject(
      project.id,
      config.nextStatus,
      mode === "drafts"
        ? "Proposal submitted from the draft queue."
        : "Technical review started from the submitted proposal queue.",
    );
    if (updated) setMessage(`${project.code} moved to ${config.nextStatus}.`);
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>{config.eyebrow}</span>
          </div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <Link className={styles.primaryButton} href="/pipeline/proposal-intake">
          <Plus size={15} /> New proposal
        </Link>
      </header>
      {message ? (
        <div className={styles.successMessage}>
          <CheckCircle2 size={14} />
          {message}
        </div>
      ) : null}

      <section className={styles.queueCard}>
        <div className={styles.summaryStrip}>
          <div>
            <Inbox size={17} />
            <span>{mode === "drafts" ? "Drafts in view" : "Awaiting triage"}</span>
            <strong>{filteredProjects.length}</strong>
          </div>
          <div>
            <Banknote size={17} />
            <span>Proposed value</span>
            <strong>{formatCompactCurrency(summary.totalBudget)}</strong>
          </div>
          <div>
            {mode === "drafts" ? <ClipboardList size={17} /> : <CalendarClock size={17} />}
            <span>{mode === "drafts" ? "Average completeness" : "Average waiting time"}</span>
            <strong>{mode === "drafts" ? `${summary.averageCompleteness}%` : `${summary.averageAge} days`}</strong>
          </div>
          <div>
            {mode === "drafts" ? <FileEdit size={17} /> : <ShieldAlert size={17} />}
            <span>{mode === "drafts" ? "Below 80% complete" : "Waiting 10+ days"}</span>
            <strong>{summary.attention}</strong>
          </div>
        </div>

        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search proposals</span>
            <input
              type="search"
              value={search}
              placeholder="Search code, title, office, barangay, or lead officer…"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <QueueSelect
            value={source}
            label="Proposal source filter"
            placeholder="All proposal sources"
            options={options.sources}
            onChange={(value) => {
              setSource(value);
              setPage(1);
            }}
          />
          <QueueSelect
            value={office}
            label="Office filter"
            placeholder="All offices"
            options={options.offices}
            onChange={(value) => {
              setOffice(value);
              setPage(1);
            }}
          />
          <QueueSelect
            value={scope}
            label="Scope filter"
            placeholder="All scopes"
            options={options.scopes}
            onChange={(value) => {
              setScope(value);
              setPage(1);
            }}
          />
          {search || source !== "all" || office !== "all" || scope !== "all" ? (
            <button className={styles.clearButton} type="button" onClick={clearFilters}>
              Clear
            </button>
          ) : null}
        </div>

        {pageRows.length ? (
          <ProposalRows projects={pageRows} mode={mode} onTransition={transition} />
        ) : (
          <div className={styles.emptyState}>
            <AlertTriangle size={22} />
            <h3>No {mode === "drafts" ? "draft" : "submitted"} proposals found</h3>
            <p>
              {queueProjects.length
                ? "Clear the current filters to see other proposals."
                : `There are no ${config.status.toLocaleLowerCase()} proposals in the selected scope.`}
            </p>
            {queueProjects.length ? (
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link href="/pipeline/proposal-intake">Create a proposal</Link>
            )}
          </div>
        )}

        <footer className={styles.tableFooter}>
          <span>
            Showing{" "}
            <strong>
              {filteredProjects.length ? (safePage - 1) * pageSize + 1 : 0}–
              {Math.min(safePage * pageSize, filteredProjects.length)}
            </strong>{" "}
            of <strong>{filteredProjects.length}</strong>
          </span>
          <div>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
