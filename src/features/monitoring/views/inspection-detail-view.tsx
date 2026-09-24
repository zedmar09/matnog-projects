"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarClock,
  Camera,
  ClipboardCheck,
  Eye,
  FileText,
  Gauge,
  MapPin,
  Pencil,
  ShieldCheck,
  User,
} from "lucide-react";

import { useMonitoringStore } from "../stores/monitoring-store";
import type { Inspection } from "../types/inspection";
import styles from "./inspection-detail.module.css";

const tabs = ["Overview", "Findings", "Photos"] as const;
type Tab = (typeof tabs)[number];

function statusClass(status: string) {
  if (status === "Completed" || status === "Satisfactory") return styles.active;
  if (status === "Cancelled" || status === "Unsatisfactory") return styles.danger;
  if (status === "Follow-up Required" || status === "Needs Improvement") return styles.warning;
  if (status === "In Progress" || status === "Scheduled") return styles.info;
  return "";
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
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

const DEMO_PHOTOS = [
  { src: "/images/inspections/inspection-1.jpg", caption: "Road surface grading and compaction" },
  { src: "/images/inspections/inspection-2.jpg", caption: "Building structure and formwork" },
  { src: "/images/inspections/inspection-3.jpg", caption: "Workers on-site operations" },
  { src: "/images/inspections/inspection-4.jpg", caption: "Foundation and concrete works" },
  { src: "/images/inspections/inspection-5.jpg", caption: "Infrastructure progress overview" },
];

function OverviewTab({ inspection }: { inspection: Inspection }) {
  return (
    <div className={styles.profileGrid}>
      <DetailCard icon={<ClipboardCheck size={17} />} title="Inspection Information">
        <Rows
          items={[
            ["Inspection code", inspection.code],
            ["Inspection type", inspection.inspectionType],
            ["Status", inspection.status],
            ["Scheduled date", formatShortDate(inspection.scheduledDate)],
            ["Completed date", inspection.completedDate ? formatShortDate(inspection.completedDate) : "Not yet completed"],
            ["Overall rating", inspection.overallRating],
            ["Remarks", inspection.remarks],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<FileText size={17} />} title="Project Information">
        <Rows
          items={[
            ["Project code", inspection.projectCode],
            ["Project title", inspection.projectTitle],
            ["Project type", inspection.projectType],
            ["Barangay", inspection.barangay ?? "Municipality-wide"],
            ["Contractor", inspection.contractor ?? "Not assigned"],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<User size={17} />} title="Inspector Details">
        <Rows
          items={[
            ["Inspector", inspection.inspector],
            ["Designation", inspection.inspectorDesignation],
          ]}
        />
      </DetailCard>

      <DetailCard icon={<Gauge size={17} />} title="Progress at Inspection">
        <Rows
          items={[
            ["Physical progress", `${inspection.physicalProgressAtInspection}%`],
            ["Financial progress", `${inspection.financialProgressAtInspection}%`],
          ]}
        />
        <div className={styles.progressBar} style={{ marginTop: 14 }}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${inspection.physicalProgressAtInspection}%` }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#344d49" }}>{inspection.physicalProgressAtInspection}%</span>
        </div>
      </DetailCard>
    </div>
  );
}

function FindingsTab({ inspection }: { inspection: Inspection }) {
  return (
    <DetailCard icon={<ShieldCheck size={17} />} title={`Inspection Findings (${inspection.findings.length})`}>
      {inspection.findings.length > 0 ? (
        inspection.findings.map((f) => (
          <div key={f.id} className={styles.findingItem}>
            <div className={styles.findingItemHeader}>
              <strong>{f.area}</strong>
              <span className={`${styles.badge} ${statusClass(f.rating)}`}>{f.rating}</span>
            </div>
            <dl className={styles.dataList}>
              <div className={styles.dataRow}><dt>Observation</dt><dd>{f.observation}</dd></div>
              <div className={styles.dataRow}><dt>Action required</dt><dd>{f.actionRequired || "None"}</dd></div>
            </dl>
          </div>
        ))
      ) : (
        <p style={{ color: "#849693", fontSize: 13, margin: 0 }}>No findings recorded for this inspection.</p>
      )}
    </DetailCard>
  );
}

function PhotosTab({ inspection }: { inspection: Inspection }) {
  const photos = inspection.photosCount > 0
    ? DEMO_PHOTOS.slice(0, Math.min(inspection.photosCount, DEMO_PHOTOS.length))
    : [];

  return (
    <DetailCard icon={<Camera size={17} />} title={`Site Photos (${inspection.photosCount})`}>
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
        <p style={{ color: "#849693", fontSize: 13, margin: 0 }}>No photos uploaded for this inspection yet.</p>
      )}
    </DetailCard>
  );
}

export function InspectionDetailView({ inspectionId }: { inspectionId: string }) {
  const inspection = useMonitoringStore((state) => state.inspections.find((item) => item.id === inspectionId));
  const [tab, setTab] = useState<Tab>("Overview");

  if (!inspection) {
    return (
      <div className={styles.notFound}>
        <ClipboardCheck size={28} />
        <h2>Inspection not found</h2>
        <p>This inspection record does not exist or the page was reloaded.</p>
        <Link href="/monitoring/inspections">Return to inspections</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1>{inspection.projectTitle}</h1>
            <div className={styles.heroSub}>
              <span>{inspection.code}</span>
              <span>·</span>
              <span><MapPin size={14} /> {inspection.barangay ?? "Municipality-wide"}</span>
              <span>·</span>
              <span>{inspection.inspectionType} Inspection</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/monitoring/inspections/${inspection.id}/edit`}>
              <Pencil size={16} /> Edit Inspection
            </Link>
            <Link className={styles.btnSecondary} href="/monitoring/inspections">
              <ArrowLeft size={16} /> All Inspections
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.iconBox}>
              <ClipboardCheck size={28} />
            </div>
            <div className={styles.profileIdentity}>
              <h2>{inspection.code} — {inspection.inspectionType} Inspection</h2>
              <p>{inspection.projectCode} · {inspection.inspector} · {formatShortDate(inspection.scheduledDate)}</p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${statusClass(inspection.status)}`}>{inspection.status}</span>
                <span className={`${styles.badge} ${statusClass(inspection.overallRating)}`}>{inspection.overallRating}</span>
                <span className={styles.badge}>{inspection.inspectionType}</span>
              </div>
            </div>
          </header>

          <section className={styles.metricStrip} aria-label="Inspection summary">
            <article>
              <Gauge size={20} />
              <span>Physical progress</span>
              <strong>{inspection.physicalProgressAtInspection}%</strong>
              <div className={styles.metricProgress}>
                <i style={{ width: `${inspection.physicalProgressAtInspection}%` }} />
              </div>
            </article>
            <article>
              <Gauge size={20} />
              <span>Financial progress</span>
              <strong>{inspection.financialProgressAtInspection}%</strong>
              <div className={styles.metricProgress}>
                <i style={{ width: `${inspection.financialProgressAtInspection}%` }} />
              </div>
            </article>
            <article>
              <CalendarClock size={20} />
              <span>Scheduled date</span>
              <strong>{formatShortDate(inspection.scheduledDate)}</strong>
              <small>{inspection.completedDate ? `Completed ${formatShortDate(inspection.completedDate)}` : "Pending completion"}</small>
            </article>
            <article>
              <Eye size={20} />
              <span>Findings</span>
              <strong>{inspection.findings.length}</strong>
              <small>{inspection.photosCount} site photos</small>
            </article>
          </section>

          <nav className={styles.tabs} aria-label="Inspection details">
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
            {tab === "Overview" && <OverviewTab inspection={inspection} />}
            {tab === "Findings" && <FindingsTab inspection={inspection} />}
            {tab === "Photos" && <PhotosTab inspection={inspection} />}
          </div>
        </section>
      </div>
    </div>
  );
}
