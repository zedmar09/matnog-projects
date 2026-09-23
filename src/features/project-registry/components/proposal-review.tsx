import { AlertTriangle, Banknote, CheckCircle2, Landmark, MapPin, UsersRound } from "lucide-react";

import type { ProposalFormValues } from "../schemas/proposal-schema";
import { formatCompactCurrency, formatNumber, formatShortDate } from "../utils/project-utils";
import styles from "../views/proposal-intake.module.css";

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.reviewField}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ProposalReview({ values }: { values: ProposalFormValues }) {
  const location = values.barangayScope === "municipal" ? "Municipality-wide" : values.barangayScope;
  return (
    <div className={styles.reviewLayout}>
      <section className={styles.reviewHero}>
        <div>
          <span>Proposed project</span>
          <h3>{values.title}</h3>
          <p>{values.description}</p>
        </div>
        {values.emergency ? (
          <b>
            <AlertTriangle size={13} /> Emergency
          </b>
        ) : null}
      </section>
      <section className={styles.reviewSection}>
        <header>
          <MapPin size={16} />
          <h3>Ownership and location</h3>
        </header>
        <div className={styles.reviewGrid}>
          <ReviewField label="Proposal source" value={values.proposalSource} />
          <ReviewField label="Implementing office" value={values.implementingDepartment} />
          <ReviewField label="Requesting office" value={values.requestingOffice} />
          <ReviewField label="Project lead" value={values.leadOfficer} />
          <ReviewField label="Scope" value={location} />
          <ReviewField label="Specific location" value={values.location} />
        </div>
      </section>
      <section className={styles.reviewSection}>
        <header>
          <UsersRound size={16} />
          <h3>Need and beneficiaries</h3>
        </header>
        <div className={styles.reviewNarratives}>
          <div>
            <span>Problem statement</span>
            <p>{values.problemStatement}</p>
          </div>
          <div>
            <span>Expected outcome</span>
            <p>{values.expectedOutcome}</p>
          </div>
        </div>
        <div className={styles.reviewGrid}>
          <ReviewField label="Beneficiaries" value={formatNumber(values.beneficiaries)} />
          <ReviewField label="Beneficiary sectors" value={values.beneficiarySectors.join(", ")} />
        </div>
      </section>
      <section className={styles.reviewSection}>
        <header>
          <Banknote size={16} />
          <h3>Cost and schedule</h3>
        </header>
        <div className={styles.reviewGrid}>
          <ReviewField label="Project type" value={values.projectType} />
          <ReviewField label="Proposed budget" value={formatCompactCurrency(values.budget)} />
          <ReviewField label="Target start" value={formatShortDate(values.targetStart)} />
          <ReviewField label="Target completion" value={formatShortDate(values.targetCompletion)} />
          <ReviewField label="Implementation" value={values.multiYear ? "Multi-year" : "Single-year"} />
          <ReviewField label="Fiscal year" value={`FY ${values.fiscalYear}`} />
        </div>
      </section>
      <section className={styles.reviewSection}>
        <header>
          <Landmark size={16} />
          <h3>Planning and funding</h3>
        </header>
        <div className={styles.reviewGrid}>
          <ReviewField
            label="Plan references"
            value={[values.cdpReference, values.ldipReference, values.aipReference].join(" · ")}
          />
          <ReviewField label="Primary fund" value={`${values.primaryFundingSource} (${values.primaryShare}%)`} />
          {values.primaryShare < 100 ? (
            <ReviewField label="Co-funder" value={`${values.secondaryFundingSource} (${100 - values.primaryShare}%)`} />
          ) : null}
          <ReviewField label="Thematic tags" value={values.tags.join(", ")} />
        </div>
      </section>
      <div className={styles.reviewReady}>
        <CheckCircle2 size={17} />
        <div>
          <strong>Ready to save</strong>
          <p>Save as Draft for later editing or Submit Proposal to enter the technical review queue.</p>
        </div>
      </div>
    </div>
  );
}
