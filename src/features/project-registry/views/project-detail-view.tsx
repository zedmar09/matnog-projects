"use client";

import { useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  Check,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  MapPin,
  Pencil,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { Project } from "../types/project";
import { formatCompactCurrency, formatShortDate } from "../utils/project-utils";
import styles from "./project-detail.module.css";

const tabs = ["Overview", "Funding", "Progress", "Activity"] as const;
type Tab = (typeof tabs)[number];

function statusClass(status: string) {
  if (status === "Funded" || status === "Completed") return styles.active;
  if (status === "Rejected" || status === "Critical") return styles.danger;
  if (status === "Deferred" || status === "On Hold" || status === "High") return styles.warning;
  if (status === "Under Review" || status === "Moderate") return styles.info;
  return "";
}

function Rows({ items }: { items: Array<[string, string | number | boolean | undefined | null]> }) {
  return (
    <dl className={styles.dataList}>
      {items.map(([label, value]) => (
        <div className={styles.dataRow} key={label}>
          <dt>{label}</dt>
          <dd>{value === true ? "Yes" : value === false ? "No" : value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.detailCard}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailCardIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className={styles.detailCardBody}>{children}</div>
    </section>
  );
}

const fmt = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 });

function OverviewTab({ project }: { project: Project }) {
  return (
    <div className={styles.profileGrid}>
      <DetailCard icon={<FolderKanban size={17} />} title="Project Information">
        <Rows
          items={[
            ["Project code", project.code],
            ["Title", project.title],
            ["Project type", project.projectType],
            ["Description", project.description],
            ["Problem statement", project.problemStatement],
            ["Expected outcome", project.expectedOutcome],
            ["Emergency project", project.emergency],
          ]}
        />
        {project.tags.length > 0 && (
          <div className={styles.tags} style={{ marginTop: 14 }}>
            {project.tags.map((t) => <span key={t}>{t}</span>)}
          </div>
        )}
      </DetailCard>

      <DetailCard icon={<MapPin size={17} />} title="Location & Scope">
        <Rows
          items={[
            ["Barangay", project.barangay ?? "Municipality-wide"],
            ["Location", project.location],
            ["Beneficiaries", project.beneficiaries.toLocaleString()],
            ["Sectors", project.beneficiarySectors.join(", ")],
            ["Proposal source", project.proposalSource],
            ["Requesting office", project.requestingOffice],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<ShieldCheck size={17} />} title="Organization & Timeline">
        <Rows
          items={[
            ["Implementing department", project.implementingDepartment],
            ["Lead officer", project.leadOfficer],
            ["Fiscal year", project.fiscalYear],
            ["Multi-year", project.multiYear],
            ["Target start", formatShortDate(project.targetStart)],
            ["Target completion", formatShortDate(project.targetCompletion)],
            ["Slippage", project.slippageDays > 0 ? `${project.slippageDays} days behind` : "On schedule"],
            ["Procurement mode", project.procurementMode],
            ["Procurement status", project.procurementStatus],
            ["Contractor", project.contractor],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<ClipboardList size={17} />} title="Pipeline & Delivery">
        <Rows
          items={[
            ["Pipeline status", project.pipelineStatus],
            ["Delivery stage", project.deliveryStage],
            ["Risk level", project.riskLevel],
            ["Readiness", `${project.readinessPercent}%`],
            ["Readiness blockers", project.readinessBlockers],
            ["Priority rank", project.priorityRank],
            ["Proposal completeness", `${project.proposalCompleteness}%`],
          ]}
        />
        {project.riskReasons.length > 0 && (
          <ul className={styles.riskList} style={{ marginTop: 14 }}>
            {project.riskReasons.map((r) => (
              <li key={r}><AlertTriangle size={14} /> {r}</li>
            ))}
          </ul>
        )}
        {project.riskReasons.length === 0 && project.riskLevel === "Low" && (
          <div className={styles.positiveState} style={{ marginTop: 14 }}>
            <Check size={16} /> No risk factors identified
          </div>
        )}
      </DetailCard>

      {project.planReferences.length > 0 && (
        <DetailCard icon={<FileText size={17} />} title="Plan References">
          <Rows
            items={project.planReferences.map((ref, i) => [`Reference ${i + 1}`, ref])}
          />
        </DetailCard>
      )}
    </div>
  );
}

function FundingTab({ project }: { project: Project }) {
  const total = project.funding.reduce((sum, f) => sum + f.amount, 0);
  return (
    <div className={styles.profileGrid}>
      <DetailCard icon={<Banknote size={17} />} title="Funding Sources">
        {project.funding.length > 0 ? (
          <table className={styles.fundingTable}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Amount</th>
                <th>Share</th>
                <th>Eligibility</th>
              </tr>
            </thead>
            <tbody>
              {project.funding.map((f, i) => (
                <tr key={`${f.source}-${i}`}>
                  <td>{f.source}</td>
                  <td>{fmt(f.amount)}</td>
                  <td>{f.share}%</td>
                  <td>
                    <span className={`${styles.badge} ${f.eligibility === "Approved" ? styles.active : f.eligibility === "Eligible" ? styles.info : ""}`}>
                      {f.eligibility}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{fmt(total)}</td>
                <td>100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className={styles.empty}><p>No funding sources assigned yet.</p></div>
        )}
      </DetailCard>

      <DetailCard icon={<CircleDollarSign size={17} />} title="Financial Progress">
        <Rows
          items={[
            ["Approved budget", formatCompactCurrency(project.budget)],
            ["Appropriation", formatCompactCurrency(project.appropriation)],
            ["Obligation", formatCompactCurrency(project.obligation)],
            ["Disbursement", formatCompactCurrency(project.disbursement)],
            ["Financial progress", `${project.financialProgress}%`],
          ]}
        />
        <div className={styles.progressBar} style={{ marginTop: 14 }}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${project.financialProgress}%` }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#344d49" }}>{project.financialProgress}%</span>
        </div>
      </DetailCard>
    </div>
  );
}

function ProgressTab({ project }: { project: Project }) {
  return (
    <div className={styles.profileGrid}>
      <DetailCard icon={<Gauge size={17} />} title="Physical Progress">
        <Rows
          items={[
            ["Physical progress", `${project.physicalProgress}%`],
            ["Delivery stage", project.deliveryStage],
            ["Procurement status", project.procurementStatus],
            ["Contractor", project.contractor],
          ]}
        />
        <div className={styles.progressBar} style={{ marginTop: 14 }}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${project.physicalProgress}%` }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#344d49" }}>{project.physicalProgress}%</span>
        </div>
      </DetailCard>

      <DetailCard icon={<CalendarClock size={17} />} title="Milestones">
        {project.milestones.length > 0 ? (
          <div className={styles.timeline}>
            {project.milestones.map((m) => (
              <div key={m.id} className={styles.timelineItem}>
                <span className={styles.timelineDot} />
                <div>
                  <strong>{m.label}</strong>
                  <small>
                    <span className={`${styles.badge} ${statusClass(m.status)}`}>{m.status}</span>
                  </small>
                </div>
                <span className={styles.timelineDate}>{formatShortDate(m.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}><p>No milestones defined yet.</p></div>
        )}
      </DetailCard>
    </div>
  );
}

function ActivityTab({ project }: { project: Project }) {
  return (
    <DetailCard icon={<FileText size={17} />} title="Activity Log">
      {project.activities.length > 0 ? (
        <div className={styles.timeline}>
          {project.activities.slice(0, 20).map((a) => (
            <div key={a.id} className={styles.timelineItem}>
              <span className={styles.timelineDot} />
              <div>
                <strong>{a.action}</strong>
                <small>{a.note}</small>
              </div>
              <span className={styles.timelineDate}>
                {a.date} · {a.actor}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}><p>No activity recorded yet.</p></div>
      )}
    </DetailCard>
  );
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const project = useProjectRegistryStore((state) => state.projects.find((item) => item.id === projectId));
  const [tab, setTab] = useState<Tab>("Overview");
  const params = useSearchParams();

  if (!project) {
    return (
      <div className={styles.notFound}>
        <FolderKanban size={28} />
        <h2>Project not found</h2>
        <p>This project record does not exist or the page was reloaded.</p>
        <Link href="/projects/all">Return to all projects</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1>{project.title}</h1>
            <div className={styles.heroSub}>
              <span>{project.code}</span>
              <span>·</span>
              <span><MapPin size={14} /> {project.barangay ?? "Municipality-wide"}</span>
              <span>·</span>
              <span>FY {project.fiscalYear}</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/projects/${project.id}/edit`}>
              <Pencil size={16} /> Edit Project
            </Link>
            <Link className={styles.btnSecondary} href="/projects/all">
              <ArrowLeft size={16} /> All Projects
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {params.get("saved") && (
          <div className={styles.toast}>
            Project proposal saved successfully. Changes remain available for this browser session.
          </div>
        )}
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.projectIcon}>
              <FolderKanban size={28} />
            </div>
            <div className={styles.profileIdentity}>
              <h2>{project.title}</h2>
              <p>{project.code} · {project.implementingDepartment} · {project.location}</p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${statusClass(project.pipelineStatus)}`}>{project.pipelineStatus}</span>
                <span className={`${styles.badge} ${statusClass(project.deliveryStage)}`}>{project.deliveryStage}</span>
                <span className={`${styles.badge} ${statusClass(project.riskLevel)}`}>{project.riskLevel} Risk</span>
                {project.emergency && (
                  <span className={styles.emergencyBadge}>
                    <AlertTriangle size={12} /> Emergency
                  </span>
                )}
              </div>
            </div>
          </header>

          <section className={styles.metricStrip} aria-label="Project summary">
            <article>
              <Banknote size={20} />
              <span>Approved budget</span>
              <strong>{formatCompactCurrency(project.budget)}</strong>
              <small>
                {project.funding.length > 1 ? `${project.funding.length} funding sources` : project.funding[0]?.source ?? "—"}
              </small>
            </article>
            <article>
              <Gauge size={20} />
              <span>Physical progress</span>
              <strong>{project.physicalProgress}%</strong>
              <div className={styles.metricProgress}>
                <i style={{ width: `${project.physicalProgress}%` }} />
              </div>
            </article>
            <article>
              <CircleDollarSign size={20} />
              <span>Financial progress</span>
              <strong>{project.financialProgress}%</strong>
              <div className={styles.metricProgress}>
                <i style={{ width: `${project.financialProgress}%` }} />
              </div>
            </article>
            <article>
              <CalendarClock size={20} />
              <span>Target completion</span>
              <strong>{formatShortDate(project.targetCompletion)}</strong>
              <small className={project.slippageDays > 0 ? styles.textDanger : ""}>
                {project.slippageDays > 0 ? `${project.slippageDays} days behind schedule` : "On current schedule"}
              </small>
            </article>
          </section>

          <nav className={styles.tabs} aria-label="Project details">
            {tabs.map((value) => (
              <button
                type="button"
                key={value}
                className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </nav>

          <div className={styles.profileBody}>
            {tab === "Overview" && <OverviewTab project={project} />}
            {tab === "Funding" && <FundingTab project={project} />}
            {tab === "Progress" && <ProgressTab project={project} />}
            {tab === "Activity" && <ActivityTab project={project} />}
          </div>
        </section>
      </div>
    </div>
  );
}
