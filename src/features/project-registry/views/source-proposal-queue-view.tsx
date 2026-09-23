"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileStack,
  Landmark,
  Layers3,
  MapPinned,
  MessageSquareText,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { Project, ProjectPipelineStatus } from "../types/project";
import { filterProjectsByScope, formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "./proposal-queue.module.css";

export type SourceQueueMode = "constituent" | "barangay-bdp" | "council";

type QueueConfig = {
  source: string;
  title: string;
  description: string;
  eyebrow: string;
  scopeLabel: string;
};

const QUEUE_CONFIG: Record<SourceQueueMode, QueueConfig> = {
  constituent: {
    source: "Constituent Request",
    title: "Constituent requests",
    description:
      "Track community-raised project needs from initial intake through municipal assessment and prioritization.",
    eyebrow: "Community-originated proposals",
    scopeLabel: "Request location",
  },
  "barangay-bdp": {
    source: "Barangay BDP",
    title: "Barangay BDP proposals",
    description: "Consolidate barangay development priorities and validate their linkage to approved local plans.",
    eyebrow: "Barangay development planning",
    scopeLabel: "Proposing barangay",
  },
  council: {
    source: "Council Resolution",
    title: "Council-endorsed proposals",
    description:
      "Monitor projects formally endorsed by the Sangguniang Bayan and route them through the municipal pipeline.",
    eyebrow: "Legislative endorsements",
    scopeLabel: "Endorsing area",
  },
};

const PIPELINE_ORDER: ProjectPipelineStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Prioritized",
  "Funded",
  "Deferred",
  "Rejected",
];

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

function SourceSelect({
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

function SummaryMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div>
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectPipelineStatus }) {
  return <span className={`${styles.statusBadge} ${styles[`status${status.replace(" ", "")}`]}`}>{status}</span>;
}

function EvidenceCell({ project, mode }: { project: Project; mode: SourceQueueMode }) {
  if (mode === "constituent") {
    return (
      <div className={styles.completeness}>
        <span>
          <strong>{project.proposalCompleteness}%</strong>
          {project.proposalCompleteness >= 85 ? "Ready" : "Needs details"}
        </span>
        <i>
          <b style={{ width: `${project.proposalCompleteness}%` }} />
        </i>
      </div>
    );
  }

  if (mode === "barangay-bdp") {
    return (
      <div className={styles.evidenceCell}>
        <strong>{project.planReferences.length} references</strong>
        <small>{project.planReferences.slice(0, 2).join(" · ")}</small>
      </div>
    );
  }

  return (
    <div className={styles.evidenceCell}>
      <strong>{project.multiYear ? "Multi-year" : "Single-year"}</strong>
      <small>{project.planReferences[0] ?? "For plan validation"}</small>
    </div>
  );
}

function getSummary(projects: Project[], mode: SourceQueueMode) {
  const proposedValue = projects.reduce((total, project) => total + project.budget, 0);
  const barangays = new Set(projects.map((project) => project.barangay).filter(Boolean)).size;

  if (mode === "constituent") {
    return [
      { icon: MessageSquareText, label: "Requests in view", value: projects.length },
      {
        icon: ClipboardCheck,
        label: "Awaiting assessment",
        value: projects.filter((project) => ["Draft", "Submitted", "Under Review"].includes(project.pipelineStatus))
          .length,
      },
      { icon: Banknote, label: "Proposed value", value: formatCompactCurrency(proposedValue) },
      { icon: MapPinned, label: "Barangays represented", value: barangays },
    ];
  }

  if (mode === "barangay-bdp") {
    return [
      { icon: FileStack, label: "BDP proposals", value: projects.length },
      { icon: Building2, label: "Barangays represented", value: barangays },
      { icon: Banknote, label: "Proposed value", value: formatCompactCurrency(proposedValue) },
      {
        icon: Layers3,
        label: "Plan-linked records",
        value: projects.filter((project) => project.planReferences.length >= 2).length,
      },
    ];
  }

  return [
    { icon: Landmark, label: "Council endorsements", value: projects.length },
    {
      icon: CheckCircle2,
      label: "In active review",
      value: projects.filter((project) => ["Submitted", "Under Review", "Prioritized"].includes(project.pipelineStatus))
        .length,
    },
    { icon: Banknote, label: "Proposed value", value: formatCompactCurrency(proposedValue) },
    { icon: Layers3, label: "Multi-year proposals", value: projects.filter((project) => project.multiYear).length },
  ];
}

export function SourceProposalQueueView({ mode }: { mode: SourceQueueMode }) {
  const config = QUEUE_CONFIG[mode];
  const projects = useProjectRegistryStore((state) => state.projects);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [office, setOffice] = useState("all");
  const [scope, setScope] = useState("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const sourceProjects = useMemo(
    () =>
      filterProjectsByScope(projects, fiscalYear, jurisdiction).filter(
        (project) => project.proposalSource === config.source,
      ),
    [projects, fiscalYear, jurisdiction, config.source],
  );

  const options = useMemo(
    () => ({
      statuses: PIPELINE_ORDER.filter((pipelineStatus) =>
        sourceProjects.some((project) => project.pipelineStatus === pipelineStatus),
      ),
      offices: unique(sourceProjects.map((project) => project.implementingDepartment)),
      scopes: unique(sourceProjects.map((project) => project.barangay ?? "Municipality-wide")),
    }),
    [sourceProjects],
  );

  const filteredProjects = useMemo(
    () =>
      sourceProjects
        .filter((project) => {
          if (deferredSearch) {
            const haystack = [
              project.code,
              project.title,
              project.requestingOffice,
              project.implementingDepartment,
              project.leadOfficer,
              project.barangay ?? "Municipality-wide",
            ]
              .join(" ")
              .toLocaleLowerCase();
            if (!haystack.includes(deferredSearch)) return false;
          }
          if (status !== "all" && project.pipelineStatus !== status) return false;
          if (office !== "all" && project.implementingDepartment !== office) return false;
          if (scope !== "all" && (project.barangay ?? "Municipality-wide") !== scope) return false;
          return true;
        })
        .toSorted((a, b) => a.priorityRank - b.priorityRank),
    [sourceProjects, deferredSearch, status, office, scope],
  );

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredProjects.slice((safePage - 1) * pageSize, safePage * pageSize);
  const summary = useMemo(() => getSummary(filteredProjects, mode), [filteredProjects, mode]);
  const hasFilters = Boolean(search || status !== "all" || office !== "all" || scope !== "all");

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setOffice("all");
    setScope("all");
    setPage(1);
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

      <section className={styles.queueCard}>
        <div className={styles.summaryStrip}>
          {summary.map((metric) => (
            <SummaryMetric key={metric.label} {...metric} />
          ))}
        </div>

        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search source proposals</span>
            <input
              type="search"
              value={search}
              placeholder="Search code, project, barangay, office, or lead officer…"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <SourceSelect
            value={status}
            label="Pipeline status filter"
            placeholder="All pipeline statuses"
            options={options.statuses}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <SourceSelect
            value={office}
            label="Implementing office filter"
            placeholder="All implementing offices"
            options={options.offices}
            onChange={(value) => {
              setOffice(value);
              setPage(1);
            }}
          />
          <SourceSelect
            value={scope}
            label={`${config.scopeLabel} filter`}
            placeholder={`All ${config.scopeLabel.toLocaleLowerCase()}s`}
            options={options.scopes}
            onChange={(value) => {
              setScope(value);
              setPage(1);
            }}
          />
          {hasFilters ? (
            <button className={styles.clearButton} type="button" onClick={clearFilters}>
              Clear
            </button>
          ) : null}
        </div>

        {pageRows.length ? (
          <div className={styles.tableScroller}>
            <table className={styles.queueTable}>
              <thead>
                <tr>
                  <th>Proposal</th>
                  <th>{config.scopeLabel}</th>
                  <th>Pipeline status</th>
                  <th>Implementing office</th>
                  <th>
                    {mode === "constituent"
                      ? "Intake readiness"
                      : mode === "barangay-bdp"
                        ? "Plan linkage"
                        : "Planning horizon"}
                  </th>
                  <th>Proposed budget</th>
                  <th>Last updated</th>
                  <th>
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((project) => (
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
                      <strong className={styles.cellStrong}>{project.barangay ?? "Municipality-wide"}</strong>
                      <small>{project.requestingOffice}</small>
                    </td>
                    <td>
                      <StatusBadge status={project.pipelineStatus} />
                    </td>
                    <td className={styles.officeCell}>
                      {project.implementingDepartment}
                      <small>{project.leadOfficer}</small>
                    </td>
                    <td>
                      <EvidenceCell project={project} mode={mode} />
                    </td>
                    <td className={styles.moneyCell}>
                      {formatCompactCurrency(project.budget)}
                      <small>{project.funding[0]?.source}</small>
                    </td>
                    <td>{formatShortDate(project.lastUpdated)}</td>
                    <td className={styles.actionsCell}>
                      <Link href={`/projects/${project.id}`}>
                        Open <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <AlertTriangle size={22} />
            <h3>No matching {config.title.toLocaleLowerCase()}</h3>
            <p>
              {sourceProjects.length
                ? "Clear the current filters to see other proposals."
                : `There are no ${config.source.toLocaleLowerCase()} records in the selected scope.`}
            </p>
            {sourceProjects.length ? (
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
