import type { SitePhoto, SitePhotoCategory, SitePhotoStatus } from "../types/site-photo";
import { createInspectionDummyData } from "./inspection-dummy-data";
import { createProgressUpdateDummyData } from "./progress-update-dummy-data";

const images = [1, 2, 3, 4, 5].map((number) => `/images/inspections/inspection-${number}.jpg`);
const captions = [
  "Completed concrete works and alignment viewed from the project approach.",
  "Ongoing structural works documented during the scheduled field visit.",
  "Installed materials and current workmanship condition at the active work area.",
  "Site safety controls, access conditions, and work-zone housekeeping.",
  "Corrective work completed following the previous inspection finding.",
];
const categories: SitePhotoCategory[] = [
  "Work in Progress",
  "Issue",
  "Corrective Action",
  "Completed Work",
  "Before Work",
];
const statuses: SitePhotoStatus[] = ["Verified", "Verified", "Pending Verification", "Verified", "Rejected"];

export function createSitePhotoDummyData(): SitePhoto[] {
  const inspections = createInspectionDummyData()
    .filter((item) => item.photosCount > 0)
    .slice(0, 24);
  const updates = createProgressUpdateDummyData()
    .filter((item) => item.photosCount > 0)
    .slice(0, 16);
  const linked = [
    ...inspections.map((item) => ({
      projectId: item.projectId,
      projectCode: item.projectCode,
      projectTitle: item.projectTitle,
      barangay: item.barangay,
      source: "Inspection" as const,
      sourceRecordId: item.id,
      sourceRecordCode: item.code,
      capturedAt: item.completedDate ?? item.scheduledDate,
      uploadedBy: item.inspector,
    })),
    ...updates.map((item) => ({
      projectId: item.projectId,
      projectCode: item.projectCode,
      projectTitle: item.projectTitle,
      barangay: item.barangay,
      source: "Progress Update" as const,
      sourceRecordId: item.id,
      sourceRecordCode: item.code,
      capturedAt: item.periodEnd,
      uploadedBy: item.submittedBy,
    })),
  ];
  return linked.map((item, index) => {
    const status = statuses[index % statuses.length];
    return {
      ...item,
      id: `site-photo-${String(index + 1).padStart(4, "0")}`,
      code: `PHT-2026-${String(index + 1).padStart(3, "0")}`,
      category: categories[index % categories.length],
      status,
      imagePath: images[index % images.length],
      caption: captions[index % captions.length],
      latitude: index % 7 === 0 ? null : 12.5852 + (index % 9) * 0.0017,
      longitude: index % 7 === 0 ? null : 124.0866 + (index % 11) * 0.0013,
      device: ["Samsung Galaxy A54", "iPhone 14", "GeoCam Field Device", "Samsung Galaxy S23"][index % 4],
      verifiedBy: status === "Verified" ? ["Engr. Carlos M. Reyes", "Engr. Maria D. Santos"][index % 2] : null,
      verifiedAt: status === "Verified" ? "2026-09-22" : null,
      reviewNote: status === "Rejected" ? "Photo location could not be confirmed from the submitted evidence." : "",
      createdAt: item.capturedAt,
      updatedAt: "2026-09-23",
    };
  });
}
