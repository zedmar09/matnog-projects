"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, FilePlus2, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";

import {
  ProposalCostStep,
  ProposalFundingStep,
  ProposalNeedStep,
  ProposalSourceStep,
} from "../components/proposal-intake-fields";
import { ProposalReview } from "../components/proposal-review";
import { PROPOSAL_STEPS } from "../constants/proposal-options";
import { type ProposalFormValues, proposalSchema } from "../schemas/proposal-schema";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { FundingSource, ProjectProposalInput } from "../types/project";
import styles from "./proposal-intake.module.css";

const STEP_FIELDS: Array<Array<FieldPath<ProposalFormValues>>> = [
  ["proposalSource", "implementingDepartment", "requestingOffice", "leadOfficer", "fiscalYear"],
  ["title", "description", "problemStatement", "barangayScope", "location", "beneficiaries", "beneficiarySectors"],
  ["expectedOutcome", "projectType", "budget", "targetStart", "targetCompletion"],
  [
    "cdpReference",
    "ldipReference",
    "aipReference",
    "primaryFundingSource",
    "primaryShare",
    "secondaryFundingSource",
    "tags",
  ],
  [],
];

const defaultValues: ProposalFormValues = {
  proposalSource: "",
  implementingDepartment: "",
  requestingOffice: "",
  leadOfficer: "",
  fiscalYear: "2026",
  emergency: false,
  title: "",
  description: "",
  problemStatement: "",
  expectedOutcome: "",
  barangayScope: "",
  location: "",
  beneficiaries: 0,
  beneficiarySectors: [],
  projectType: "",
  budget: 0,
  targetStart: "",
  targetCompletion: "",
  multiYear: false,
  cdpReference: "CDP-MATNOG-2023-2028",
  ldipReference: "",
  aipReference: "",
  primaryFundingSource: "",
  primaryShare: 100,
  secondaryFundingSource: "",
  tags: [],
};

function toProjectInput(values: ProposalFormValues, submit: boolean): ProjectProposalInput {
  const primaryAmount = Math.round(values.budget * (values.primaryShare / 100));
  const funding = [
    {
      source: values.primaryFundingSource as FundingSource,
      amount: primaryAmount,
      share: values.primaryShare,
      eligibility: "For validation" as const,
    },
  ];

  if (values.primaryShare < 100 && values.secondaryFundingSource) {
    funding.push({
      source: values.secondaryFundingSource as FundingSource,
      amount: values.budget - primaryAmount,
      share: 100 - values.primaryShare,
      eligibility: "For validation" as const,
    });
  }

  return {
    title: values.title,
    description: values.description,
    problemStatement: values.problemStatement,
    expectedOutcome: values.expectedOutcome,
    projectType: values.projectType,
    proposalSource: values.proposalSource,
    implementingDepartment: values.implementingDepartment,
    requestingOffice: values.requestingOffice,
    leadOfficer: values.leadOfficer,
    barangay: values.barangayScope === "municipal" ? null : values.barangayScope,
    location: values.location,
    beneficiaries: values.beneficiaries,
    beneficiarySectors: values.beneficiarySectors,
    fiscalYear: values.fiscalYear,
    multiYear: values.multiYear,
    planReferences: [values.cdpReference, values.ldipReference, values.aipReference],
    funding,
    budget: values.budget,
    targetStart: values.targetStart,
    targetCompletion: values.targetCompletion,
    tags: values.tags,
    emergency: values.emergency,
    submit,
  };
}

export function ProposalIntakeView() {
  const router = useRouter();
  const addProposal = useProjectRegistryStore((state) => state.addProposal);
  const [step, setStep] = useState(0);
  const [formMessage, setFormMessage] = useState("");
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues,
    mode: "onTouched",
  });

  const moveNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) {
      setFormMessage("Complete the highlighted fields before continuing.");
      return;
    }
    setFormMessage("");
    setStep((current) => Math.min(PROPOSAL_STEPS.length - 1, current + 1));
  };

  const save = (submit: boolean) =>
    form.handleSubmit(
      (values) => {
        const project = addProposal(toProjectInput(values, submit));
        router.push(`/projects/${project.id}`);
      },
      () => {
        const firstInvalidStep = STEP_FIELDS.findIndex((fields) =>
          fields.some((field) => form.getFieldState(field).invalid),
        );
        setStep(firstInvalidStep < 0 ? 0 : firstInvalidStep);
        setFormMessage("Review the highlighted fields before saving this proposal.");
      },
    )();

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/pipeline/all-projects">
        <ArrowLeft size={14} /> Back to all projects
      </Link>
      <header className={styles.pageHeader}>
        <div>
          <span>Project pipeline</span>
          <h2>New project proposal</h2>
          <p>Capture the need, ownership, cost, plan linkage, and proposed funding before technical review.</p>
        </div>
        <div className={styles.headerMeta}>
          <FilePlus2 size={18} />
          <span>
            New record<strong>Code assigned when saved</strong>
          </span>
        </div>
      </header>

      <form className={styles.formCard} onSubmit={(event) => event.preventDefault()} noValidate>
        <nav className={styles.stepper} aria-label="Proposal steps">
          {PROPOSAL_STEPS.map((item, index) => (
            <button
              type="button"
              key={item.title}
              className={`${index === step ? styles.stepActive : ""} ${index < step ? styles.stepComplete : ""}`}
              disabled={index > step}
              onClick={() => index <= step && setStep(index)}
            >
              <i>{index < step ? <Check size={12} /> : index + 1}</i>
              <span>
                <small>Step {index + 1}</small>
                <strong>{item.title}</strong>
              </span>
            </button>
          ))}
        </nav>

        <section className={styles.formBody}>
          <header className={styles.sectionHeader}>
            <span>{PROPOSAL_STEPS[step].short}</span>
            <h3>{PROPOSAL_STEPS[step].title}</h3>
            <p>
              {step === 0
                ? "Identify where the proposal came from and who will be accountable for it."
                : step === 1
                  ? "Describe the service gap, target area, and people who will benefit."
                  : step === 2
                    ? "Define the intended result, estimated project value, and delivery window."
                    : step === 3
                      ? "Connect the proposal to local plans and identify the funds it may use."
                      : "Confirm the complete proposal before it enters the municipal project pipeline."}
            </p>
          </header>
          {formMessage ? <div className={styles.formAlert}>{formMessage}</div> : null}
          {step === 0 ? <ProposalSourceStep form={form} /> : null}
          {step === 1 ? <ProposalNeedStep form={form} /> : null}
          {step === 2 ? <ProposalCostStep form={form} /> : null}
          {step === 3 ? <ProposalFundingStep form={form} /> : null}
          {step === 4 ? <ProposalReview values={form.getValues()} /> : null}
        </section>

        <footer className={styles.formFooter}>
          <div>
            {step > 0 ? (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  setFormMessage("");
                  setStep((current) => current - 1);
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
            ) : (
              <Link className={styles.secondaryButton} href="/pipeline/all-projects">
                Cancel
              </Link>
            )}
          </div>
          <span>
            Step {step + 1} of {PROPOSAL_STEPS.length}
          </span>
          <div className={styles.footerActions}>
            {step === PROPOSAL_STEPS.length - 1 ? (
              <>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={form.formState.isSubmitting}
                  onClick={() => save(false)}
                >
                  <Save size={14} /> Save as draft
                </button>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={form.formState.isSubmitting}
                  onClick={() => save(true)}
                >
                  <Send size={14} /> Submit proposal
                </button>
              </>
            ) : (
              <button className={styles.primaryButton} type="button" onClick={moveNext}>
                Continue <ChevronRight size={14} />
              </button>
            )}
          </div>
        </footer>
      </form>
    </main>
  );
}
