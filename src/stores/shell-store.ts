import { create } from "zustand";

export type JurisdictionScope = "municipal" | "all-barangays" | "poblacion" | "gadgaron" | "sinalmacan";

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
