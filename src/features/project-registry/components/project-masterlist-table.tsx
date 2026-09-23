import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Project, ProjectSortKey } from "../types/project";
import { formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "../views/project-masterlist.module.css";
import { StatusBadge } from "./status-badge";

export const PROJECT_TABLE_COLUMNS = [
  "project",
  "scope",
  "department",
  "fiscalYear",
  "funding",
  "budget",
  "pipeline",
  "stage",
  "progress",
  "risk",
  "completion",
  "actions",
] as const;

export type ProjectTableColumn = (typeof PROJECT_TABLE_COLUMNS)[number];

const SORTABLE_COLUMNS: Partial<Record<ProjectTableColumn, ProjectSortKey>> = {
  project: "title",
  scope: "barangay",
  department: "department",
  fiscalYear: "fiscalYear",
  budget: "budget",
  pipeline: "pipelineStatus",
  stage: "deliveryStage",
  progress: "physicalProgress",
  risk: "riskLevel",
  completion: "targetCompletion",
};

function SortHeader({
  column,
  label,
  sortKey,
  direction,
  onSort,
}: {
  column: ProjectTableColumn;
  label: string;
  sortKey: ProjectSortKey;
  direction: "asc" | "desc";
  onSort: (key: ProjectSortKey) => void;
}) {
  const key = SORTABLE_COLUMNS[column];
  if (!key) return <th>{label}</th>;
  const active = sortKey === key;
  return (
    <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button className={styles.sortButton} type="button" onClick={() => onSort(key)}>
        {label}
        {active && direction === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
      </button>
    </th>
  );
}

function CompactProgress({ physical, financial }: { physical: number; financial: number }) {
  return (
    <div className={styles.progressPair}>
      <div>
        <span>
          <i>P</i>
          {physical}%
        </span>
        <b>
          <i style={{ width: `${physical}%` }} />
        </b>
      </div>
      <div>
        <span>
          <i>F</i>
          {financial}%
        </span>
        <b>
          <i style={{ width: `${financial}%` }} />
        </b>
      </div>
    </div>
  );
}

export function ProjectMasterlistTable({
  projects,
  visibleColumns,
  sortKey,
  direction,
  onSort,
}: {
  projects: Project[];
  visibleColumns: Set<ProjectTableColumn>;
  sortKey: ProjectSortKey;
  direction: "asc" | "desc";
  onSort: (key: ProjectSortKey) => void;
}) {
  const show = (column: ProjectTableColumn) => visibleColumns.has(column);

  return (
    <div className={styles.tableScroller}>
      <table className={styles.projectTable}>
        <thead>
          <tr>
            {show("project") ? (
              <SortHeader column="project" label="Project" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("scope") ? (
              <SortHeader column="scope" label="Scope" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("department") ? (
              <SortHeader
                column="department"
                label="Implementing office"
                sortKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
            ) : null}
            {show("fiscalYear") ? (
              <SortHeader column="fiscalYear" label="FY" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("funding") ? <th>Fund source</th> : null}
            {show("budget") ? (
              <SortHeader column="budget" label="Budget" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("pipeline") ? (
              <SortHeader column="pipeline" label="Pipeline" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("stage") ? (
              <SortHeader column="stage" label="Stage" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("progress") ? (
              <SortHeader column="progress" label="Progress" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("risk") ? (
              <SortHeader column="risk" label="Risk" sortKey={sortKey} direction={direction} onSort={onSort} />
            ) : null}
            {show("completion") ? (
              <SortHeader
                column="completion"
                label="Target completion"
                sortKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
            ) : null}
            {show("actions") ? (
              <th>
                <span className={styles.srOnly}>Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              {show("project") ? (
                <td className={styles.projectCell}>
                  <Link href={`/projects/${project.id}`}>
                    <strong>{project.title}</strong>
                    <span>
                      {project.code}
                      {project.multiYear ? " · Multi-year" : ""}
                      {project.emergency ? " · Emergency" : ""}
                    </span>
                  </Link>
                </td>
              ) : null}
              {show("scope") ? <td>{project.barangay ?? "Municipality-wide"}</td> : null}
              {show("department") ? <td className={styles.departmentCell}>{project.implementingDepartment}</td> : null}
              {show("fiscalYear") ? <td>FY {project.fiscalYear}</td> : null}
              {show("funding") ? (
                <td className={styles.fundingCell}>
                  <span>{project.funding[0]?.source ?? "—"}</span>
                  {project.funding.length > 1 ? <small>+{project.funding.length - 1} co-funder</small> : null}
                </td>
              ) : null}
              {show("budget") ? <td className={styles.moneyCell}>{formatCompactCurrency(project.budget)}</td> : null}
              {show("pipeline") ? (
                <td>
                  <StatusBadge value={project.pipelineStatus} />
                </td>
              ) : null}
              {show("stage") ? (
                <td>
                  <StatusBadge value={project.deliveryStage} />
                </td>
              ) : null}
              {show("progress") ? (
                <td>
                  <CompactProgress physical={project.physicalProgress} financial={project.financialProgress} />
                </td>
              ) : null}
              {show("risk") ? (
                <td>
                  <StatusBadge value={project.riskLevel} />
                </td>
              ) : null}
              {show("completion") ? (
                <td className={project.slippageDays > 0 ? styles.dateAtRisk : ""}>
                  {formatShortDate(project.targetCompletion)}
                  {project.slippageDays > 0 ? <small>{project.slippageDays} days behind</small> : null}
                </td>
              ) : null}
              {show("actions") ? (
                <td className={styles.actionCell}>
                  <Link href={`/projects/${project.id}`} aria-label={`Open ${project.title}`} title="Open project">
                    <ArrowUpRight size={14} />
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
