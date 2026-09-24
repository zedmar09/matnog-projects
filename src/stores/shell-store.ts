import { create } from "zustand";
import { MATNOG_BARANGAYS } from "@/data/barangays";

export type JurisdictionScope = "municipal" | "all-barangays" | (typeof MATNOG_BARANGAYS)[number];

type ShellState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  fiscalYear: string;
  jurisdiction: JurisdictionScope;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setFiscalYear: (year: string) => void;
  setJurisdiction: (scope: JurisdictionScope) => void;
};

export const useShellStore = create<ShellState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  fiscalYear: "2026",
  jurisdiction: "municipal",
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  setFiscalYear: (fiscalYear) => set({ fiscalYear }),
  setJurisdiction: (jurisdiction) => set({ jurisdiction }),
}));
