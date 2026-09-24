export type SitePhotoSource = "Inspection" | "Progress Update" | "Standalone Site Visit";
export type SitePhotoCategory = "Before Work" | "Work in Progress" | "Completed Work" | "Issue" | "Corrective Action";
export type SitePhotoStatus = "Pending Verification" | "Verified" | "Rejected" | "Archived";

export type SitePhoto = {
  id: string;
  code: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  barangay: string | null;
  source: SitePhotoSource;
  sourceRecordId: string | null;
  sourceRecordCode: string | null;
  category: SitePhotoCategory;
  status: SitePhotoStatus;
  imagePath: string;
  caption: string;
  capturedAt: string;
  uploadedBy: string;
  latitude: number | null;
  longitude: number | null;
  device: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
};

export type SitePhotoInput = Omit<
  SitePhoto,
  "id" | "code" | "verifiedBy" | "verifiedAt" | "reviewNote" | "createdAt" | "updatedAt" | "status"
>;
