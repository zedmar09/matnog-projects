"use client";

import {
  AlertTriangle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  HardHat,
  Plus,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { ProjectMasterlistFilters } from "../components/project-masterlist-filters";
import {
  PROJECT_TABLE_COLUMNS,
  ProjectMasterlistTable,
  type ProjectTableColumn,
} from "../components/project-masterlist-table";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { ProjectFilters, ProjectSortKey } from "../types/project";
import {
  EMPTY_PROJECT_FILTERS,
  filterProjects,
  filterProjectsByScope,
  formatCompactCurrency,
  sortProjects,
} from "../utils/project-utils";

import styles from "./project-masterlist.module.css";

const PIPELINE_OPTIONS = ["Draft", "Submitted", "Under Review", "Prioritized", "Funded", "Deferred", "Rejected"];
const STAGE_OPTIONS = [
  "Planning",
  "Readiness",
  "Procurement",
  "Implementation",
  "Inspection",
  "Closeout",
  "Completed",
  "On Hold",
];
const RISK_OPTIONS = ["Low", "Moderate", "High", "Critical"];

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));
const uniqueSorted = (values: string[]) => [...new Set(values)].toSorted((a, b) => a.localeCompare(b));

export function ProjectMasterlistView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_PROJECT_FILTERS);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ProjectTableColumn>>(() => new Set(PROJECT_TABLE_COLUMNS));
  const [sortKey, setSortKey] = useState<ProjectSortKey>("title");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const deferredSearch = useDeferredValue(filters.search);

  const scopedProjects = useMemo(
    () => filterProjectsByScope(projects, fiscalYear, jurisdiction),
    [projects, fiscalYear, jurisdiction],
  );

  const options = useMemo(
    () => ({
      pipelineStatuses: toOptions(PIPELINE_OPTIONS),
      deliveryStages: toOptions(STAGE_OPTIONS),
      fundingSources: toOptions(
        uniqueSorted(scopedProjects.flatMap((project) => project.funding.map((item) => item.source))),
      ),
      departments: toOptions(uniqueSorted(scopedProjects.map((project) => project.implementingDepartment))),
      barangays: [
        { value: "municipal", label: "Municipality-wide" },
        ...toOptions(uniqueSorted(scopedProjects.flatMap((project) => (project.barangay ? [project.barangay] : [])))),
      ],
      projectTypes: toOptions(uniqueSorted(scopedProjects.map((project) => project.projectType))),
      riskLevels: toOptions(RISK_OPTIONS),
    }),
    [scopedProjects],
  );

  const filteredProjects = useMemo(
    () => filterProjects(scopedProjects, { ...filters, search: deferredSearch }),
    [scopedProjects, filters, deferredSearch],
  );
  const sortedProjects = useMemo(
    () => sortProjects(filteredProjects, sortKey, direction),
    [filteredProjects, sortKey, direction],
  );
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sortedProjects.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startRow = sortedProjects.length ? (safePage - 1) * pageSize + 1 : 0;
  const endRow = Math.min(safePage * pageSize, sortedProjects.length);

  const summary = useMemo(
    () =>
      filteredProjects.reduce(
        (result, project) => ({
          budget: result.budget + project.budget,
          atRisk: result.atRisk + (["High", "Critical"].includes(project.riskLevel) ? 1 : 0),
          active: result.active + (["Implementation", "Inspection"].includes(project.deliveryStage) ? 1 : 0),
        }),
        { budget: 0, atRisk: 0, active: 0 },
      ),
    [filteredProjects],
  );

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "search" && value !== "all",
  ).length;

  const setFilter = (key: keyof ProjectFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_PROJECT_FILTERS);
    setPage(1);
  };

  const sortBy = (key: ProjectSortKey) => {
    if (sortKey === key) setDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDirection("asc");
    }
    setPage(1);
  };

  const toggleColumn = (column: ProjectTableColumn) => {
    if (column === "project" || column === "actions") return;
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(column)) next.delete(column);
      else next.add(column);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>
              {jurisdiction === "municipal" ? "Municipality-wide portfolio" : jurisdiction.replaceAll("-", " ")}
            </span>
          </div>
          <h2>All projects</h2>
          <p>Search and review the authoritative register of municipal and barangay-funded projects.</p>
        </div>
        <Link className={styles.primaryButton} href="/pipeline/proposal-intake">
          <Plus size={16} /> New proposal
        </Link>
      </header>

      <section className={styles.registryCard}>
        <section className={styles.summaryStrip} aria-label="Filtered project summary">
          <div>
            <FolderKanban size={17} />
            <span>Projects in view</span>
            <strong>{filteredProjects.length}</strong>
          </div>
          <div>
            <Banknote size={17} />
            <span>Combined budget</span>
            <strong>{formatCompactCurrency(summary.budget)}</strong>
          </div>
          <div>
            <ShieldAlert size={17} />
            <span>High or critical risk</span>
            <strong>{summary.atRisk}</strong>
          </div>
          <div>
            <HardHat size={17} />
            <span>Active delivery</span>
            <strong>{summary.active}</strong>
          </div>
        </section>

        <ProjectMasterlistFilters
          filters={filters}
          options={options}
          moreFiltersOpen={moreFiltersOpen}
          activeFilterCount={activeFilterCount}
          visibleColumns={visibleColumns}
          columns={PROJECT_TABLE_COLUMNS}
          onFilterChange={setFilter}
          onToggleMoreFilters={() => setMoreFiltersOpen((open) => !open)}
          onToggleColumn={toggleColumn}
          onClear={clearFilters}
        />

        {pageRows.length ? (
          <ProjectMasterlistTable
            projects={pageRows}
            visibleColumns={visibleColumns}
            sortKey={sortKey}
            direction={direction}
            onSort={sortBy}
          />
        ) : (
          <div className={styles.emptyState}>
            <AlertTriangle size={23} />
            <h3>No projects match these filters</h3>
            <p>Clear the current filters or choose a different fiscal year and jurisdiction.</p>
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        <footer className={styles.tableFooter}>
          <div>
            Showing{" "}
            <strong>
              {startRow}–{endRow}
            </strong>{" "}
            of <strong>{sortedProjects.length}</strong> projects
            {sortedProjects.length !== scopedProjects.length ? <span> · {scopedProjects.length} in scope</span> : null}
          </div>
          <div className={styles.paginationControls}>
            <span>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className={styles.pageSizeSelect} aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {[15, 25, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className={styles.pageCount}>
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
