import type { ProjectPipelineStatus, ProjectRiskLevel } from "../types/project";

import styles from "../views/portfolio-overview.module.css";

type BadgeValue = ProjectPipelineStatus | ProjectRiskLevel | "Delayed" | "Due soon" | "Upcoming" | "Completed";

export function StatusBadge({ value }: { value: BadgeValue }) {
  const tone =
    value === "Critical" || value === "Rejected" || value === "Delayed"
      ? styles.badgeDanger
      : value === "High" || value === "Deferred" || value === "Due soon"
        ? styles.badgeWarning
        : value === "Funded" || value === "Low"
          ? styles.badgeSuccess
          : value === "Moderate" || value === "Under Review" || value === "Submitted"
            ? styles.badgeInfo
            : styles.badgeNeutral;

  return <span className={`${styles.badge} ${tone}`}>{value}</span>;
}
