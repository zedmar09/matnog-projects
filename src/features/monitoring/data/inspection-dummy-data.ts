import { createProjectDummyData } from "@/features/project-registry/data/project-dummy-data";

import type { Inspection, InspectionFinding, InspectionRating, InspectionStatus, InspectionType } from "../types/inspection";

const inspectors = [
  ["Engr. Carlos M. Reyes", "Municipal Engineer"],
  ["Engr. Maria D. Santos", "Assistant Municipal Engineer"],
  ["Ar. Noel B. Fronda", "Municipal Planning Officer"],
  ["Engr. Rafael T. Dizon", "Project Engineer"],
  ["LGOO Ana P. Santos", "Local Government Operations Officer"],
] as const;

const inspectionTypes: InspectionType[] = [
  "Routine",
  "Milestone",
  "Pre-Final",
  "Final",
  "Spot Check",
  "Follow-up",
];

const statuses: InspectionStatus[] = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Completed",
  "Completed",
  "Follow-up Required",
  "Cancelled",
];

const ratings: InspectionRating[] = [
  "Satisfactory",
  "Satisfactory",
  "Satisfactory",
  "Needs Improvement",
  "Unsatisfactory",
];

const findingAreas = [
  "Structural works",
  "Concrete quality",
  "Steel reinforcement",
  "Drainage alignment",
  "Excavation depth",
  "Material storage",
  "Safety compliance",
  "Workmanship quality",
  "Site cleanliness",
  "Road grading",
];

const observations = [
  "Work meets approved design specifications and quality standards.",
  "Minor deviation observed in alignment; within acceptable tolerance.",
  "Concrete curing period was not fully observed on recent pour.",
  "Rebar spacing does not match the approved structural plan.",
  "Materials stored improperly; exposed to weather conditions.",
  "Safety signage and barricades are properly installed on site.",
  "Excavation depth exceeds specification; requires backfill correction.",
  "Surface finish quality is below acceptable standards.",
  "Work area is clean and organized; debris properly managed.",
  "Grading elevation is consistent with the approved road profile.",
];

const actions = [
  "No action required. Continue with approved work schedule.",
  "Monitor alignment during next pour cycle.",
  "Ensure 7-day curing period is observed for all future pours.",
  "Contractor to submit corrective action plan within 5 working days.",
  "Relocate materials to covered storage area immediately.",
  "Maintain current safety measures throughout project duration.",
  "Backfill to specified level before proceeding with next phase.",
  "Redo affected surface to meet quality standards.",
  "Continue current housekeeping practices.",
  "Verify elevation at 50m intervals on next inspection.",
];

let seed = 420_2026;

function random() {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
}

function isoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function generateFindings(index: number, status: InspectionStatus): InspectionFinding[] {
  if (status === "Scheduled" || status === "Cancelled") return [];
  const count = 2 + (index % 3);
  return Array.from({ length: count }, (_, i) => {
    const areaIdx = (index * 3 + i) % findingAreas.length;
    const rating: InspectionRating =
      i === 0 ? ratings[index % ratings.length] : ratings[(index + i) % ratings.length];
    return {
      id: `finding-${index}-${i + 1}`,
      area: findingAreas[areaIdx],
      observation: observations[areaIdx],
      rating,
      actionRequired: actions[areaIdx],
    };
  });
}

export function createInspectionDummyData(): Inspection[] {
  seed = 420_2026;
  const projects = createProjectDummyData(150);

  const inspectable = projects.filter(
    (p) =>
      ["Implementation", "Inspection", "Closeout", "Completed"].includes(p.deliveryStage) ||
      (p.deliveryStage === "Procurement" && p.physicalProgress > 0),
  );

  return inspectable.flatMap((project, projectIdx) => {
    const inspectionCount = project.deliveryStage === "Completed" ? 3 : project.deliveryStage === "Inspection" ? 2 : 1;

    return Array.from({ length: inspectionCount }, (_, inspIdx) => {
      const index = projectIdx * 3 + inspIdx + 1;
      const status = statuses[index % statuses.length];
      const type: InspectionType =
        inspIdx === 0
          ? project.deliveryStage === "Completed"
            ? "Final"
            : "Routine"
          : inspIdx === 1
            ? project.deliveryStage === "Completed"
              ? "Pre-Final"
              : "Milestone"
            : "Routine";
      const [inspectorName, inspectorDesig] = inspectors[index % inspectors.length];
      const scheduledMonth = 5 + (index % 4);
      const scheduledDay = 1 + (index % 25);
      const findings = generateFindings(index, status);
      const overallRating: InspectionRating =
        status === "Scheduled" || status === "Cancelled"
          ? "Not Assessed"
          : ratings[index % ratings.length];
      const physicalAtInspection =
        status === "Completed" || status === "Follow-up Required"
          ? Math.min(100, project.physicalProgress - (inspIdx * 15) + Math.round(random() * 10))
          : project.physicalProgress;
      const financialAtInspection =
        status === "Completed" || status === "Follow-up Required"
          ? Math.min(100, project.financialProgress - (inspIdx * 12) + Math.round(random() * 8))
          : project.financialProgress;

      return {
        id: `inspection-${String(index).padStart(4, "0")}`,
        code: `INS-2026-${String(index).padStart(3, "0")}`,
        projectId: project.id,
        projectCode: project.code,
        projectTitle: project.title,
        barangay: project.barangay,
        projectType: project.projectType,
        inspectionType: type,
        status,
        scheduledDate: isoDate(2026, scheduledMonth, scheduledDay),
        completedDate:
          status === "Completed" || status === "Follow-up Required"
            ? isoDate(2026, scheduledMonth, Math.min(28, scheduledDay + 2))
            : null,
        inspector: inspectorName,
        inspectorDesignation: inspectorDesig,
        physicalProgressAtInspection: Math.max(0, physicalAtInspection),
        financialProgressAtInspection: Math.max(0, financialAtInspection),
        overallRating,
        findings,
        remarks:
          status === "Completed"
            ? "Inspection completed as scheduled. All items documented."
            : status === "Follow-up Required"
              ? "Follow-up inspection needed to verify corrective actions."
              : status === "In Progress"
                ? "On-site inspection is currently underway."
                : status === "Cancelled"
                  ? "Inspection postponed due to inclement weather."
                  : "Inspection scheduled per approved monitoring plan.",
        photosCount: status === "Completed" || status === "Follow-up Required" ? 4 + (index % 9) : 0,
        contractor: project.contractor,
        lastUpdated: isoDate(2026, 8, Math.max(1, 23 - (index % 15))),
      };
    });
  });
}
