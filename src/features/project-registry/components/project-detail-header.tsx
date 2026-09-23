import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Gauge,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

import type { Project, ProjectPipelineStatus } from "../types/project";
import { formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "../views/project-detail.module.css";
import { StatusBadge } from "./status-badge";

const PIPELINE_STATUSES: ProjectPipelineStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Prioritized",
  "Funded",
  "Deferred",
  "Rejected",
];

export function ProjectDetailHeader({
  project,
  message,
  onStatusChange,
}: {
  project: Project;
  message: string;
  onStatusChange: (status: ProjectPipelineStatus) => void;
}) {
  return (
    <>
      <Link className={styles.backLink} href="/pipeline/all-projects">
        <ArrowLeft size={14} /> Back to all projects
      </Link>

      <header className={styles.recordHeader}>
        <div className={styles.recordIdentity}>
          <div className={styles.codeLine}>
            <span>{project.code}</span>
            <StatusBadge value={project.pipelineStatus} />
            <StatusBadge value={project.deliveryStage} />
            <StatusBadge value={project.riskLevel} />
            {project.emergency ? (
              <span className={styles.emergencyBadge}>
                <AlertTriangle size={11} /> Emergency
              </span>
            ) : null}
          </div>
          <h2>{project.title}</h2>
          <div className={styles.recordMeta}>
            <span>
              <MapPin size={13} /> {project.location}
            </span>
            <span>{project.implementingDepartment}</span>
            <span>FY {project.fiscalYear}</span>
            {project.multiYear ? <span>Multi-year project</span> : null}
          </div>
        </div>

        <div className={styles.headerActions}>
          {message ? <span className={styles.actionMessage}>{message}</span> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={styles.statusButton} type="button">
                Update status <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move project to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PIPELINE_STATUSES.filter((status) => status !== project.pipelineStatus).map((status) => (
                <DropdownMenuItem key={status} onSelect={() => onStatusChange(status)}>
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className={styles.metricStrip} aria-label="Project summary">
        <article>
          <Banknote size={18} />
          <span>Approved budget</span>
          <strong>{formatCompactCurrency(project.budget)}</strong>
          <small>
            {project.funding.length > 1 ? `${project.funding.length} funding sources` : project.funding[0]?.source}
          </small>
        </article>
        <article>
          <Gauge size={18} />
          <span>Physical progress</span>
          <strong>{project.physicalProgress}%</strong>
          <div className={styles.metricProgress}>
            <i style={{ width: `${project.physicalProgress}%` }} />
          </div>
        </article>
        <article>
          <CircleDollarSign size={18} />
          <span>Financial progress</span>
          <strong>{project.financialProgress}%</strong>
          <div className={styles.metricProgress}>
            <i style={{ width: `${project.financialProgress}%` }} />
          </div>
        </article>
        <article>
          <CalendarClock size={18} />
          <span>Target completion</span>
          <strong>{formatShortDate(project.targetCompletion)}</strong>
          <small className={project.slippageDays > 0 ? styles.textDanger : ""}>
            {project.slippageDays > 0 ? `${project.slippageDays} days behind schedule` : "On current schedule"}
          </small>
        </article>
      </section>
    </>
  );
}
