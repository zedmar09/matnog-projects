"use client";

import { create } from "zustand";
import { createSitePhotoDummyData } from "../data/site-photo-dummy-data";
import type { SitePhoto, SitePhotoInput, SitePhotoStatus } from "../types/site-photo";

type SitePhotoStore = {
  photos: SitePhoto[];
  addPhoto: (input: SitePhotoInput) => SitePhoto;
  updatePhoto: (id: string, input: Partial<SitePhotoInput>) => SitePhoto | undefined;
  reviewPhoto: (
    id: string,
    status: Extract<SitePhotoStatus, "Verified" | "Rejected">,
    reviewer: string,
    note: string,
  ) => SitePhoto | undefined;
  archivePhoto: (id: string) => SitePhoto | undefined;
};

const seed = createSitePhotoDummyData();
const TODAY = "2026-09-24";

export const useSitePhotoStore = create<SitePhotoStore>((set, get) => ({
  photos: seed,
  addPhoto: (input) => {
    const sequence = get().photos.length + 1;
    const photo: SitePhoto = {
      ...input,
      id: `site-photo-session-${sequence}`,
      code: `PHT-2026-${String(sequence).padStart(3, "0")}`,
      status: "Pending Verification",
      verifiedBy: null,
      verifiedAt: null,
      reviewNote: "",
      createdAt: TODAY,
      updatedAt: TODAY,
    };
    set((state) => ({ photos: [photo, ...state.photos] }));
    return photo;
  },
  updatePhoto: (id, input) => {
    const current = get().photos.find((photo) => photo.id === id);
    if (!current) return undefined;
    const updated = { ...current, ...input, id: current.id, code: current.code, updatedAt: TODAY };
    set((state) => ({ photos: state.photos.map((photo) => (photo.id === id ? updated : photo)) }));
    return updated;
  },
  reviewPhoto: (id, status, reviewer, reviewNote) => {
    const current = get().photos.find((photo) => photo.id === id);
    if (!current) return undefined;
    const updated = { ...current, status, verifiedBy: reviewer, verifiedAt: TODAY, reviewNote, updatedAt: TODAY };
    set((state) => ({ photos: state.photos.map((photo) => (photo.id === id ? updated : photo)) }));
    return updated;
  },
  archivePhoto: (id) => {
    const current = get().photos.find((photo) => photo.id === id);
    if (!current) return undefined;
    const updated = { ...current, status: "Archived" as const, updatedAt: TODAY };
    set((state) => ({ photos: state.photos.map((photo) => (photo.id === id ? updated : photo)) }));
    return updated;
  },
}));
