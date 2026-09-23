import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BadgeDollarSign,
  ChartNoAxesCombined,
  ClipboardCheck,
  FolderKanban,
  Gavel,
  HardHat,
  Inbox,
  LayoutDashboard,
  ScanSearch,
  Search,
  Settings2,
  ShieldCheck,
  Siren,
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
  emphasis?: "alert";
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
    label: "Workspace",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      {
        label: "My Work",
        icon: Inbox,
        children: pages("/my-work", [
          ["Pending Reviews", "pending-reviews"],
          ["Approvals", "approvals"],
          ["Assigned Tasks", "assigned-tasks"],
          ["Alerts & Deadlines", "alerts"],
        ]),
      },
      { label: "Project Search", href: "/project-search", icon: Search },
    ],
  },
  {
    label: "Project Lifecycle",
    items: [
      {
        label: "Project Pipeline",
        icon: FolderKanban,
        children: pages("/pipeline", [
          ["All Projects", "all-projects"],
          ["Proposal Intake", "proposal-intake"],
          ["Draft Proposals", "drafts"],
          ["Submitted Proposals", "submitted"],
          ["Constituent Requests", "constituent-requests"],
          ["Barangay BDP Proposals", "barangay-bdp"],
          ["Council-Endorsed", "council-endorsed"],
          ["Technical Review", "technical-review"],
          ["Scoring Workspace", "scoring"],
          ["Priority Ranking", "priority-ranking"],
          ["Duplicate & Overlap Review", "duplicate-review"],
          ["Prioritized", "prioritized"],
          ["Funded", "funded"],
          ["Deferred", "deferred"],
          ["Rejected", "rejected"],
        ]),
      },
      {
        label: "Planning & Funding",
        icon: BadgeDollarSign,
        children: pages("/planning-funding", [
          ["Development Plans", "development-plans"],
          ["CDP", "cdp"],
          ["LDIP", "ldip"],
          ["AIP", "aip"],
          ["Plan Linkage Review", "plan-linkage"],
          ["Fund Source Registry", "fund-sources"],
          ["Eligibility Rules", "eligibility-rules"],
          ["Barangay Funds", "barangay-funds"],
          ["Grants & Loans", "grants-loans"],
          ["Appropriations", "appropriations"],
          ["Obligations", "obligations"],
          ["Disbursements", "disbursements"],
          ["Realignments", "realignments"],
          ["Supplemental Budgets", "supplemental-budgets"],
          ["Multi-Year Projects", "multi-year"],
          ["Co-Funded Projects", "co-funded"],
          ["Fund Utilization", "fund-utilization"],
        ]),
      },
      {
        label: "Readiness",
        icon: ClipboardCheck,
        children: pages("/readiness", [
          ["Readiness Dashboard", "dashboard"],
          ["Gate Assessment", "gate-assessment"],
          ["Stalled Projects", "stalled-projects"],
          ["Overrides", "overrides"],
          ["Project-Type Checklists", "checklists"],
          ["Required Documents", "required-documents"],
          ["Approval Rules", "approval-rules"],
        ]),
      },
      {
        label: "Procurement",
        icon: Gavel,
        children: pages("/procurement", [
          ["Procurement Dashboard", "dashboard"],
          ["Annual Procurement Plan", "app"],
          ["PPMP", "ppmp"],
          ["Procurement Activities", "activities"],
          ["Mode Selection", "mode-selection"],
          ["Schedules & Conferences", "schedules"],
          ["Bid Opening", "bid-opening"],
          ["Eligibility Review", "eligibility-review"],
          ["Post-Qualification", "post-qualification"],
          ["BAC Resolutions", "bac-resolutions"],
          ["Notices of Award", "notices-of-award"],
          ["Contracts", "contracts"],
          ["Notices to Proceed", "notices-to-proceed"],
          ["Failed Bids & Re-bids", "failed-bids"],
          ["Securities & Expiries", "securities"],
          ["Contractors & Suppliers", "contractors-suppliers"],
          ["Performance History", "performance-history"],
          ["Blacklist Monitoring", "blacklist"],
          ["External Postings", "external-postings"],
        ]),
      },
      {
        label: "Implementation",
        icon: HardHat,
        children: pages("/implementation", [
          ["Active Projects", "active-projects"],
          ["Programs of Work", "programs-of-work"],
          ["Baseline Schedules", "baseline-schedules"],
          ["S-Curves", "s-curves"],
          ["Progress Updates", "progress-updates"],
          ["Progress Billings", "progress-billings"],
          ["Retention", "retention"],
          ["Variation Orders", "variation-orders"],
          ["Time Extensions", "time-extensions"],
          ["Suspension & Resumption", "suspension-resumption"],
          ["Liquidated Damages", "liquidated-damages"],
          ["Contract Documents", "contract-documents"],
        ]),
      },
      {
        label: "Field Monitoring",
        icon: ScanSearch,
        children: pages("/field-monitoring", [
          ["Inspection Dashboard", "dashboard"],
          ["Inspection Schedule", "schedule"],
          ["Mobile Inspections", "mobile-inspections"],
          ["Offline Sync Queue", "offline-sync"],
          ["Site Issues", "site-issues"],
          ["Material Test Results", "material-tests"],
          ["Punch Lists", "punch-lists"],
          ["Photo Evidence", "photo-evidence"],
          ["Project Map", "project-map"],
        ]),
      },
      {
        label: "Completion & Assets",
        icon: BadgeCheck,
        children: pages("/completion-assets", [
          ["Projects for Closeout", "closeout"],
          ["Final Inspections", "final-inspections"],
          ["Acceptance", "acceptance"],
          ["Completion Certificates", "certificates"],
          ["As-Built Documents", "as-built-documents"],
          ["Turnover Records", "turnover"],
          ["Asset Registration", "asset-registration"],
          ["Warranty Monitoring", "warranties"],
          ["Maintenance Schedules", "maintenance"],
        ]),
      },
      {
        label: "Emergency Projects",
        icon: Siren,
        emphasis: "alert",
        children: pages("/emergency-projects", [
          ["Emergency Dashboard", "dashboard"],
          ["Emergency Project Intake", "intake"],
          ["Abbreviated Approvals", "approvals"],
          ["Damage Assessment Links", "damage-assessments"],
          ["Post-Hoc Requirements", "post-hoc-requirements"],
          ["Emergency Spending", "spending"],
          ["Barangay Emergency Reports", "barangay-reports"],
        ]),
      },
    ],
  },
  {
    label: "Oversight",
    items: [
      {
        label: "Portfolio & Reports",
        icon: ChartNoAxesCombined,
        children: pages("/portfolio-reports", [
          ["Portfolio Dashboard", "dashboard"],
          ["Projects at Risk", "projects-at-risk"],
          ["Financial Performance", "financial-performance"],
          ["Procurement Analytics", "procurement-analytics"],
          ["Barangay Performance", "barangay-performance"],
          ["Fund Utilization", "fund-utilization"],
          ["Stalled Readiness Gates", "stalled-gates"],
          ["Documentation Completeness", "documentation-completeness"],
          ["Execution History", "execution-history"],
          ["Technical Assistance Flags", "technical-assistance"],
          ["GAD Reports", "gad"],
          ["Climate Action Reports", "climate-action"],
          ["DRR Reports", "drr"],
          ["Senior & PWD Reports", "senior-pwd"],
          ["SDG Reports", "sdg"],
          ["Scheduled Exports", "scheduled-exports"],
        ]),
      },
      {
        label: "Transparency & Audit",
        icon: ShieldCheck,
        children: pages("/transparency-audit", [
          ["Public Project Portal", "public-portal"],
          ["Procurement Notices", "procurement-notices"],
          ["Awards Publication", "awards-publication"],
          ["Fund Utilization Summary", "fund-utilization"],
          ["Constituent Feedback", "constituent-feedback"],
          ["Audit Trail", "audit-trail"],
          ["Audit Observations", "audit-observations"],
          ["Evidence Pack Export", "evidence-packs"],
          ["Document Completeness", "document-completeness"],
        ]),
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Administration",
        icon: Settings2,
        children: pages("/administration", [
          ["Project Types", "project-types"],
          ["Scoring Criteria", "scoring-criteria"],
          ["Fund Eligibility Rules", "fund-eligibility"],
          ["Workflows & Approvals", "workflows"],
          ["Readiness Checklists", "readiness-checklists"],
          ["BAC Composition", "bac-composition"],
          ["Thematic Tags", "thematic-tags"],
          ["Fiscal Years", "fiscal-years"],
          ["Notifications", "notifications"],
          ["Users & Roles", "users-roles"],
          ["System Preferences", "preferences"],
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
