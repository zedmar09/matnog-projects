import type { LucideIcon } from "lucide-react";
import {
  Camera,
  ChartNoAxesCombined,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  TrendingUp,
} from "lucide-react";

export type NavigationChild = {
  label: string;
  href: string;
};

export type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavigationChild[];
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

function pages(base: string, entries: Array<[string, string]>): NavigationChild[] {
  return entries.map(([label, slug]) => ({ label, href: `${base}/${slug}` }));
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: "",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      {
        label: "Projects",
        icon: FolderKanban,
        children: pages("/projects", [
          ["All Projects", "all"],
          ["New Proposal", "new"],
        ]),
      },
      {
        label: "Monitoring",
        icon: ClipboardCheck,
        children: pages("/monitoring", [
          ["Inspections", "inspections"],
          ["Progress Updates", "progress"],
          ["Site Photos", "photos"],
        ]),
      },
      {
        label: "Reports",
        icon: ChartNoAxesCombined,
        children: pages("/reports", [
          ["Fund Utilization", "fund-utilization"],
          ["Barangay Performance", "barangay-performance"],
          ["Project Status", "project-status"],
        ]),
      },
      {
        label: "Settings",
        icon: Settings2,
        children: pages("/settings", [
          ["Project Types", "project-types"],
          ["Scoring Criteria", "scoring-criteria"],
        ]),
      },
    ],
  },
];

export function getNavigationLabel(pathname: string): string {
  for (const section of NAVIGATION_SECTIONS) {
    for (const item of section.items) {
      if (item.href === pathname) return item.label;
      const child = item.children?.find((entry) => entry.href === pathname);
      if (child) return child.label;
    }
  }

  return "Project Workspace";
}
