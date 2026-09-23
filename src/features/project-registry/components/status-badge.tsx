import type { ProjectDeliveryStage, ProjectPipelineStatus, ProjectRiskLevel } from "../types/project";

import styles from "./status-badge.module.css";

type BadgeValue = ProjectPipelineStatus | ProjectDeliveryStage | ProjectRiskLevel | "Delayed" | "Due soon" | "Upcoming";

export function StatusBadge({ value }: { value: BadgeValue }) {
  const tone =
    value === "Critical" || value === "Rejected" || value === "On Hold" || value === "Delayed"
      ? styles.badgeDanger
      : value === "High" || value === "Deferred" || value === "Due soon" || value === "Readiness"
        ? styles.badgeWarning
        : value === "Funded" || value === "Low"
          ? styles.badgeSuccess
          : value === "Moderate" || value === "Under Review" || value === "Submitted" || value === "Inspection"
            ? styles.badgeInfo
            : styles.badgeNeutral;

  return <span className={`${styles.badge} ${tone}`}>{value}</span>;
}
