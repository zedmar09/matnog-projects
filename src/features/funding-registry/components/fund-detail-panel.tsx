import {
  AlertTriangle,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Landmark,
  MapPin,
  Plus,
} from "lucide-react";

import type { FundFiscalProfile, FundRegistryActivity, FundSource } from "../types/fund-source";
import {
  formatFundCurrency,
  getAvailableBalance,
  getFundUtilization,
  getUndisbursedObligations,
} from "../utils/fund-source-utils";
import styles from "../views/fund-source-registry.module.css";
import { FundStatusBadge } from "./fund-registry-table";

export function FundDetailPanel({
  source,
  profile,
  activities,
  fiscalYear,
  feedback,
  onEdit,
  onEditFiscal,
  onAddFiscal,
  onStatusChange,
}: {
  source?: FundSource;
  profile?: FundFiscalProfile;
  activities: FundRegistryActivity[];
  fiscalYear: string;
  feedback: { text: string; success: boolean };
  onEdit: () => void;
  onEditFiscal: () => void;
  onAddFiscal: () => void;
  onStatusChange: () => void;
}) {
  if (!source)
    return (
      <aside className={styles.detailPanel}>
        <div className={styles.emptyState}>
          <Landmark size={26} />
          <h3>Select a fund source</h3>
          <p>Choose a record to inspect its authority, balances, restrictions, and activity.</p>
        </div>
      </aside>
    );
  const utilization = getFundUtilization(profile);
  return (
    <aside className={styles.detailPanel}>
      <header className={styles.detailHeader}>
        <div>
          <span>{source.code}</span>
          <h3>{source.name}</h3>
          <p>
            {source.ownership === "Barangay" ? <MapPin size={12} /> : <Building2 size={12} />}
            {source.barangay ?? "Municipality of Matnog"}
          </p>
        </div>
        <FundStatusBadge active={source.active} />
      </header>
      {feedback.text ? (
        <div className={feedback.success ? styles.successMessage : styles.errorMessage}>
          {feedback.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {feedback.text}
        </div>
      ) : null}
      <div className={styles.detailActions}>
        <button type="button" onClick={onEdit}>
          <Edit3 size={12} /> Edit details
        </button>
        <button type="button" onClick={onStatusChange}>
          {source.active ? "Deactivate" : "Activate"}
        </button>
      </div>
      <section className={styles.ledgerCard}>
        <div className={styles.ledgerHead}>
          <div>
            <CalendarDays size={14} />
            <span>Fiscal position</span>
          </div>
          <strong>FY {fiscalYear}</strong>
        </div>
        {profile ? (
          <>
            <div className={styles.balanceHero}>
              <span>Available balance</span>
              <strong>{formatFundCurrency(getAvailableBalance(profile))}</strong>
              <small>{utilization.toFixed(1)}% obligated</small>
            </div>
            <dl className={styles.ledgerRows}>
              <div>
                <dt>Appropriation</dt>
                <dd>{formatFundCurrency(profile.appropriation)}</dd>
              </div>
              <div>
                <dt>Commitments</dt>
                <dd>{formatFundCurrency(profile.commitments)}</dd>
              </div>
              <div>
                <dt>Obligations</dt>
                <dd>{formatFundCurrency(profile.obligations)}</dd>
              </div>
              <div>
                <dt>Disbursements</dt>
                <dd>{formatFundCurrency(profile.disbursements)}</dd>
              </div>
              <div>
                <dt>Undisbursed obligations</dt>
                <dd>{formatFundCurrency(getUndisbursedObligations(profile))}</dd>
              </div>
            </dl>
            <button className={styles.ledgerAction} type="button" onClick={onEditFiscal}>
              <Edit3 size={12} /> Edit FY {fiscalYear} profile
            </button>
          </>
        ) : (
          <div className={styles.noProfile}>
            <Banknote size={19} />
            <strong>No FY {fiscalYear} profile</strong>
            <p>Add the annual appropriation before this source can enter funding planning.</p>
            <button type="button" onClick={onAddFiscal}>
              <Plus size={12} /> Add fiscal profile
            </button>
          </div>
        )}
      </section>
      <section className={styles.governanceSection}>
        <div className={styles.sectionHeading}>
          <div>
            <strong>Governance and use</strong>
            <span>
              {source.category} · {source.managingOffice}
            </span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Legal basis</dt>
            <dd>{source.legalBasis}</dd>
          </div>
          <div>
            <dt>Purpose</dt>
            <dd>{source.purpose}</dd>
          </div>
          <div>
            <dt>Restrictions</dt>
            <dd>{source.restrictions}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.activitySection}>
        <div className={styles.sectionHeading}>
          <div>
            <strong>Registry activity</strong>
            <span>Most recent changes</span>
          </div>
        </div>
        <div className={styles.activityList}>
          {activities.slice(0, 4).map((item) => (
            <div key={item.id}>
              <i />
              <div>
                <strong>{item.action}</strong>
                <span>
                  {item.actor} · {item.date}
                </span>
                <p>{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
