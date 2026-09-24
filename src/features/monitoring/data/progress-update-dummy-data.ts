import { createProjectDummyData } from "@/features/project-registry/data/project-dummy-data";

import type { ProgressUpdate, ProgressUpdateStatus, ProgressUpdateType, WorkItem } from "../types/progress-update";

const reporters = [
  ["Engr. Carlos M. Reyes", "Municipal Engineer"],
  ["Engr. Maria D. Santos", "Assistant Municipal Engineer"],
  ["Ar. Noel B. Fronda", "Municipal Planning Officer"],
  ["Engr. Rafael T. Dizon", "Project Engineer"],
  ["LGOO Ana P. Santos", "Local Government Operations Officer"],
] as const;

const reportTypes: ProgressUpdateType[] = ["Weekly", "Bi-weekly", "Monthly", "Milestone", "Ad-hoc"];

const statuses: ProgressUpdateStatus[] = [
  "Submitted",
  "Verified",
  "Verified",
  "Submitted",
  "Draft",
  "Returned",
  "Archived",
];

const workDescriptions = [
  ["Earthworks and excavation", "cu.m."],
  ["Concrete pouring – footings", "cu.m."],
  ["Steel reinforcement installation", "kg"],
  ["Formwork erection", "sq.m."],
  ["Road base course laying", "sq.m."],
  ["Gravel compaction", "cu.m."],
  ["Masonry wall construction", "sq.m."],
  ["Roofing installation", "sq.m."],
  ["Electrical rough-in", "lot"],
  ["Plumbing rough-in", "lot"],
  ["Painting and finishing", "sq.m."],
  ["Drainage pipe laying", "l.m."],
] as const;

const issueTemplates = [
  "Intermittent rainfall caused 2-day work stoppage. Contractor adjusted schedule accordingly.",
  "Delivery of steel reinforcement bars delayed by 3 days from supplier. No critical impact on overall timeline.",
  "Minor discrepancy in elevation readings resolved on-site with the project engineer.",
  "Workforce reduced to 60% due to local fiesta. Full crew expected next reporting period.",
  "Concrete testing results within specification. Compression strength at 28 days: 4,200 PSI.",
  "No significant issues encountered during reporting period. Work proceeding as planned.",
  "Right-of-way concern raised by adjacent property owner. Coordinating with barangay officials.",
  "Material cost variance of 3.2% noted. Within allowable budget contingency.",
];

const nextStepTemplates = [
  "Continue with structural framing and begin wall construction in the next period.",
  "Complete remaining earthworks and proceed to sub-base preparation.",
  "Begin roofing installation upon delivery of pre-fabricated trusses.",
  "Conduct concrete strength test and proceed with second floor slab if passed.",
  "Install drainage outfall and connect to existing municipal system.",
  "Prepare for pre-final inspection. Complete punch list items.",
  "Mobilize additional crew to recover 2-day slippage from weather delay.",
  "Coordinate with DPWH for road tie-in at intersection point.",
];

let seed = 777_2026;

function random() {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
}

function isoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, Math.min(28, Math.max(1, day)))).toISOString().slice(0, 10);
}

function generateWorkItems(index: number, physicalProgress: number): WorkItem[] {
  const count = 2 + (index % 3);
  return Array.from({ length: count }, (_, i) => {
    const [desc, unit] = workDescriptions[(index * 3 + i) % workDescriptions.length];
    const target = 50 + Math.round(random() * 200);
    const accomplished = Math.round(target * (physicalProgress / 100) * (0.8 + random() * 0.4));
    return {
      id: `work-${index}-${i + 1}`,
      description: desc,
      unit,
      targetQty: target,
      accomplishedQty: Math.min(target, accomplished),
      percentage: Math.min(100, Math.round((Math.min(target, accomplished) / target) * 100)),
    };
  });
}

export function createProgressUpdateDummyData(): ProgressUpdate[] {
  seed = 777_2026;
  const projects = createProjectDummyData(150);

  const updatable = projects.filter(
    (p) =>
      ["Implementation", "Inspection", "Closeout", "Completed"].includes(p.deliveryStage) ||
      (p.deliveryStage === "Procurement" && p.physicalProgress > 0),
  );

  return updatable.flatMap((project, projectIdx) => {
    const updateCount =
      project.deliveryStage === "Completed"
        ? 3
        : project.deliveryStage === "Inspection" || project.deliveryStage === "Closeout"
          ? 2
          : 1;

    return Array.from({ length: updateCount }, (_, updIdx) => {
      const index = projectIdx * 3 + updIdx + 1;
      const status = statuses[index % statuses.length];
      const type: ProgressUpdateType =
        updIdx === 0
          ? reportTypes[index % reportTypes.length]
          : updIdx === 1
            ? "Monthly"
            : "Milestone";
      const [reporterName, reporterDesig] = reporters[index % reporters.length];

      const periodMonth = 4 + updIdx + (index % 3);
      const periodStartDay = 1 + (updIdx * 14);
      const periodEndDay = Math.min(28, periodStartDay + 13);

      const progressStep = updateCount > 1 ? Math.round(project.physicalProgress / updateCount) : 0;
      const previousPhysical = Math.max(0, project.physicalProgress - progressStep * (updateCount - updIdx));
      const currentPhysical = Math.min(100, previousPhysical + progressStep + (updIdx === updateCount - 1 ? project.physicalProgress - previousPhysical - progressStep : 0));

      const financialStep = updateCount > 1 ? Math.round(project.financialProgress / updateCount) : 0;
      const previousFinancial = Math.max(0, project.financialProgress - financialStep * (updateCount - updIdx));
      const currentFinancial = Math.min(100, previousFinancial + financialStep + (updIdx === updateCount - 1 ? project.financialProgress - previousFinancial - financialStep : 0));

      return {
        id: `progress-${String(index).padStart(4, "0")}`,
        code: `PRG-2026-${String(index).padStart(3, "0")}`,
        projectId: project.id,
        projectCode: project.code,
        projectTitle: project.title,
        barangay: project.barangay,
        projectType: project.projectType,
        contractor: project.contractor,
        reportType: type,
        status,
        periodStart: isoDate(2026, periodMonth, periodStartDay),
        periodEnd: isoDate(2026, periodMonth, periodEndDay),
        submittedDate:
          status === "Draft" ? null : isoDate(2026, periodMonth, periodEndDay + 2),
        submittedBy: reporterName,
        designation: reporterDesig,
        previousPhysical: Math.max(0, previousPhysical),
        currentPhysical: Math.max(0, Math.min(100, currentPhysical)),
        previousFinancial: Math.max(0, previousFinancial),
        currentFinancial: Math.max(0, Math.min(100, currentFinancial)),
        slippageDays: project.slippageDays > 0 ? Math.round(project.slippageDays * (updIdx + 1) / updateCount) : 0,
        workItems: generateWorkItems(index, currentPhysical),
        issues: issueTemplates[index % issueTemplates.length],
        nextSteps: nextStepTemplates[index % nextStepTemplates.length],
        photosCount: status === "Draft" ? 0 : 2 + (index % 6),
        lastUpdated: isoDate(2026, 8, Math.max(1, 23 - (index % 15))),
      };
    });
  });
}
