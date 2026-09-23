"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FolderKanban,
  MapPinned,
  Plus,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useShellStore } from "@/stores/shell-store";

import { StatusBadge } from "../components/status-badge";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import {
  filterProjectsByScope,
  formatCompactCurrency,
  formatMonth,
  formatNumber,
  formatShortDate,
  getPortfolioOverview,
} from "../utils/project-utils";

import styles from "./portfolio-overview.module.css";

function ProgressLine({ label, value, tone = "green" }: { label: string; value: number; tone?: "green" | "blue" }) {
  return (
    <div className={styles.progressLine}>
      <div className={styles.progressLabel}>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className={styles.progressTrack}>
        <span className={tone === "blue" ? styles.progressBlue : styles.progressGreen} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PortfolioOverviewView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const scopedProjects = useMemo(
    () => filterProjectsByScope(projects, fiscalYear, jurisdiction),
    [projects, fiscalYear, jurisdiction],
  );
  const overview = useMemo(() => getPortfolioOverview(scopedProjects), [scopedProjects]);
  const largestPipelineCount = Math.max(1, ...overview.pipeline.map((item) => item.count));

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
          <h2>Project portfolio overview</h2>
          <p>Track funding, delivery health, readiness, and critical actions across Matnog projects.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/pipeline/all-projects">
            <FolderKanban size={16} /> Open project masterlist
          </Link>
          <Link className={styles.primaryButton} href="/pipeline/proposal-intake">
            <Plus size={16} /> New proposal
          </Link>
        </div>
      </header>

      <section className={styles.healthBand} aria-label="Portfolio summary">
        <div className={styles.healthPrimary}>
          <div className={styles.metricIcon}>
            <Banknote size={20} />
          </div>
          <div>
            <span>Approved portfolio value</span>
            <strong>{formatCompactCurrency(overview.portfolioValue)}</strong>
            <small>{overview.totalProjects} projects in current scope</small>
          </div>
        </div>
        <div className={styles.healthMetric}>
          <span>Active delivery</span>
          <strong>{overview.active}</strong>
          <small>{overview.completed} completed this fiscal year</small>
        </div>
        <div className={styles.healthMetric}>
          <span>Obligation rate</span>
          <strong>{overview.obligationRate}%</strong>
          <small>{overview.disbursementRate}% disbursed against portfolio</small>
        </div>
        <div className={styles.healthAttention}>
          <div>
            <ShieldAlert size={17} />
            <span>Projects at risk</span>
            <strong>{overview.atRiskCount}</strong>
          </div>
          <div>
            <ClipboardList size={17} />
            <span>Readiness blocked</span>
            <strong>{overview.readinessBlocked}</strong>
          </div>
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.pipelinePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Pipeline distribution</h3>
              <p>Current position of proposals and approved projects</p>
            </div>
            <Link href="/pipeline/all-projects">
              View pipeline <ChevronRight size={14} />
            </Link>
          </div>
          <div className={styles.pipelineList}>
            {overview.pipeline.map((item) => (
              <div className={styles.pipelineRow} key={item.status}>
                <span>{item.status}</span>
                <div>
                  <i style={{ width: `${(item.count / largestPipelineCount) * 100}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.deliveryPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Portfolio delivery</h3>
              <p>Average accomplishment across the selected scope</p>
            </div>
            <BadgeCheck size={20} />
          </div>
          <div className={styles.deliverySummary}>
            <div>
              <span>Physical accomplishment</span>
              <strong>{overview.averagePhysical}%</strong>
            </div>
            <div>
              <span>Financial accomplishment</span>
              <strong>{overview.averageFinancial}%</strong>
            </div>
          </div>
          <div className={styles.progressGroup}>
            <ProgressLine label="Physical" value={overview.averagePhysical} />
            <ProgressLine label="Financial" value={overview.averageFinancial} tone="blue" />
          </div>
          <div className={styles.deliveryNote}>
            <CheckCircle2 size={16} />
            <span>
              <strong>{overview.completed}</strong> projects completed in FY {fiscalYear}
            </span>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.riskPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Projects requiring attention</h3>
              <p>High and critical risks ranked by schedule variance</p>
            </div>
            <Link href="/portfolio-reports/projects-at-risk">
              Open risk register <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Risk</th>
                  <th>Slippage</th>
                  <th>Responsible office</th>
                </tr>
              </thead>
              <tbody>
                {overview.atRiskProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/projects/${project.id}`}>
                        <strong>{project.title}</strong>
                        <span>{project.code}</span>
                      </Link>
                    </td>
                    <td>{project.barangay ?? "Municipality-wide"}</td>
                    <td>
                      <StatusBadge value={project.riskLevel} />
                    </td>
                    <td>
                      <b className={styles.slippage}>{project.slippageDays} days</b>
                    </td>
                    <td>{project.implementingDepartment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.milestonePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Upcoming milestones</h3>
              <p>Next dates that need owner action</p>
            </div>
            <CalendarClock size={19} />
          </div>
          <div className={styles.timeline}>
            {overview.milestones.map((item) => (
              <article key={item.id}>
                <time dateTime={item.date}>
                  <strong>{new Date(`${item.date}T00:00:00Z`).getUTCDate()}</strong>
                  <span>{formatMonth(item.date)}</span>
                </time>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.project.title}</span>
                </div>
                <StatusBadge value={item.status} />
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Fund utilization</h3>
              <p>Obligated amount against allocated portfolio</p>
            </div>
            <CircleDollarSign size={19} />
          </div>
          <div className={styles.fundList}>
            {overview.funding.map((fund) => (
              <div key={fund.source}>
                <div className={styles.fundLabel}>
                  <span>{fund.source}</span>
                  <strong>{fund.utilization}%</strong>
                </div>
                <div className={styles.fundTrack}>
                  <i style={{ width: `${Math.min(100, fund.utilization)}%` }} />
                </div>
                <small>
                  {formatCompactCurrency(fund.obligated)} of {formatCompactCurrency(fund.budget)} obligated
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Barangay portfolio</h3>
              <p>Largest local portfolios by approved value</p>
            </div>
            <MapPinned size={19} />
          </div>
          <div className={styles.barangayList}>
            {overview.barangays.map((barangay, index) => (
              <div key={barangay.name}>
                <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{barangay.name}</strong>
                  <small>
                    {barangay.count} projects · {formatNumber(barangay.atRisk)} at risk
                  </small>
                </div>
                <b>{formatCompactCurrency(barangay.budget)}</b>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.activityPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Recent portfolio activity</h3>
              <p>Latest changes recorded by municipal teams</p>
            </div>
          </div>
          <div className={styles.activityList}>
            {overview.recentActivities.map(({ activity, project }) => (
              <article key={`${project.id}-${activity.id}`}>
                <span className={styles.activityMarker} aria-hidden="true" />
                <div>
                  <strong>{activity.action}</strong>
                  <p>
                    {project.code} · {activity.note}
                  </p>
                  <small>
                    {activity.actor} · {formatShortDate(activity.date)}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {scopedProjects.length === 0 ? (
        <section className={styles.emptyState}>
          <AlertTriangle size={24} />
          <h3>No projects match this scope</h3>
          <p>Choose another fiscal year or jurisdiction from the top navigation.</p>
        </section>
      ) : null}
    </div>
  );
}
