"use client";

import {
  Archive,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import { useMonitoringStore } from "../stores/monitoring-store";
import { useSitePhotoStore } from "../stores/site-photo-store";
import type {
  SitePhoto,
  SitePhotoCategory,
  SitePhotoInput,
  SitePhotoSource,
  SitePhotoStatus,
} from "../types/site-photo";

import styles from "./site-photo-library.module.css";

const SOURCES: SitePhotoSource[] = ["Inspection", "Progress Update", "Standalone Site Visit"];
const CATEGORIES: SitePhotoCategory[] = [
  "Before Work",
  "Work in Progress",
  "Completed Work",
  "Issue",
  "Corrective Action",
];
const STATUSES: SitePhotoStatus[] = ["Pending Verification", "Verified", "Rejected", "Archived"];
const IMAGE_ASSETS = [1, 2, 3, 4, 5].map((number) => `/images/inspections/inspection-${number}.jpg`);

type Filters = {
  search: string;
  status: SitePhotoStatus | "all";
  source: SitePhotoSource | "all";
  category: SitePhotoCategory | "all";
  barangay: string;
  projectId: string;
  uploader: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "all",
  source: "all",
  category: "all",
  barangay: "all",
  projectId: "all",
  uploader: "all",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: SitePhotoStatus) {
  if (status === "Verified") return styles.statusVerified;
  if (status === "Rejected") return styles.statusRejected;
  if (status === "Archived") return styles.statusArchived;
  return styles.statusPending;
}

function emptyDraft(projects: ReturnType<typeof useProjectRegistryStore.getState>["projects"]): SitePhotoInput {
  const project = projects[0];
  return {
    projectId: project?.id ?? "",
    projectCode: project?.code ?? "",
    projectTitle: project?.title ?? "",
    barangay: project?.barangay ?? null,
    source: "Standalone Site Visit",
    sourceRecordId: null,
    sourceRecordCode: null,
    category: "Work in Progress",
    imagePath: IMAGE_ASSETS[0],
    caption: "",
    capturedAt: "2026-09-24",
    uploadedBy: "Engr. Carlos M. Reyes",
    latitude: 12.5852,
    longitude: 124.0866,
    device: "GeoCam Field Device",
  };
}

function draftFromPhoto(photo: SitePhoto): SitePhotoInput {
  return {
    projectId: photo.projectId,
    projectCode: photo.projectCode,
    projectTitle: photo.projectTitle,
    barangay: photo.barangay,
    source: photo.source,
    sourceRecordId: photo.sourceRecordId,
    sourceRecordCode: photo.sourceRecordCode,
    category: photo.category,
    imagePath: photo.imagePath,
    caption: photo.caption,
    capturedAt: photo.capturedAt,
    uploadedBy: photo.uploadedBy,
    latitude: photo.latitude,
    longitude: photo.longitude,
    device: photo.device,
  };
}

export function SitePhotoLibraryView() {
  const photos = useSitePhotoStore((state) => state.photos);
  const addPhoto = useSitePhotoStore((state) => state.addPhoto);
  const updatePhoto = useSitePhotoStore((state) => state.updatePhoto);
  const reviewPhoto = useSitePhotoStore((state) => state.reviewPhoto);
  const archivePhoto = useSitePhotoStore((state) => state.archivePhoto);
  const projects = useProjectRegistryStore((state) => state.projects);
  const inspections = useMonitoringStore((state) => state.inspections);
  const progressUpdates = useMonitoringStore((state) => state.progressUpdates);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedId, setSelectedId] = useState(photos[0]?.id ?? "");
  const [formMode, setFormMode] = useState<"new" | "edit" | null>(null);
  const [draft, setDraft] = useState<SitePhotoInput>(() => emptyDraft(projects));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewMode, setReviewMode] = useState<"Verified" | "Rejected" | null>(null);
  const [reviewer, setReviewer] = useState("Engr. Maria D. Santos");
  const [reviewNote, setReviewNote] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [toast, setToast] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const uploaders = useMemo(() => [...new Set(photos.map((photo) => photo.uploadedBy))].sort(), [photos]);
  const activeFilterCount = [
    filters.status,
    filters.source,
    filters.category,
    filters.barangay,
    filters.projectId,
    filters.uploader,
  ].filter((value) => value !== "all").length;

  const visiblePhotos = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return photos
      .filter((photo) => {
        if (
          query &&
          !`${photo.code} ${photo.projectCode} ${photo.projectTitle} ${photo.caption} ${photo.barangay ?? ""} ${photo.uploadedBy}`
            .toLowerCase()
            .includes(query)
        )
          return false;
        if (filters.status !== "all" && photo.status !== filters.status) return false;
        if (filters.source !== "all" && photo.source !== filters.source) return false;
        if (filters.category !== "all" && photo.category !== filters.category) return false;
        if (filters.projectId !== "all" && photo.projectId !== filters.projectId) return false;
        if (filters.uploader !== "all" && photo.uploadedBy !== filters.uploader) return false;
        if (filters.barangay !== "all") {
          if (filters.barangay === "municipal" && photo.barangay !== null) return false;
          if (filters.barangay !== "municipal" && photo.barangay !== filters.barangay) return false;
        }
        return true;
      })
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }, [photos, deferredSearch, filters]);

  const totalPages = Math.max(1, Math.ceil(visiblePhotos.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagePhotos = visiblePhotos.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = pagePhotos.find((photo) => photo.id === selectedId) ?? pagePhotos[0] ?? null;
  const activePhotos = photos.filter((photo) => photo.status !== "Archived");
  const stats = {
    total: activePhotos.length,
    projects: new Set(activePhotos.map((photo) => photo.projectId)).size,
    geotagged: activePhotos.filter((photo) => photo.latitude !== null && photo.longitude !== null).length,
    pending: activePhotos.filter((photo) => photo.status === "Pending Verification").length,
  };

  const relatedRecords = useMemo(() => {
    if (draft.source === "Inspection") {
      return inspections
        .filter((item) => item.projectId === draft.projectId)
        .map((item) => ({ id: item.id, code: item.code }));
    }
    if (draft.source === "Progress Update") {
      return progressUpdates
        .filter((item) => item.projectId === draft.projectId)
        .map((item) => ({ id: item.id, code: item.code }));
    }
    return [];
  }, [draft.projectId, draft.source, inspections, progressUpdates]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function openNew() {
    setDraft(emptyDraft(projects));
    setErrors({});
    setFormMode("new");
  }

  function openEdit() {
    if (!selected) return;
    setDraft(draftFromPhoto(selected));
    setErrors({});
    setFormMode("edit");
  }

  function updateProject(projectId: string) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setDraft((current) => ({
      ...current,
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      barangay: project.barangay,
      sourceRecordId: null,
      sourceRecordCode: null,
    }));
  }

  function updateSource(source: SitePhotoSource) {
    setDraft((current) => ({ ...current, source, sourceRecordId: null, sourceRecordCode: null }));
  }

  function updateRelatedRecord(recordId: string) {
    const record = relatedRecords.find((item) => item.id === recordId);
    setDraft((current) => ({
      ...current,
      sourceRecordId: record?.id ?? null,
      sourceRecordCode: record?.code ?? null,
    }));
  }

  function saveDraft() {
    const nextErrors: Record<string, string> = {};
    if (!draft.projectId) nextErrors.projectId = "Select a project.";
    if (!draft.caption.trim()) nextErrors.caption = "Add an evidence caption.";
    if (!draft.capturedAt) nextErrors.capturedAt = "Select the capture date.";
    if (!draft.uploadedBy.trim()) nextErrors.uploadedBy = "Enter the uploader.";
    if (draft.latitude === null || draft.longitude === null) nextErrors.location = "Enter both GPS coordinates.";
    if (draft.source !== "Standalone Site Visit" && !draft.sourceRecordId)
      nextErrors.sourceRecord = "Select the linked monitoring record.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (formMode === "edit" && selected) {
      updatePhoto(selected.id, { ...draft, caption: draft.caption.trim(), uploadedBy: draft.uploadedBy.trim() });
      setToast(`${selected.code} metadata updated.`);
    } else {
      const created = addPhoto({ ...draft, caption: draft.caption.trim(), uploadedBy: draft.uploadedBy.trim() });
      setSelectedId(created.id);
      setToast(`${created.code} added for verification.`);
    }
    setFormMode(null);
  }

  function confirmReview() {
    if (!selected || !reviewMode || !reviewer.trim()) return;
    if (reviewMode === "Rejected" && !reviewNote.trim()) return;
    reviewPhoto(selected.id, reviewMode, reviewer.trim(), reviewNote.trim());
    setToast(`${selected.code} marked ${reviewMode.toLowerCase()}.`);
    setReviewMode(null);
    setReviewNote("");
  }

  function confirmArchive() {
    if (!selected) return;
    archivePhoto(selected.id);
    setToast(`${selected.code} archived.`);
    setArchiveOpen(false);
  }

  function exportEvidence() {
    setToast(`${visiblePhotos.length} photo records prepared for export.`);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Monitoring evidence</p>
            <h1>Site Photos</h1>
            <p>Review, verify, and trace field images across municipal and barangay-funded projects.</p>
          </div>
          <div className={styles.heroActions}>
            <button type="button" className={styles.btnPrimary} onClick={openNew}>
              <Plus size={16} /> Add Site Photos
            </button>
            <button type="button" className={styles.btnSecondary} onClick={exportEvidence}>
              <Download size={16} /> Export Evidence
            </button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.summaryGrid} aria-label="Site photo summary">
          <article>
            <span className={styles.summaryIcon}>
              <ImageIcon size={18} />
            </span>
            <div>
              <strong>{stats.total}</strong>
              <span>Total photos</span>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}>
              <Camera size={18} />
            </span>
            <div>
              <strong>{stats.projects}</strong>
              <span>Projects covered</span>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}>
              <MapPin size={18} />
            </span>
            <div>
              <strong>{stats.geotagged}</strong>
              <span>Geo-tagged</span>
            </div>
          </article>
          <article>
            <span className={`${styles.summaryIcon} ${styles.pendingIcon}`}>
              <ShieldCheck size={18} />
            </span>
            <div>
              <strong>{stats.pending}</strong>
              <span>Pending verification</span>
            </div>
          </article>
        </section>

        <section className={styles.libraryCard}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search site photos"
                placeholder="Search project, photo code, barangay, or uploader"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value as Filters["status"])}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Photo status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.source}
              onValueChange={(value) => updateFilter("source", value as Filters["source"])}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Photo source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter("category", value as Filters["category"])}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Photo category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="button" className={styles.filterButton} onClick={() => setMoreOpen((open) => !open)}>
              <Filter size={14} /> More filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" className={styles.clearButton} onClick={resetFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {moreOpen && (
            <div className={styles.advancedFilters}>
              <div className={styles.field}>
                <span>Barangay</span>
                <Select value={filters.barangay} onValueChange={(value) => updateFilter("barangay", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All barangays</SelectItem>
                    <SelectItem value="municipal">Municipality-wide</SelectItem>
                    {MATNOG_BARANGAYS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Project</span>
                <Select value={filters.projectId} onValueChange={(value) => updateFilter("projectId", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.code} · {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <span>Uploader</span>
                <Select value={filters.uploader} onValueChange={(value) => updateFilter("uploader", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All uploaders</SelectItem>
                    {uploaders.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className={styles.resultsBar}>
            <p>
              <strong>{visiblePhotos.length}</strong> photo{visiblePhotos.length === 1 ? "" : "s"} in this view
            </p>
            <span>Evidence library · FY 2026</span>
          </div>

          <div className={styles.workspace}>
            <div className={styles.gallery}>
              {pagePhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`${styles.photoCard} ${selected?.id === photo.id ? styles.photoCardSelected : ""}`}
                  onClick={() => setSelectedId(photo.id)}
                >
                  <span className={styles.photoFrame}>
                    <Image src={photo.imagePath} alt={photo.caption} width={640} height={400} />
                    <span className={`${styles.statusBadge} ${statusTone(photo.status)}`}>{photo.status}</span>
                    {photo.latitude !== null && photo.longitude !== null && (
                      <span className={styles.geoBadge}>
                        <MapPin size={11} /> GPS
                      </span>
                    )}
                  </span>
                  <span className={styles.photoContent}>
                    <span className={styles.photoCode}>
                      {photo.code}
                      <span>{photo.category}</span>
                    </span>
                    <strong>{photo.projectTitle}</strong>
                    <span className={styles.photoCaption}>{photo.caption}</span>
                    <span className={styles.photoMeta}>
                      <span>
                        <CalendarDays size={12} /> {formatDate(photo.capturedAt)}
                      </span>
                      <span>
                        <MapPin size={12} /> {photo.barangay ?? "Municipality-wide"}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
              {visiblePhotos.length === 0 && (
                <div className={styles.emptyState}>
                  <ImageIcon size={30} />
                  <h3>No photos match these filters</h3>
                  <p>Clear a filter or add a new site photo record.</p>
                  <button type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <aside className={styles.detailPanel}>
              {selected ? (
                <>
                  <div className={styles.detailImage}>
                    <Image src={selected.imagePath} alt={selected.caption} width={720} height={450} priority />
                  </div>
                  <div className={styles.detailHeader}>
                    <div>
                      <span>{selected.code}</span>
                      <h2>Photo evidence</h2>
                    </div>
                    <span className={`${styles.statusBadge} ${statusTone(selected.status)}`}>{selected.status}</span>
                  </div>
                  <p className={styles.detailCaption}>{selected.caption}</p>
                  {selected.reviewNote && (
                    <div className={styles.reviewNote}>
                      <strong>Review note</strong>
                      <p>{selected.reviewNote}</p>
                    </div>
                  )}
                  <dl className={styles.detailList}>
                    <div>
                      <dt>Project</dt>
                      <dd>
                        {selected.projectCode}
                        <br />
                        <strong>{selected.projectTitle}</strong>
                      </dd>
                    </div>
                    <div>
                      <dt>Barangay</dt>
                      <dd>{selected.barangay ?? "Municipality-wide"}</dd>
                    </div>
                    <div>
                      <dt>Captured</dt>
                      <dd>{formatDate(selected.capturedAt)}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>
                        {selected.source}
                        {selected.sourceRecordCode ? ` · ${selected.sourceRecordCode}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Uploaded by</dt>
                      <dd>{selected.uploadedBy}</dd>
                    </div>
                    <div>
                      <dt>GPS coordinates</dt>
                      <dd>
                        {selected.latitude !== null && selected.longitude !== null
                          ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
                          : "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt>Device</dt>
                      <dd>{selected.device}</dd>
                    </div>
                    <div>
                      <dt>Reviewed by</dt>
                      <dd>
                        {selected.verifiedBy
                          ? `${selected.verifiedBy} · ${formatDate(selected.verifiedAt)}`
                          : "Awaiting review"}
                      </dd>
                    </div>
                  </dl>
                  <div className={styles.linkStack}>
                    <Link href={`/projects/${selected.projectId}`}>
                      <ExternalLink size={13} /> Open project record
                    </Link>
                    {selected.sourceRecordId && (
                      <Link
                        href={
                          selected.source === "Inspection"
                            ? `/monitoring/inspections/${selected.sourceRecordId}`
                            : `/monitoring/progress/${selected.sourceRecordId}`
                        }
                      >
                        <ExternalLink size={13} /> Open {selected.source.toLowerCase()}
                      </Link>
                    )}
                  </div>
                  <div className={styles.detailActions}>
                    <button type="button" onClick={openEdit}>
                      <Pencil size={14} /> Edit metadata
                    </button>
                    {selected.status !== "Archived" && (
                      <button type="button" onClick={() => setReviewMode("Verified")}>
                        <CheckCircle2 size={14} /> Verify
                      </button>
                    )}
                    {selected.status !== "Archived" && (
                      <button type="button" className={styles.rejectButton} onClick={() => setReviewMode("Rejected")}>
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                    {selected.status !== "Archived" && (
                      <button type="button" className={styles.archiveButton} onClick={() => setArchiveOpen(true)}>
                        <Archive size={14} /> Archive
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.detailEmpty}>
                  <Camera size={28} />
                  <p>Select a photo to view its evidence record.</p>
                </div>
              )}
            </aside>
          </div>
          {visiblePhotos.length > 0 && (
            <div className={styles.pagination}>
              <span>Photos per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className={styles.pageSizeSelect} aria-label="Photos per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[12, 24, 36].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className={styles.pageRange}>
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, visiblePhotos.length)} of{" "}
                {visiblePhotos.length}
              </span>
              <span className={styles.pageNumber}>
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous photo page"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                aria-label="Next photo page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
      </div>

      {formMode && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="photo-form-title">
            <header>
              <div>
                <span>Monitoring evidence</span>
                <h2 id="photo-form-title">{formMode === "new" ? "Add site photo" : `Edit ${selected?.code}`}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setFormMode(null)}>
                <X size={18} />
              </button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={`${styles.field} ${styles.fullField}`}>
                  <span>Project *</span>
                  <Select value={draft.projectId} onValueChange={updateProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} · {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && <em>{errors.projectId}</em>}
                </div>
                <div className={styles.field}>
                  <span>Evidence source *</span>
                  <Select value={draft.source} onValueChange={(value) => updateSource(value as SitePhotoSource)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className={styles.field}>
                  <span>Category *</span>
                  <Select
                    value={draft.category}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, category: value as SitePhotoCategory }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {draft.source !== "Standalone Site Visit" && (
                  <div className={`${styles.field} ${styles.fullField}`}>
                    <span>Related record *</span>
                    <Select value={draft.sourceRecordId ?? "none"} onValueChange={updateRelatedRecord}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select related record" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select a record</SelectItem>
                        {relatedRecords.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sourceRecord && <em>{errors.sourceRecord}</em>}
                  </div>
                )}
                <div className={styles.field}>
                  <span>Captured date *</span>
                  <input
                    type="date"
                    value={draft.capturedAt}
                    onChange={(event) => setDraft((current) => ({ ...current, capturedAt: event.target.value }))}
                  />
                  {errors.capturedAt && <em>{errors.capturedAt}</em>}
                </div>
                <label>
                  <span>Uploaded by *</span>
                  <input
                    value={draft.uploadedBy}
                    onChange={(event) => setDraft((current) => ({ ...current, uploadedBy: event.target.value }))}
                  />
                  {errors.uploadedBy && <em>{errors.uploadedBy}</em>}
                </label>
                <label>
                  <span>Latitude *</span>
                  <input
                    type="number"
                    step="0.00001"
                    value={draft.latitude ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        latitude: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Longitude *</span>
                  <input
                    type="number"
                    step="0.00001"
                    value={draft.longitude ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        longitude: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                  />
                  {errors.location && <em>{errors.location}</em>}
                </label>
                <label>
                  <span>Capture device</span>
                  <input
                    value={draft.device}
                    onChange={(event) => setDraft((current) => ({ ...current, device: event.target.value }))}
                  />
                </label>
                <div className={styles.field}>
                  <span>Photo asset</span>
                  <Select
                    value={draft.imagePath}
                    onValueChange={(value) => setDraft((current) => ({ ...current, imagePath: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_ASSETS.map((item, index) => (
                        <SelectItem key={item} value={item}>
                          Existing field photo {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className={styles.fullField}>
                  <span>Evidence caption *</span>
                  <textarea
                    rows={3}
                    value={draft.caption}
                    onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))}
                    placeholder="Describe what is visible and why it matters."
                  />
                  {errors.caption && <em>{errors.caption}</em>}
                </label>
              </div>
              <div className={styles.photoPreview}>
                <Image src={draft.imagePath} alt="Selected evidence preview" width={480} height={360} />
                <div>
                  <Upload size={15} />
                  <span>Local monitoring asset</span>
                </div>
              </div>
            </div>
            <footer>
              <button type="button" onClick={() => setFormMode(null)}>
                Cancel
              </button>
              <button type="button" className={styles.saveButton} onClick={saveDraft}>
                {formMode === "new" ? "Add for verification" : "Save changes"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {reviewMode && selected && (
        <div className={styles.modalBackdrop} role="presentation">
          <section
            className={`${styles.modal} ${styles.confirmModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <header>
              <div>
                <span>Evidence review</span>
                <h2 id="review-title">{reviewMode === "Verified" ? "Verify photo" : "Reject photo"}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setReviewMode(null)}>
                <X size={18} />
              </button>
            </header>
            <div className={styles.confirmBody}>
              <p>
                {reviewMode === "Verified"
                  ? "Confirm that the image, project link, date, and location are valid field evidence."
                  : "Return this evidence with a clear reason so the field team can correct it."}
              </p>
              <label>
                <span>Reviewed by *</span>
                <input value={reviewer} onChange={(event) => setReviewer(event.target.value)} />
              </label>
              <label>
                <span>Review note {reviewMode === "Rejected" ? "*" : ""}</span>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder={
                    reviewMode === "Rejected" ? "Explain what needs correction." : "Optional verification note."
                  }
                />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setReviewMode(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={reviewMode === "Verified" ? styles.saveButton : styles.dangerButton}
                disabled={!reviewer.trim() || (reviewMode === "Rejected" && !reviewNote.trim())}
                onClick={confirmReview}
              >
                {reviewMode === "Verified" ? "Verify evidence" : "Reject evidence"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {archiveOpen && selected && (
        <div className={styles.modalBackdrop} role="presentation">
          <section
            className={`${styles.modal} ${styles.confirmModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
          >
            <header>
              <div>
                <span>Archive evidence</span>
                <h2 id="archive-title">Archive {selected.code}?</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setArchiveOpen(false)}>
                <X size={18} />
              </button>
            </header>
            <div className={styles.confirmBody}>
              <p>
                The record stays searchable under the Archived status and remains linked to its project audit trail.
              </p>
            </div>
            <footer>
              <button type="button" onClick={() => setArchiveOpen(false)}>
                Cancel
              </button>
              <button type="button" className={styles.dangerButton} onClick={confirmArchive}>
                Archive photo
              </button>
            </footer>
          </section>
        </div>
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
