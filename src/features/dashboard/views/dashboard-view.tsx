"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  ExternalLink,
  FolderKanban,
  Gauge,
  Landmark,
  Layers,
  MapPin,
  TrendingUp,
} from "lucide-react";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { useMonitoringStore } from "@/features/monitoring/stores/monitoring-store";
import { useProjectTypeStore } from "@/features/settings/stores/project-type-store";
import { useShellStore } from "@/stores/shell-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import type { Project } from "@/features/project-registry/types/project";

import styles from "./dashboard.module.css";

const PIPELINE_COLORS: Record<string, string> = {
  Draft: "#8b9e9a",
  Submitted: "#5a7dba",
  "Under Review": "#d8932d",
  Prioritized: "#7c5cc8",
  Funded: "#0d9b6a",
  Deferred: "#b47a1d",
  Rejected: "#c44e4e",
};

const STAGE_COLORS: Record<string, string> = {
  Planning: "#8b9e9a",
  Readiness: "#5a7dba",
  Procurement: "#d8932d",
  Implementation: "#1a8d6e",
  Inspection: "#7c5cc8",
  Closeout: "#2e7ba0",
  Completed: "#0d7357",
  "On Hold": "#c44e4e",
};

const RISK_COLORS: Record<string, string> = {
  Low: "#0d9b6a",
  Moderate: "#d8932d",
  High: "#c97a1d",
  Critical: "#c44e4e",
};

function fmt(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

function DonutChart({
  segments,
  total,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut}>
        <svg viewBox="0 0 100 100">
          {segments.map((seg) => {
            const pct = total > 0 ? seg.value / total : 0;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const thisOffset = offset;
            offset += dash;
            return (
              <circle
                key={seg.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-thisOffset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
        <div className={styles.donutCenter}>
          <strong>{total}</strong>
          <small>{centerLabel}</small>
        </div>
      </div>
      <div className={styles.donutLegend}>
        {segments.map((seg) => (
          <div key={seg.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: seg.color }} />
            {seg.label}
            <strong>{seg.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const allProjects = useProjectRegistryStore((s) => s.projects);
  const inspections = useMonitoringStore((s) => s.inspections);
  const types = useProjectTypeStore((s) => s.types);
  const fiscalYear = useShellStore((s) => s.fiscalYear);

  const [typeFilter, setTypeFilter] = useState("all");
  const [pipelineFilter, setPipelineFilter] = useState("all");

  const projects = useMemo(() => {
    let filtered = allProjects.filter((p) => p.fiscalYear === fiscalYear || p.fiscalYear === `FY ${fiscalYear}`);
    if (typeFilter !== "all") filtered = filtered.filter((p) => p.projectType === typeFilter);
    if (pipelineFilter !== "all") filtered = filtered.filter((p) => p.pipelineStatus === pipelineFilter);
    return filtered;
  }, [allProjects, fiscalYear, typeFilter, pipelineFilter]);

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursement = projects.reduce((s, p) => s + p.disbursement, 0);
  const avgPhysical = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.physicalProgress, 0) / projects.length) : 0;
  const avgFinancial = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.financialProgress, 0) / projects.length) : 0;
  const atRiskCount = projects.filter((p) => p.riskLevel === "High" || p.riskLevel === "Critical").length;
  const completedCount = projects.filter((p) => p.deliveryStage === "Completed").length;

  const pipelineCounts = countBy(projects, (p) => p.pipelineStatus);
  const stageCounts = countBy(projects, (p) => p.deliveryStage);
  const riskCounts = countBy(projects, (p) => p.riskLevel);
  const typeCounts = countBy(projects, (p) => p.projectType);

  const pipelineSegments = Object.entries(pipelineCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value, color: PIPELINE_COLORS[label] ?? "#8b9e9a" }));

  const riskSegments = [
    { label: "Low", value: riskCounts["Low"] ?? 0, color: RISK_COLORS.Low },
    { label: "Moderate", value: riskCounts["Moderate"] ?? 0, color: RISK_COLORS.Moderate },
    { label: "High", value: riskCounts["High"] ?? 0, color: RISK_COLORS.High },
    { label: "Critical", value: riskCounts["Critical"] ?? 0, color: RISK_COLORS.Critical },
  ].filter((s) => s.value > 0);

  const stageOrder = ["Planning", "Readiness", "Procurement", "Implementation", "Inspection", "Closeout", "Completed", "On Hold"];
  const stageEntries = stageOrder
    .filter((s) => (stageCounts[s] ?? 0) > 0)
    .map((s) => ({ label: s, value: stageCounts[s] ?? 0, color: STAGE_COLORS[s] ?? "#8b9e9a" }));
  const maxStage = Math.max(...stageEntries.map((e) => e.value), 1);

  const typeEntries = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, value]) => {
      const typeRec = types.find((t) => t.name === label);
      return { label, value, color: typeRec?.color ?? "#6b7e94" };
    });
  const maxType = Math.max(...typeEntries.map((e) => e.value), 1);

  const barangayCounts = countBy(
    projects.filter((p) => p.barangay),
    (p) => p.barangay!,
  );
  const topBarangays = Object.entries(barangayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const fundedProjects = projects.filter(
    (p) => p.pipelineStatus === "Funded" && p.deliveryStage !== "Completed",
  );
  const utilizationRate = totalBudget > 0 ? Math.round((totalDisbursement / totalBudget) * 100) : 0;
  const obligationRate = totalBudget > 0 ? Math.round((projects.reduce((s, p) => s + p.obligation, 0) / totalBudget) * 100) : 0;

  const recentProjects = [...projects]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 8);

  const yearInspections = inspections.filter((ins) => {
    const project = allProjects.find((p) => p.id === ins.projectId);
    return project && (project.fiscalYear === fiscalYear || project.fiscalYear === `FY ${fiscalYear}`);
  });
  const completedInspections = yearInspections.filter((i) => i.status === "Completed").length;
  const scheduledInspections = yearInspections.filter((i) => i.status === "Scheduled").length;

  const projectTypes = useMemo(
    () => [...new Set(allProjects.map((p) => p.projectType))].sort(),
    [allProjects],
  );

  const slippingProjects = projects
    .filter((p) => p.slippageDays > 0 && p.deliveryStage !== "Completed")
    .sort((a, b) => b.slippageDays - a.slippageDays)
    .slice(0, 6);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Executive overview</p>
            <h1>Project Dashboard</h1>
            <p>Real-time summary of the municipality&rsquo;s project portfolio, delivery progress, and fiscal performance.</p>
            <div className={styles.heroMeta}>
              <span className={styles.heroChip}><CalendarClock size={12} /> FY {fiscalYear}</span>
              <span className={styles.heroChip}><FolderKanban size={12} /> {projects.length} projects</span>
              <span className={styles.heroChip}><Landmark size={12} /> {fmt(totalBudget)} budget</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {/* Filter bar */}
        <div className={styles.filterBar}>
          <label>Filter by:</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={styles.compactSelect} aria-label="Project type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All project types</SelectItem>
              {projectTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
            <SelectTrigger className={styles.compactSelect} aria-label="Pipeline status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["Draft", "Submitted", "Under Review", "Prioritized", "Funded", "Deferred", "Rejected"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI strip */}
        <section className={styles.kpiGrid}>
          <article>
            <span className={styles.kpiIcon} style={{ color: "#138466", background: "#e6f5ef" }}><FolderKanban size={18} /></span>
            <div>
              <span>Total projects</span>
              <strong>{projects.length}</strong>
              <small>FY {fiscalYear} portfolio</small>
            </div>
          </article>
          <article>
            <span className={styles.kpiIcon} style={{ color: "#2e7ba0", background: "#e8f4fa" }}><DollarSign size={18} /></span>
            <div>
              <span>Total budget</span>
              <strong>{fmt(totalBudget)}</strong>
              <small>{fmt(totalDisbursement)} disbursed</small>
            </div>
          </article>
          <article>
            <span className={styles.kpiIcon} style={{ color: "#1a8d6e", background: "#e6f5ef" }}><TrendingUp size={18} /></span>
            <div>
              <span>Avg. physical</span>
              <strong>{avgPhysical}%</strong>
              <small>{avgFinancial}% financial</small>
            </div>
          </article>
          <article>
            <span className={styles.kpiIcon} style={{ color: "#0d7357", background: "#e0f5eb" }}><CheckCircle2 size={18} /></span>
            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
              <small>{projects.length > 0 ? Math.round((completedCount / projects.length) * 100) : 0}% completion rate</small>
            </div>
          </article>
          <article>
            <span className={styles.kpiIcon} style={{ color: "#c44e4e", background: "#fef2f2" }}><AlertTriangle size={18} /></span>
            <div>
              <span>At risk</span>
              <strong>{atRiskCount}</strong>
              <small>high or critical</small>
            </div>
          </article>
          <article>
            <span className={styles.kpiIcon} style={{ color: "#7c5cc8", background: "#f3f0fa" }}><ClipboardCheck size={18} /></span>
            <div>
              <span>Inspections</span>
              <strong>{completedInspections}</strong>
              <small>{scheduledInspections} scheduled</small>
            </div>
          </article>
        </section>

        {/* Row 1: Pipeline + Delivery Stage + Risk */}
        <div className={styles.sectionRow}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Pipeline Status</h2>
              <span>{projects.length} total</span>
            </div>
            <div className={styles.cardBody}>
              <DonutChart segments={pipelineSegments} total={projects.length} centerLabel="Projects" />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Delivery Stage</h2>
              <span>{fundedProjects.length} active</span>
            </div>
            <div className={styles.cardBody}>
              <dl className={styles.distList}>
                {stageEntries.map((e) => (
                  <div key={e.label} className={styles.distRow}>
                    <dt>{e.label}</dt>
                    <div className={styles.distBar}>
                      <div className={styles.distBarFill} style={{ width: `${(e.value / maxStage) * 100}%`, background: e.color }} />
                    </div>
                    <dd>{e.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Risk Distribution</h2>
              <span>{atRiskCount} flagged</span>
            </div>
            <div className={styles.cardBody}>
              <DonutChart segments={riskSegments} total={projects.length} centerLabel="Projects" />
            </div>
          </div>
        </div>

        {/* Row 2: Financial gauges + Project types */}
        <div className={styles.sectionRow2}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Financial Performance</h2>
              <span>FY {fiscalYear}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.gaugeRow}>
                <span className={styles.gaugeLabel}>Utilization</span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} style={{ width: `${utilizationRate}%`, background: utilizationRate >= 50 ? "#18886b" : "#d8932d" }} />
                </div>
                <span className={styles.gaugeValue}>{utilizationRate}%</span>
              </div>
              <div className={styles.gaugeRow}>
                <span className={styles.gaugeLabel}>Obligation</span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} style={{ width: `${obligationRate}%`, background: obligationRate >= 50 ? "#18886b" : "#d8932d" }} />
                </div>
                <span className={styles.gaugeValue}>{obligationRate}%</span>
              </div>
              <div className={styles.gaugeRow}>
                <span className={styles.gaugeLabel}>Avg. Physical</span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} style={{ width: `${avgPhysical}%`, background: "#2e7ba0" }} />
                </div>
                <span className={styles.gaugeValue}>{avgPhysical}%</span>
              </div>
              <div className={styles.gaugeRow}>
                <span className={styles.gaugeLabel}>Avg. Financial</span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} style={{ width: `${avgFinancial}%`, background: "#7c5cc8" }} />
                </div>
                <span className={styles.gaugeValue}>{avgFinancial}%</span>
              </div>
              <div className={styles.gaugeRow}>
                <span className={styles.gaugeLabel}>Completion</span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} style={{ width: `${projects.length > 0 ? Math.round((completedCount / projects.length) * 100) : 0}%`, background: "#0d7357" }} />
                </div>
                <span className={styles.gaugeValue}>{projects.length > 0 ? Math.round((completedCount / projects.length) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>By Project Type</h2>
              <span>{Object.keys(typeCounts).length} types</span>
            </div>
            <div className={styles.cardBody}>
              <dl className={styles.distList}>
                {typeEntries.map((e) => (
                  <div key={e.label} className={styles.distRow}>
                    <dt>{e.label}</dt>
                    <div className={styles.distBar}>
                      <div className={styles.distBarFill} style={{ width: `${(e.value / maxType) * 100}%`, background: e.color }} />
                    </div>
                    <dd>{e.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Row 3: Recent projects + Top barangays + Slipping */}
        <div className={styles.sectionRow}>
          <div className={styles.card} style={{ gridColumn: "1 / 3" }}>
            <div className={styles.cardHeader}>
              <h2>Recently Updated Projects</h2>
              <span>Last 8</span>
            </div>
            <div style={{ overflow: "auto" }}>
              <table className={styles.recentTable}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Barangay</th>
                    <th>Physical</th>
                    <th>Stage</th>
                    <th>Risk</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((p) => (
                    <tr key={p.id}>
                      <td className={styles.projectCell}>
                        <strong>{p.title}</strong>
                        <span>{p.code}</span>
                      </td>
                      <td style={{ fontSize: 10 }}>{p.barangay ?? "Municipal"}</td>
                      <td>
                        <div className={styles.progressMini}>
                          {p.physicalProgress}%
                          <i><b style={{ width: `${p.physicalProgress}%` }} /></i>
                        </div>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ color: STAGE_COLORS[p.deliveryStage] ?? "#6b7e94", background: `${STAGE_COLORS[p.deliveryStage] ?? "#6b7e94"}18` }}>
                          {p.deliveryStage}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ color: RISK_COLORS[p.riskLevel] ?? "#6b7e94", background: `${RISK_COLORS[p.riskLevel] ?? "#6b7e94"}18` }}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td>
                        <Link href={`/projects/${p.id}`} className={styles.openLink}>
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Top Barangays</h2>
              <span>By project count</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.topList}>
                {topBarangays.map(([name, count], i) => (
                  <div key={name} className={styles.topRow}>
                    <span className={styles.topRank}>{i + 1}</span>
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Slipping projects + Monitoring summary */}
        <div className={styles.sectionRow2}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Projects with Slippage</h2>
              <span>{slippingProjects.length} delayed</span>
            </div>
            <div style={{ overflow: "auto" }}>
              <table className={styles.recentTable}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Slippage</th>
                    <th>Physical</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {slippingProjects.map((p) => (
                    <tr key={p.id}>
                      <td className={styles.projectCell}>
                        <strong>{p.title}</strong>
                        <span>{p.barangay ?? "Municipal"}</span>
                      </td>
                      <td style={{ color: "#c44e4e", fontWeight: 700, fontSize: 11 }}>
                        +{p.slippageDays}d
                      </td>
                      <td>
                        <div className={styles.progressMini}>
                          {p.physicalProgress}%
                          <i><b style={{ width: `${p.physicalProgress}%` }} /></i>
                        </div>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ color: RISK_COLORS[p.riskLevel], background: `${RISK_COLORS[p.riskLevel]}18` }}>
                          {p.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {slippingProjects.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", color: "#8b9e9a", padding: 20 }}>No slipping projects</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Monitoring Summary</h2>
              <span>FY {fiscalYear}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.gaugeRow}>
                <span className={styles.gaugeLabel}>Inspections</span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} style={{ width: `${yearInspections.length > 0 ? Math.round((completedInspections / yearInspections.length) * 100) : 0}%`, background: "#1a8d6e" }} />
                </div>
                <span className={styles.gaugeValue}>{completedInspections}/{yearInspections.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 10 }}>
                <div style={{ padding: "10px 12px", background: "#f4faf8", borderRadius: 8, border: "1px solid #d4e8e2" }}>
                  <div style={{ color: "#6b817d", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Completed</div>
                  <div style={{ color: "#0d7357", fontSize: 20, fontWeight: 700 }}>{completedInspections}</div>
                  <div style={{ color: "#8b9e9a", fontSize: 9 }}>inspections done</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#fef9e7", borderRadius: 8, border: "1px solid #f0e4b8" }}>
                  <div style={{ color: "#6b817d", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Scheduled</div>
                  <div style={{ color: "#b47a1d", fontSize: 20, fontWeight: 700 }}>{scheduledInspections}</div>
                  <div style={{ color: "#8b9e9a", fontSize: 9 }}>upcoming</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#e8f4fa", borderRadius: 8, border: "1px solid #c4dce8" }}>
                  <div style={{ color: "#6b817d", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Project types</div>
                  <div style={{ color: "#2e7ba0", fontSize: 20, fontWeight: 700 }}>{types.filter((t) => t.active).length}</div>
                  <div style={{ color: "#8b9e9a", fontSize: 9 }}>active categories</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#f3f0fa", borderRadius: 8, border: "1px solid #ddd4f0" }}>
                  <div style={{ color: "#6b817d", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Barangays</div>
                  <div style={{ color: "#7c5cc8", fontSize: 20, fontWeight: 700 }}>{Object.keys(barangayCounts).length}</div>
                  <div style={{ color: "#8b9e9a", fontSize: 9 }}>with projects</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
