"use client";

import { useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Camera,
  ClipboardList,
  FileText,
  Gauge,
  Hammer,
  MapPin,
  Pencil,
  User,
} from "lucide-react";

import { useMonitoringStore } from "../stores/monitoring-store";
import type { ProgressUpdate } from "../types/progress-update";
import styles from "./progress-detail.module.css";

const tabs = ["Overview", "Work Items", "Photos"] as const;
type Tab = (typeof tabs)[number];

function statusClass(status: string) {
  if (status === "Verified") return styles.active;
  if (status === "Returned") return styles.danger;
  if (status === "Draft") return styles.warning;
  if (status === "Submitted") return styles.info;
  return "";
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const sStr = s.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  const eStr = e.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  return `${sStr} – ${eStr}`;
}

function Rows({ items }: { items: Array<[string, string | number | boolean | undefined | null | React.ReactNode]> }) {
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

const DEMO_PHOTOS = [
  { src: "/images/inspections/inspection-1.jpg", caption: "Road surface grading and compaction" },
  { src: "/images/inspections/inspection-2.jpg", caption: "Building structure and formwork" },
  { src: "/images/inspections/inspection-3.jpg", caption: "Workers on-site operations" },
  { src: "/images/inspections/inspection-4.jpg", caption: "Foundation and concrete works" },
  { src: "/images/inspections/inspection-5.jpg", caption: "Infrastructure progress overview" },
];

function OverviewTab({ update }: { update: ProgressUpdate }) {
  const physDelta = update.currentPhysical - update.previousPhysical;
  const finDelta = update.currentFinancial - update.previousFinancial;

  return (
    <div className={styles.profileGrid}>
      <DetailCard icon={<ClipboardList size={17} />} title="Report Information">
        <Rows
          items={[
            ["Report code", update.code],
            ["Report type", update.reportType],
            ["Status", <span key="st" className={`${styles.badge} ${statusClass(update.status)}`}>{update.status}</span>],
            ["Period", formatPeriod(update.periodStart, update.periodEnd)],
            ["Submitted date", formatShortDate(update.submittedDate)],
            ["Last updated", formatShortDate(update.lastUpdated)],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<FileText size={17} />} title="Project Information">
        <Rows
          items={[
            ["Project code", update.projectCode],
            ["Project title", update.projectTitle],
            ["Project type", update.projectType],
            ["Barangay", update.barangay ?? "Municipality-wide"],
            ["Contractor", update.contractor ?? "Not assigned"],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<User size={17} />} title="Reporter Details">
        <Rows
          items={[
            ["Submitted by", update.submittedBy],
            ["Designation", update.designation],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<Gauge size={17} />} title="Progress Summary">
        <Rows
          items={[
            ["Physical progress", <span key="pp">{update.previousPhysical}% → {update.currentPhysical}% {physDelta > 0 && <span className={`${styles.delta} ${styles.deltaUp}`}>(+{physDelta}%)</span>}</span>],
            ["Financial progress", <span key="fp">{update.previousFinancial}% → {update.currentFinancial}% {finDelta > 0 && <span className={`${styles.delta} ${styles.deltaUp}`}>(+{finDelta}%)</span>}</span>],
            ["Slippage", update.slippageDays > 0 ? `${update.slippageDays} days behind schedule` : "On track"],
          ]}
        />
        <div className={styles.progressBar} style={{ marginTop: 14 }}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${update.currentPhysical}%` }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#344d49" }}>{update.currentPhysical}%</span>
        </div>
      </DetailCard>

      <DetailCard icon={<AlertTriangle size={17} />} title="Issues & Next Steps">
        <Rows
          items={[
            ["Issues & concerns", update.issues || "No issues reported."],
            ["Next steps", update.nextSteps || "No next steps specified."],
          ]}
        />
      </DetailCard>
    </div>
  );
}

function WorkItemsTab({ update }: { update: ProgressUpdate }) {
  return (
    <DetailCard icon={<Hammer size={17} />} title={`Work Items (${update.workItems.length})`}>
      {update.workItems.length > 0 ? (
        <table className={styles.workItemTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Unit</th>
              <th>Target Qty</th>
              <th>Accomplished</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {update.workItems.map((w) => (
              <tr key={w.id}>
                <td>{w.description}</td>
                <td>{w.unit}</td>
                <td>{w.targetQty.toLocaleString()}</td>
                <td>{w.accomplishedQty.toLocaleString()}</td>
                <td>
                  <div className={styles.workItemTable ? "" : ""}>
                    <span className={`${styles.badge} ${w.percentage >= 80 ? styles.active : w.percentage >= 50 ? styles.info : styles.warning}`}>
                      {w.percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: "#849693", fontSize: 13, margin: 0 }}>No work items recorded for this report.</p>
      )}
    </DetailCard>
  );
}

function PhotosTab({ update }: { update: ProgressUpdate }) {
  const photos = update.photosCount > 0
    ? DEMO_PHOTOS.slice(0, Math.min(update.photosCount, DEMO_PHOTOS.length))
    : [];

  return (
    <DetailCard icon={<Camera size={17} />} title={`Site Photos (${update.photosCount})`}>
      {photos.length > 0 ? (
        <div className={styles.photoGrid}>
          {photos.map((photo, i) => (
            <div key={`photo-${i}`} className={styles.photoCard}>
              <img src={photo.src} alt={photo.caption} />
              <div className={styles.photoCaption}>{photo.caption}</div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "#849693", fontSize: 13, margin: 0 }}>No photos uploaded for this progress report yet.</p>
      )}
    </DetailCard>
  );
}

export function ProgressDetailView({ updateId }: { updateId: string }) {
  const update = useMonitoringStore((state) => state.progressUpdates.find((item) => item.id === updateId));
  const [tab, setTab] = useState<Tab>("Overview");

  if (!update) {
    return (
      <div className={styles.notFound}>
        <ClipboardList size={28} />
        <h2>Progress report not found</h2>
        <p>This progress report does not exist or the page was reloaded.</p>
        <Link href="/monitoring/progress">Return to progress updates</Link>
      </div>
    );
  }

  const physDelta = update.currentPhysical - update.previousPhysical;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1>{update.projectTitle}</h1>
            <div className={styles.heroSub}>
              <span>{update.code}</span>
              <span>·</span>
              <span><MapPin size={14} /> {update.barangay ?? "Municipality-wide"}</span>
              <span>·</span>
              <span>{update.reportType} Report</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/monitoring/progress/${update.id}/edit`}>
              <Pencil size={16} /> Edit Report
            </Link>
            <Link className={styles.btnSecondary} href="/monitoring/progress">
              <ArrowLeft size={16} /> All Progress Reports
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.iconBox}>
              <ClipboardList size={28} />
            </div>
            <div className={styles.profileIdentity}>
              <h2>{update.code} — {update.reportType} Progress Report</h2>
              <p>{update.projectCode} · {update.submittedBy} · {formatPeriod(update.periodStart, update.periodEnd)}</p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${statusClass(update.status)}`}>{update.status}</span>
                <span className={styles.badge}>{update.reportType}</span>
                {update.slippageDays > 0 && (
                  <span className={`${styles.badge} ${styles.danger}`}>{update.slippageDays}d behind</span>
                )}
              </div>
            </div>
          </header>

          <section className={styles.metricStrip} aria-label="Progress summary">
            <article>
              <Gauge size={20} />
              <span>Physical progress</span>
              <strong>{update.currentPhysical}%</strong>
              <div className={styles.metricProgress}>
                <i style={{ width: `${update.currentPhysical}%` }} />
              </div>
            </article>
            <article>
              <Gauge size={20} />
              <span>Financial progress</span>
              <strong>{update.currentFinancial}%</strong>
              <div className={styles.metricProgress}>
                <i style={{ width: `${update.currentFinancial}%` }} />
              </div>
            </article>
            <article>
              <CalendarClock size={20} />
              <span>Reporting period</span>
              <strong>{formatPeriod(update.periodStart, update.periodEnd)}</strong>
              <small>{update.submittedDate ? `Submitted ${formatShortDate(update.submittedDate)}` : "Not yet submitted"}</small>
            </article>
            <article>
              <Hammer size={20} />
              <span>Work items</span>
              <strong>{update.workItems.length}</strong>
              <small>{physDelta > 0 ? `+${physDelta}% physical this period` : "No physical change"}</small>
            </article>
          </section>

          <nav className={styles.tabs} aria-label="Report details">
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
            {tab === "Overview" && <OverviewTab update={update} />}
            {tab === "Work Items" && <WorkItemsTab update={update} />}
            {tab === "Photos" && <PhotosTab update={update} />}
          </div>
        </section>
      </div>
    </div>
  );
}
