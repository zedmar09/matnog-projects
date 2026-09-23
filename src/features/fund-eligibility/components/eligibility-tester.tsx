import { AlertTriangle, CheckCircle2, FlaskConical, ShieldQuestion, XCircle } from "lucide-react";
import type { FundSource } from "@/features/funding-registry/types/fund-source";
import type { Project } from "@/features/project-registry/types/project";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { FundEligibilityEvaluation } from "../types/eligibility-rule";
import styles from "../views/eligibility-rules.module.css";

export function EligibilityTester({
  projects,
  funds,
  projectId,
  fundId,
  evaluation,
  onProjectChange,
  onFundChange,
  onEvaluate,
}: {
  projects: Project[];
  funds: FundSource[];
  projectId: string;
  fundId: string;
  evaluation?: FundEligibilityEvaluation;
  onProjectChange: (v: string) => void;
  onFundChange: (v: string) => void;
  onEvaluate: () => void;
}) {
  const Icon =
    evaluation?.result === "Eligible" ? CheckCircle2 : evaluation?.result === "Ineligible" ? XCircle : ShieldQuestion;
  return (
    <section className={styles.tester}>
      <header>
        <div>
          <FlaskConical size={15} />
          <span>Live eligibility tester</span>
        </div>
        <small>Read-only evaluation</small>
      </header>
      <div className={styles.testerControls}>
        <div>
          <span>Project</span>
          <Select value={projectId || "none"} onValueChange={onProjectChange}>
            <SelectTrigger className={styles.formSelect} aria-label="Eligibility test project">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} · {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <span>Fund source</span>
          <Select value={fundId || "none"} onValueChange={onFundChange}>
            <SelectTrigger className={styles.formSelect} aria-label="Eligibility test fund source">
              <SelectValue placeholder="Select fund" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select fund</SelectItem>
              {funds
                .filter((f) => f.active)
                .map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.code} · {f.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <button type="button" onClick={onEvaluate}>
          Evaluate eligibility
        </button>
      </div>
      {evaluation ? (
        <div className={styles.evaluation}>
          <div className={`${styles.resultHero} ${styles[`result${evaluation.result.replaceAll(" ", "")}`]}`}>
            <Icon size={20} />
            <div>
              <span>Overall result</span>
              <strong>{evaluation.result}</strong>
            </div>
            <small>{evaluation.ruleResults.length} effective rules</small>
          </div>
          <div className={styles.ruleTrace}>
            {evaluation.ruleResults.length ? (
              evaluation.ruleResults.map((item) => (
                <div key={item.rule.id}>
                  <span className={`${styles.traceIcon} ${styles[`trace${item.status.replaceAll(" ", "")}`]}`}>
                    {item.status === "Passed" ? (
                      <CheckCircle2 size={13} />
                    ) : item.status === "Failed" ? (
                      <XCircle size={13} />
                    ) : (
                      <AlertTriangle size={13} />
                    )}
                  </span>
                  <div>
                    <strong>
                      {item.rule.code} · {item.rule.name}
                    </strong>
                    <p>{item.explanation}</p>
                    <small>
                      {item.rule.origin} · {item.rule.effect}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noRules}>
                <ShieldQuestion size={20} />
                <p>No effective rules exist. Manual validation is required.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.testerEmpty}>
          <FlaskConical size={23} />
          <p>Select a project and fund source to preview the exact eligibility decision.</p>
        </div>
      )}
    </section>
  );
}
