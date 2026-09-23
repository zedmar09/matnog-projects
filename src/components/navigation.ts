import type { LucideIcon } from "lucide-react";
import { LayoutDashboard } from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
];
