"use client";

import { create } from "zustand";

import type { ProjectTypeRecord } from "../data/project-type-data";
import { PROJECT_TYPE_RECORDS } from "../data/project-type-data";

export type ProjectTypeInput = {
  name: string;
  description: string;
  iconKey: string;
  color: string;
  department: string;
  eligibleFunds: string[];
  active: boolean;
};

type ProjectTypeState = {
  types: ProjectTypeRecord[];
  nextSequence: number;
  addType: (input: ProjectTypeInput) => ProjectTypeRecord;
  updateType: (id: string, input: ProjectTypeInput) => ProjectTypeRecord | undefined;
  toggleActive: (id: string) => ProjectTypeRecord | undefined;
  getTypeById: (id: string) => ProjectTypeRecord | undefined;
};

export const useProjectTypeStore = create<ProjectTypeState>((set, get) => ({
  types: PROJECT_TYPE_RECORDS,
  nextSequence: PROJECT_TYPE_RECORDS.length + 1,

  addType: (input) => {
    const sequence = get().nextSequence;
    const id = input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const icon = ICON_MAP[input.iconKey] ?? ICON_MAP["layers"];
    const record: ProjectTypeRecord = {
      id: `${id}-${sequence}`,
      name: input.name,
      description: input.description,
      icon: icon,
      iconKey: input.iconKey,
      color: input.color,
      department: input.department,
      eligibleFunds: input.eligibleFunds,
      active: input.active,
    };
    set((state) => ({
      types: [...state.types, record],
      nextSequence: sequence + 1,
    }));
    return record;
  },

  updateType: (id, input) => {
    const current = get().types.find((t) => t.id === id);
    if (!current) return undefined;
    const icon = ICON_MAP[input.iconKey] ?? current.icon;
    const updated: ProjectTypeRecord = {
      ...current,
      name: input.name,
      description: input.description,
      icon,
      iconKey: input.iconKey,
      color: input.color,
      department: input.department,
      eligibleFunds: input.eligibleFunds,
      active: input.active,
    };
    set((state) => ({
      types: state.types.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  toggleActive: (id) => {
    const current = get().types.find((t) => t.id === id);
    if (!current) return undefined;
    const updated = { ...current, active: !current.active };
    set((state) => ({
      types: state.types.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  getTypeById: (id) => get().types.find((t) => t.id === id),
}));

import {
  Building2,
  Cable,
  CloudRain,
  Droplets,
  Fish,
  GraduationCap,
  HandHeart,
  Laptop,
  Layers,
  Leaf,
  Monitor,
  ShieldCheck,
  Tractor,
  Truck,
  Waves,
  Wrench,
  Zap,
  Home,
  Heart,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  droplets: Droplets,
  "shield-check": ShieldCheck,
  "cloud-rain": CloudRain,
  waves: Waves,
  "graduation-cap": GraduationCap,
  cable: Cable,
  tractor: Tractor,
  building2: Building2,
  monitor: Monitor,
  laptop: Laptop,
  fish: Fish,
  "hand-heart": HandHeart,
  leaf: Leaf,
  wrench: Wrench,
  zap: Zap,
  home: Home,
  heart: Heart,
  globe: Globe,
  layers: Layers,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export const COLOR_OPTIONS = [
  "#5c7cba",
  "#3fa0c8",
  "#e06c6c",
  "#d8932d",
  "#2e8b9a",
  "#7c5cc8",
  "#6a8e6d",
  "#8b7d42",
  "#6b7e94",
  "#5a7dba",
  "#c9a236",
  "#2e7ba0",
  "#c76a8e",
  "#3c8c5e",
];
