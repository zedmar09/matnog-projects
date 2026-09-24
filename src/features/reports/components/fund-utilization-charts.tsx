import type { FundUtilizationTotals, UtilizationGroup, UtilizationTrendPoint } from "../types/fund-utilization";
import { compactMoney } from "../utils/fund-utilization-utils";

import styles from "../views/fund-utilization-report.module.css";

function percent(value: number | null) {
  return `${Math.max(0, Math.min(100, value ?? 0))}%`;
}

export function BudgetExecutionChart({ totals }: { totals: FundUtilizationTotals }) {
  const items = [
    { label: "Appropriation", value: totals.appropriation, tone: styles.barAppropriation },
    { label: "Obligations", value: totals.obligation, tone: styles.barObligation },
    { label: "Disbursements", value: totals.disbursement, tone: styles.barDisbursement },
  ];
  const max = Math.max(1, totals.appropriation);
  return (
    <section className={styles.chartCard} aria-label="Budget execution overview">
      <header>
        <div>
          <h2>Budget execution overview</h2>
          <p>How approved funding moves into obligations and actual payments.</p>
        </div>
        <span className={styles.chartTag}>Portfolio</span>
      </header>
      <div className={styles.executionChart}>
        {items.map((item) => (
          <div className={styles.executionRow} key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{compactMoney(item.value)}</strong>
            </div>
            <div className={styles.barTrack}>
              <span className={item.tone} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.chartFootnote}>
        <span>{totals.obligationRate ?? 0}% obligated</span>
        <span>{totals.disbursementRate ?? 0}% disbursed</span>
      </div>
    </section>
  );
}

export function UtilizationGroupChart({
  title,
  description,
  groups,
}: {
  title: string;
  description: string;
  groups: UtilizationGroup[];
}) {
  return (
    <section className={styles.chartCard} aria-label={title}>
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className={styles.chartTag}>{groups.length} groups</span>
      </header>
      {groups.length > 0 ? (
        <div className={styles.groupChart}>
          {groups.map((group) => (
            <div className={styles.groupRow} key={group.id}>
              <div className={styles.groupLabel}>
                <strong title={group.label}>{group.label}</strong>
                <span>{compactMoney(group.appropriation)}</span>
              </div>
              <div className={styles.dualTrack}>
                <span className={styles.obligationFill} style={{ width: percent(group.obligationRate) }} />
                <span className={styles.disbursementFill} style={{ width: percent(group.disbursementRate) }} />
              </div>
              <div className={styles.groupRates}>
                <span>{group.obligationRate ?? 0}% obligated</span>
                <span>{group.disbursementRate ?? 0}% paid</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.chartEmpty}>No grouped financial data for the active filters.</div>
      )}
      <div className={styles.legend}>
        <span>
          <i className={styles.legendObligation} /> Obligations
        </span>
        <span>
          <i className={styles.legendDisbursement} /> Disbursements
        </span>
      </div>
    </section>
  );
}

export function DisbursementTrendChart({ points }: { points: UtilizationTrendPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.disbursement));
  const coordinates = points.map((point, index) => ({
    ...point,
    x: 8 + (index / Math.max(1, points.length - 1)) * 84,
    y: 84 - (point.disbursement / max) * 66,
  }));
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = coordinates.length ? `${path} L ${coordinates.at(-1)?.x} 88 L ${coordinates[0].x} 88 Z` : "";
  return (
    <section className={styles.chartCard} aria-label="Monthly disbursement trend">
      <header>
        <div>
          <h2>Monthly disbursement trend</h2>
          <p>Cumulative FY 2026 payment movement across the filtered portfolio.</p>
        </div>
        <span className={styles.chartTag}>{compactMoney(max)}</span>
      </header>
      <div className={styles.trendChart}>
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Cumulative disbursements reach ${compactMoney(max)} by December`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="fundTrendArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1b9a78" stopOpacity=".28" />
              <stop offset="100%" stopColor="#1b9a78" stopOpacity=".02" />
            </linearGradient>
          </defs>
          {[22, 44, 66, 88].map((y) => (
            <line key={y} x1="8" x2="92" y1={y} y2={y} className={styles.gridLine} />
          ))}
          <path d={area} fill="url(#fundTrendArea)" />
          <path d={path} className={styles.trendLine} />
          {coordinates.map((point) => (
            <circle key={point.month} cx={point.x} cy={point.y} r="1.5" className={styles.trendPoint} />
          ))}
        </svg>
        <div className={styles.monthLabels}>
          {points.map((point) => (
            <span key={point.month}>{point.month}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
