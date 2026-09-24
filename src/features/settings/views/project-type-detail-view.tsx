"use client";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  Landmark,
  Layers,
  Pencil,
  Power,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";

import { ICON_MAP, useProjectTypeStore } from "../stores/project-type-store";

import styles from "./project-type-detail.module.css";

const TABS = ["Overview", "Associated Projects"] as const;
type Tab = (typeof TABS)[number];

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
  "Pre-development": { color: "#7b6d9e", bg: "#f3f0fa" },
  "Implementation": { color: "#1a7a5e", bg: "#e6f5ef" },
  "Completion": { color: "#2e7ba0", bg: "#e8f4fa" },
  "Closeout": { color: "#6b7e94", bg: "#edf1f5" },
};

export function ProjectTypeDetailView({ typeId }: { typeId: string }) {
  const typeRecord = useProjectTypeStore((s) => s.getTypeById(typeId));
  const toggleActive = useProjectTypeStore((s) => s.toggleActive);
  const projects = useProjectRegistryStore((s) => s.projects);
  const [tab, setTab] = useState<Tab>("Overview");
  const [feedback, setFeedback] = useState("");

  const associatedProjects = useMemo(() => {
    if (!typeRecord) return [];
    return projects.filter(
      (p) => p.projectType.toLowerCase() === typeRecord.name.toLowerCase(),
    );
  }, [projects, typeRecord]);

  if (!typeRecord) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <Layers size={40} />
          <h2>Project type not found</h2>
          <p>The requested project type does not exist or has been removed.</p>
          <Link href="/settings/project-types">Back to Project Types</Link>
        </div>
      </div>
    );
  }

  const Icon = ICON_MAP[typeRecord.iconKey] ?? typeRecord.icon;
  const totalBudget = associatedProjects.reduce((s, p) => s + p.budget, 0);
  const avgProgress =
    associatedProjects.length > 0
      ? Math.round(
          associatedProjects.reduce((s, p) => s + p.physicalProgress, 0) /
            associatedProjects.length,
        )
      : 0;

  function handleToggle() {
    const updated = toggleActive(typeId);
    if (updated) {
      setFeedback(`Type ${updated.active ? "activated" : "deactivated"}.`);
      window.setTimeout(() => setFeedback(""), 3000);
    }
  }

  function fmt(n: number) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toLocaleString();
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Configuration</p>
          <h1>{typeRecord.name}</h1>
          <p>{typeRecord.description}</p>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.profileHeader}>
          <div className={styles.profileLeft}>
            <span
              className={styles.profileIconWrap}
              style={{
                color: typeRecord.color,
                background: `${typeRecord.color}14`,
              }}
            >
              <Icon size={24} />
            </span>
            <div className={styles.profileInfo}>
              <h2>{typeRecord.name}</h2>
              <div className={styles.profileBadges}>
                <span
                  className={`${styles.badge} ${typeRecord.active ? styles.badgeActive : styles.badgeInactive}`}
                >
                  {typeRecord.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.profileActions}>
            <Link
              href={`/settings/project-types/${typeId}/edit`}
              className={styles.editButton}
            >
              <Pencil size={14} /> Edit
            </Link>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={handleToggle}
            >
              <Power size={14} />{" "}
              {typeRecord.active ? "Deactivate" : "Activate"}
            </button>
            <Link
              href="/settings/project-types"
              className={styles.editButton}
            >
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        </div>

        <div className={styles.metricStrip}>
          <article>
            <span className={styles.metricIcon}>
              <FolderKanban size={16} />
            </span>
            <div>
              <span>Projects</span>
              <strong>{associatedProjects.length}</strong>
              <small>using this type</small>
            </div>
          </article>
          <article>
            <span className={styles.metricIcon}>
              <Landmark size={16} />
            </span>
            <div>
              <span>Total budget</span>
              <strong>{fmt(totalBudget)}</strong>
              <small>combined allocation</small>
            </div>
          </article>
          <article>
            <span className={styles.metricIcon}>
              <TrendingUp size={16} />
            </span>
            <div>
              <span>Avg. progress</span>
              <strong>{avgProgress}%</strong>
              <small>physical completion</small>
            </div>
          </article>
          <article>
            <span className={styles.metricIcon}>
              <Layers size={16} />
            </span>
            <div>
              <span>Eligible funds</span>
              <strong>{typeRecord.eligibleFunds.length}</strong>
              <small>fund sources</small>
            </div>
          </article>
        </div>

        <nav className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "Overview" ? <Layers size={13} /> : <FolderKanban size={13} />}
              {t}
            </button>
          ))}
        </nav>

        {tab === "Overview" && (
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <h3>General Information</h3>
              <dl>
                <div className={styles.detailRow}>
                  <dt>Type ID</dt>
                  <dd>{typeRecord.id}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Name</dt>
                  <dd>{typeRecord.name}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Status</dt>
                  <dd>{typeRecord.active ? "Active" : "Inactive"}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Department</dt>
                  <dd>{typeRecord.department}</dd>
                </div>
              </dl>
            </div>
            <div className={styles.detailCard}>
              <h3>Appearance</h3>
              <dl>
                <div className={styles.detailRow}>
                  <dt>Icon</dt>
                  <dd style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={14} style={{ color: typeRecord.color }} />
                    {typeRecord.iconKey}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Color</dt>
                  <dd style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: typeRecord.color,
                        display: "inline-block",
                      }}
                    />
                    {typeRecord.color}
                  </dd>
                </div>
              </dl>
            </div>
            <div className={`${styles.detailCard} ${styles.detailCardFull}`}>
              <h3>Description</h3>
              <p style={{ margin: 0, color: "#48605d", fontSize: 12, lineHeight: 1.6 }}>
                {typeRecord.description}
              </p>
            </div>
            <div className={`${styles.detailCard} ${styles.detailCardFull}`}>
              <h3>Eligible Fund Sources</h3>
              <div className={styles.fundTags}>
                {typeRecord.eligibleFunds.map((fund) => (
                  <span key={fund} className={styles.fundTag}>
                    <Landmark size={10} /> {fund}
                  </span>
                ))}
                {typeRecord.eligibleFunds.length === 0 && (
                  <span style={{ color: "#7b8e8a", fontSize: 11 }}>
                    No eligible funds configured
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "Associated Projects" && (
          <div className={styles.tableCard}>
            <header>
              <div>
                <h2>Associated Projects</h2>
                <p>
                  All projects classified under &ldquo;{typeRecord.name}&rdquo;
                </p>
              </div>
              <span>{associatedProjects.length} projects</span>
            </header>
            {associatedProjects.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Barangay</th>
                      <th>Budget</th>
                      <th>Physical</th>
                      <th>Financial</th>
                      <th>Stage</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {associatedProjects.map((p) => {
                      const stageStyle = STAGE_COLORS[p.deliveryStage] ?? {
                        color: "#6b7e94",
                        bg: "#edf1f5",
                      };
                      return (
                        <tr key={p.id}>
                          <td className={styles.projectCell}>
                            <strong>{p.title}</strong>
                            <span>{p.code}</span>
                          </td>
                          <td>{p.barangay}</td>
                          <td>{fmt(p.budget)}</td>
                          <td>
                            <div className={styles.progressCell}>
                              {p.physicalProgress}%
                              <i>
                                <b
                                  style={{
                                    width: `${p.physicalProgress}%`,
                                  }}
                                />
                              </i>
                            </div>
                          </td>
                          <td>
                            <div className={styles.progressCell}>
                              {p.financialProgress}%
                              <i>
                                <b
                                  style={{
                                    width: `${p.financialProgress}%`,
                                  }}
                                />
                              </i>
                            </div>
                          </td>
                          <td>
                            <span
                              className={styles.stageBadge}
                              style={{
                                color: stageStyle.color,
                                background: stageStyle.bg,
                              }}
                            >
                              {p.deliveryStage}
                            </span>
                          </td>
                          <td>
                            <span
                              className={styles.stageBadge}
                              style={{
                                color:
                                  p.pipelineStatus === "Funded"
                                    ? "#0d7357"
                                    : p.pipelineStatus === "Prioritized"
                                      ? "#1a7a5e"
                                      : "#6b7e94",
                                background:
                                  p.pipelineStatus === "Funded"
                                    ? "#e0f5eb"
                                    : p.pipelineStatus === "Prioritized"
                                      ? "#e6f5ef"
                                      : "#edf1f5",
                              }}
                            >
                              {p.pipelineStatus}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/projects/${p.id}`}
                              className={styles.openLink}
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyProjects}>
                No projects are currently classified under this type.
              </div>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}
    </div>
  );
}
