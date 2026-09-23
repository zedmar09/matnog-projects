import { AlertTriangle, FileSearch, Layers3, SlidersHorizontal } from "lucide-react";
import type { EligibilityRuleTemplate, FundEligibilityOverride } from "../types/eligibility-rule";
import styles from "../views/eligibility-rules.module.css";

export type RuleRow = {
  kind: "template" | "override";
  id: string;
  code: string;
  name: string;
  scope: string;
  origin: string;
  condition: string;
  effect: string;
  priority: number;
  active: boolean;
  conflict: boolean;
  raw: EligibilityRuleTemplate | FundEligibilityOverride;
};
export function EffectBadge({ effect }: { effect: string }) {
  return <span className={`${styles.effectBadge} ${styles[`effect${effect.replaceAll(" ", "")}`]}`}>{effect}</span>;
}
export function RuleMatrix({
  rows,
  selectedKey,
  onSelect,
}: {
  rows: RuleRow[];
  selectedKey?: string;
  onSelect: (row: RuleRow) => void;
}) {
  if (!rows.length)
    return (
      <div className={styles.emptyState}>
        <FileSearch size={24} />
        <h3>No eligibility rules found</h3>
        <p>Adjust the filters or create a new category template.</p>
      </div>
    );
  return (
    <div className={styles.tableScroller}>
      <table className={styles.ruleTable}>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Rule</th>
            <th>Scope</th>
            <th>Origin</th>
            <th>Condition</th>
            <th>Effect</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.kind}-${row.id}`}
              className={`${selectedKey === `${row.kind}-${row.id}` ? styles.selectedRow : ""} ${row.conflict ? styles.conflictRow : ""}`}
            >
              <td>
                <span className={styles.priorityPill}>{row.priority}</span>
              </td>
              <td className={styles.ruleCell}>
                <button type="button" onClick={() => onSelect(row)}>
                  <strong>{row.name}</strong>
                  <span>
                    {row.code}
                    {row.conflict ? (
                      <>
                        {" "}
                        · <AlertTriangle size={10} /> Conflict
                      </>
                    ) : null}
                  </span>
                </button>
              </td>
              <td>{row.scope}</td>
              <td>
                <span className={styles.originBadge}>
                  {row.kind === "template" ? <Layers3 size={11} /> : <SlidersHorizontal size={11} />} {row.origin}
                </span>
              </td>
              <td className={styles.conditionCell}>{row.condition}</td>
              <td>
                <EffectBadge effect={row.effect} />
              </td>
              <td>
                <span className={row.active ? styles.activeBadge : styles.inactiveBadge}>
                  {row.active ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
