import type { Project } from "../types/project";

const DOCUMENT_GROUPS = ["Planning", "Funding", "Procurement", "Implementation", "Inspection"] as const;

export function getProjectDetailSnapshot(project: Project) {
  const readinessItems = [
    { label: "Appropriation confirmed", complete: project.appropriation > 0 },
    { label: "Design and program of work approved", complete: project.readinessPercent >= 55 },
    { label: "Project site secured", complete: project.readinessPercent >= 68 },
    { label: "Right-of-way clearance", complete: project.readinessPercent >= 76 },
    { label: "Required permits attached", complete: project.readinessPercent >= 86 },
    { label: "Council authority obtained", complete: project.readinessPercent >= 96 },
  ];

  const documentGroups = DOCUMENT_GROUPS.map((label, index) => {
    const base = Math.floor(project.documentCount / DOCUMENT_GROUPS.length);
    const count = base + (index < project.documentCount % DOCUMENT_GROUPS.length ? 1 : 0);
    const complete = Math.max(0, Math.min(count, Math.round(count * (project.documentCompleteness / 100))));
    return { label, count, complete };
  });

  const inspectionCount = project.physicalProgress > 0 ? Math.max(1, Math.floor(project.physicalProgress / 18)) : 0;
  const issueCount =
    project.riskLevel === "Critical" ? 4 : project.riskLevel === "High" ? 2 : project.riskLevel === "Moderate" ? 1 : 0;
  const billingCount = project.financialProgress > 0 ? Math.max(1, Math.floor(project.financialProgress / 25)) : 0;

  return {
    readinessItems,
    documentGroups,
    inspectionCount,
    issueCount,
    resolvedIssues: Math.max(0, issueCount - (project.slippageDays > 0 ? 1 : 0)),
    photoCount: inspectionCount * 6,
    testCount: Math.max(0, inspectionCount - 1),
    billingCount,
    retention: Math.round(project.disbursement * 0.1),
    contractValue: project.obligation || project.budget,
  };
}
