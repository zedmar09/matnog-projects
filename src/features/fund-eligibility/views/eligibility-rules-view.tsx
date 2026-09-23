"use client";
import { AlertTriangle, CheckCircle2, Filter, Plus, Search, ShieldCheck, ShieldQuestion, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useFundSourceStore } from "@/features/funding-registry/stores/fund-source-store";
import type { FundCategory } from "@/features/funding-registry/types/fund-source";
import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";
import { EligibilityTester } from "../components/eligibility-tester";
import { EffectBadge, RuleMatrix, type RuleRow } from "../components/rule-matrix";
import {
  CONDITION_TYPES,
  EFFECTS,
  OPERATORS_BY_CONDITION,
  OVERRIDE_MODES,
  RULE_ACTORS,
} from "../constants/rule-options";
import { useEligibilityRuleStore } from "../stores/eligibility-rule-store";
import type {
  EligibilityConditionType,
  EligibilityEffect,
  EligibilityFieldErrors,
  EligibilityOperator,
  FundEligibilityEvaluation,
  OverrideMode,
  OverrideRuleInput,
  TemplateRuleInput,
} from "../types/eligibility-rule";
import { composeEffectiveRules, evaluateEligibility, findRuleConflicts } from "../utils/rule-engine";
import styles from "./eligibility-rules.module.css";

const EMPTY_TEMPLATE: TemplateRuleInput = {
  code: "",
  name: "",
  description: "",
  fundCategory: "Development Fund",
  conditionType: "Plan Linkage",
  operator: "Contains Any",
  values: [],
  effect: "Allow",
  priority: 10,
  active: true,
  legalBasis: "",
  actor: "Unassigned",
};
const EMPTY_OVERRIDE: OverrideRuleInput = {
  code: "",
  fundSourceId: "",
  templateRuleId: null,
  mode: "Add",
  name: "",
  description: "",
  conditionType: "Jurisdiction",
  operator: "Is Any Of",
  values: [],
  effect: "Block",
  priority: 10,
  active: true,
  legalBasis: "",
  actor: "Unassigned",
};
function FilterSelect({
  value,
  label,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={styles.filterSelect} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function ErrorText({ text }: { text?: string }) {
  return text ? <small className={styles.fieldError}>{text}</small> : null;
}

export function EligibilityRulesView() {
  const templates = useEligibilityRuleStore((s) => s.templates),
    overrides = useEligibilityRuleStore((s) => s.overrides),
    activities = useEligibilityRuleStore((s) => s.activities);
  const addTemplate = useEligibilityRuleStore((s) => s.addTemplate),
    updateTemplate = useEligibilityRuleStore((s) => s.updateTemplate),
    addOverride = useEligibilityRuleStore((s) => s.addOverride),
    updateOverride = useEligibilityRuleStore((s) => s.updateOverride),
    toggleRule = useEligibilityRuleStore((s) => s.toggleRule);
  const funds = useFundSourceStore((s) => s.sources),
    projects = useProjectRegistryStore((s) => s.projects),
    fiscalYear = useShellStore((s) => s.fiscalYear);
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [origin, setOrigin] = useState("all"),
    [active, setActive] = useState("all"),
    [condition, setCondition] = useState("all"),
    [effect, setEffect] = useState("all");
  const [selectedKey, setSelectedKey] = useState(""),
    [editor, setEditor] = useState<"closed" | "template" | "override">("closed"),
    [editing, setEditing] = useState(false),
    [templateDraft, setTemplateDraft] = useState(EMPTY_TEMPLATE),
    [overrideDraft, setOverrideDraft] = useState(EMPTY_OVERRIDE),
    [errors, setErrors] = useState<EligibilityFieldErrors>({}),
    [feedback, setFeedback] = useState({ key: "", text: "", success: false });
  const [testProject, setTestProject] = useState(""),
    [testFund, setTestFund] = useState(""),
    [evaluation, setEvaluation] = useState<FundEligibilityEvaluation>();
  const [statusConfirm, setStatusConfirm] = useState(false),
    [statusActor, setStatusActor] = useState("Unassigned");
  const deferredSearch = useDeferredValue(search.toLowerCase().trim()),
    fundMap = useMemo(() => new Map(funds.map((f) => [f.id, f])), [funds]);
  const conflicts = useMemo(() => findRuleConflicts(templates), [templates]);
  const rows = useMemo<RuleRow[]>(
    () =>
      [
        ...templates.map((rule) => ({
          kind: "template" as const,
          id: rule.id,
          code: rule.code,
          name: rule.name,
          scope: rule.fundCategory,
          origin: "Category template",
          condition: `${rule.conditionType} · ${rule.operator} ${rule.values.join(", ")}`,
          effect: rule.effect,
          priority: rule.priority,
          active: rule.active,
          conflict: conflicts.has(rule.id),
          raw: rule,
        })),
        ...overrides.map((rule) => ({
          kind: "override" as const,
          id: rule.id,
          code: rule.code,
          name: rule.name || `${rule.mode} inherited rule`,
          scope: fundMap.get(rule.fundSourceId)?.code ?? "Unknown fund",
          origin: `${rule.mode} override`,
          condition:
            rule.mode === "Disable"
              ? "Disables inherited template"
              : `${rule.conditionType} · ${rule.operator} ${rule.values.join(", ")}`,
          effect: rule.effect ?? "Disabled",
          priority: rule.priority,
          active: rule.active,
          conflict: false,
          raw: rule,
        })),
      ]
        .filter((row) => {
          if (
            deferredSearch &&
            !`${row.code} ${row.name} ${row.scope} ${row.condition}`.toLowerCase().includes(deferredSearch)
          )
            return false;
          if (
            category !== "all" &&
            !(row.kind === "template"
              ? row.scope === category
              : fundMap.get((row.raw as (typeof overrides)[number]).fundSourceId)?.category === category)
          )
            return false;
          if (origin !== "all" && row.kind !== origin) return false;
          if (active !== "all" && (row.active ? "Active" : "Inactive") !== active) return false;
          if (condition !== "all" && !row.condition.startsWith(condition)) return false;
          if (effect !== "all" && row.effect !== effect) return false;
          return true;
        })
        .toSorted((a, b) => a.priority - b.priority || a.code.localeCompare(b.code)),
    [templates, overrides, fundMap, conflicts, deferredSearch, category, origin, active, condition, effect],
  );
  const selected = rows.find((row) => `${row.kind}-${row.id}` === selectedKey) ?? rows[0];
  const selectedActivities = selected ? activities.filter((a) => a.ruleId === selected.id) : [];
  const validationCount = [...templates, ...overrides].filter(
    (r) => r.active && r.effect === "Require Validation",
  ).length;
  const coveredFunds = funds.filter((f) => composeEffectiveRules(f, templates, overrides).length > 0).length;
  const openCreate = (kind: "template" | "override") => {
    setEditor(kind);
    setEditing(false);
    setErrors({});
    setFeedback({ key: "", text: "", success: false });
    if (kind === "template") setTemplateDraft({ ...EMPTY_TEMPLATE });
    else setOverrideDraft({ ...EMPTY_OVERRIDE });
  };
  const openEdit = () => {
    if (!selected) return;
    setEditing(true);
    setEditor(selected.kind);
    setErrors({});
    if (selected.kind === "template") {
      const r = selected.raw as (typeof templates)[number];
      setTemplateDraft({ ...r, actor: "Unassigned" });
    } else {
      const r = selected.raw as (typeof overrides)[number];
      setOverrideDraft({ ...r, actor: "Unassigned" });
    }
  };
  const saveRule = () => {
    const result =
      editor === "template"
        ? editing && selected
          ? updateTemplate(selected.id, templateDraft)
          : addTemplate(templateDraft)
        : editing && selected
          ? updateOverride(selected.id, overrideDraft)
          : addOverride(overrideDraft);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFeedback({ key: selectedKey, text: result.message, success: false });
      return;
    }
    const key = `${editor}-${result.value.id}`;
    setSelectedKey(key);
    setEditor("closed");
    setFeedback({ key, text: `${editor === "template" ? "Template rule" : "Fund override"} saved.`, success: true });
  };
  const confirmToggle = () => {
    if (!selected) return;
    const result = toggleRule(selected.kind, selected.id, statusActor);
    setFeedback({
      key: `${selected.kind}-${selected.id}`,
      text: result.ok ? `Rule ${result.value.active ? "activated" : "deactivated"}.` : result.message,
      success: result.ok,
    });
    if (result.ok) {
      setStatusConfirm(false);
      setStatusActor("Unassigned");
    }
  };
  const runEvaluation = () => {
    const project = projects.find((p) => p.id === testProject),
      fund = funds.find((f) => f.id === testFund);
    if (!project || !fund) {
      setEvaluation(undefined);
      return;
    }
    setEvaluation(evaluateEligibility(project, fund, composeEffectiveRules(fund, templates, overrides)));
  };
  const hasFilters = Boolean(
    search || category !== "all" || origin !== "all" || active !== "all" || condition !== "all" || effect !== "all",
  );
  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Funding control engine</span>
          </div>
          <h2>Fund eligibility rules</h2>
          <p>
            Maintain category policies and fund-specific overrides, then test every decision against actual project
            evidence.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => openCreate("override")}>
            <Plus size={14} /> Add fund override
          </button>
          <button type="button" onClick={() => openCreate("template")}>
            <Plus size={14} /> Add template rule
          </button>
        </div>
      </header>
      <section className={styles.summaryStrip}>
        <div>
          <ShieldCheck size={17} />
          <span>Active rules</span>
          <strong>{templates.filter((r) => r.active).length + overrides.filter((r) => r.active).length}</strong>
        </div>
        <div>
          <Filter size={17} />
          <span>Fund sources covered</span>
          <strong>{coveredFunds}</strong>
        </div>
        <div>
          <ShieldQuestion size={17} />
          <span>Validation rules</span>
          <strong>{validationCount}</strong>
        </div>
        <div>
          <AlertTriangle size={17} />
          <span>Rule conflicts</span>
          <strong>{conflicts.size}</strong>
        </div>
      </section>
      <EligibilityTester
        projects={projects.filter((p) => p.fiscalYear === fiscalYear)}
        funds={funds}
        projectId={testProject}
        fundId={testFund}
        evaluation={evaluation}
        onProjectChange={(v) => {
          setTestProject(v === "none" ? "" : v);
          setEvaluation(undefined);
        }}
        onFundChange={(v) => {
          setTestFund(v === "none" ? "" : v);
          setEvaluation(undefined);
        }}
        onEvaluate={runEvaluation}
      />
      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search eligibility rules</span>
            <input
              type="search"
              value={search}
              placeholder="Search rule, scope, or condition…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <FilterSelect
            value={category}
            label="Fund category filter"
            placeholder="All categories"
            options={[...new Set(funds.map((f) => f.category))]}
            onChange={setCategory}
          />
          <FilterSelect
            value={origin}
            label="Rule origin filter"
            placeholder="All origins"
            options={["template", "override"]}
            onChange={setOrigin}
          />
          <FilterSelect
            value={active}
            label="Rule status filter"
            placeholder="All statuses"
            options={["Active", "Inactive"]}
            onChange={setActive}
          />
          <FilterSelect
            value={condition}
            label="Condition filter"
            placeholder="All conditions"
            options={CONDITION_TYPES}
            onChange={setCondition}
          />
          <FilterSelect
            value={effect}
            label="Effect filter"
            placeholder="All effects"
            options={EFFECTS}
            onChange={setEffect}
          />
          {hasFilters ? (
            <button
              className={styles.clearButton}
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setOrigin("all");
                setActive("all");
                setCondition("all");
                setEffect("all");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className={styles.workspaceGrid}>
          <div className={styles.matrixPane}>
            <div className={styles.paneHeading}>
              <div>
                <h3>Effective rule matrix</h3>
                <p>Priority order · category inheritance · fund overrides</p>
              </div>
              <strong>{rows.length} records</strong>
            </div>
            <RuleMatrix
              rows={rows}
              selectedKey={selected ? `${selected.kind}-${selected.id}` : ""}
              onSelect={(row) => {
                setSelectedKey(`${row.kind}-${row.id}`);
                setEditor("closed");
                setFeedback({ key: "", text: "", success: false });
              }}
            />
          </div>
          {editor !== "closed" ? (
            <aside className={styles.editorPanel}>
              <header>
                <div>
                  <span>{editing ? "Rule maintenance" : "New control"}</span>
                  <h3>
                    {editing ? "Edit" : "Create"} {editor === "template" ? "template rule" : "fund override"}
                  </h3>
                </div>
                <button type="button" onClick={() => setEditor("closed")} aria-label="Close rule editor">
                  <X size={15} />
                </button>
              </header>
              <div className={styles.formBody}>
                {editor === "override" ? (
                  <>
                    <div>
                      <span>Override mode</span>
                      <Select
                        value={overrideDraft.mode}
                        onValueChange={(v) => setOverrideDraft((d) => ({ ...d, mode: v as OverrideMode }))}
                      >
                        <SelectTrigger className={styles.formSelect} aria-label="Override mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OVERRIDE_MODES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <span>Fund source</span>
                      <Select
                        value={overrideDraft.fundSourceId || "none"}
                        onValueChange={(v) => setOverrideDraft((d) => ({ ...d, fundSourceId: v === "none" ? "" : v }))}
                      >
                        <SelectTrigger className={styles.formSelect} aria-label="Override fund source">
                          <SelectValue placeholder="Select fund" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select fund</SelectItem>
                          {funds.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.code} · {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ErrorText text={errors.fundSourceId} />
                    </div>
                    {overrideDraft.mode !== "Add" ? (
                      <div>
                        <span>Inherited template</span>
                        <Select
                          value={overrideDraft.templateRuleId ?? "none"}
                          onValueChange={(v) =>
                            setOverrideDraft((d) => ({ ...d, templateRuleId: v === "none" ? null : v }))
                          }
                        >
                          <SelectTrigger className={styles.formSelect} aria-label="Inherited template rule">
                            <SelectValue placeholder="Select rule" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select rule</SelectItem>
                            {templates.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.code} · {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ErrorText text={errors.templateRuleId} />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div>
                    <span>Fund category</span>
                    <Select
                      value={templateDraft.fundCategory}
                      onValueChange={(v) => setTemplateDraft((d) => ({ ...d, fundCategory: v as FundCategory }))}
                    >
                      <SelectTrigger className={styles.formSelect} aria-label="Template fund category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(funds.map((f) => f.category))].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!(editor === "override" && overrideDraft.mode === "Disable") ? (
                  <RuleFields
                    draft={editor === "template" ? templateDraft : overrideDraft}
                    errors={errors}
                    onChange={(changes) =>
                      editor === "template"
                        ? setTemplateDraft((d) => ({ ...d, ...changes }))
                        : setOverrideDraft((d) => ({ ...d, ...changes }))
                    }
                  />
                ) : null}
                <div>
                  <span>Recorded by</span>
                  <Select
                    value={editor === "template" ? templateDraft.actor : overrideDraft.actor}
                    onValueChange={(actor) =>
                      editor === "template"
                        ? setTemplateDraft((d) => ({ ...d, actor }))
                        : setOverrideDraft((d) => ({ ...d, actor }))
                    }
                  >
                    <SelectTrigger className={styles.formSelect} aria-label="Rule recorded by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_ACTORS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorText text={errors.actor} />
                </div>
                {feedback.text && !feedback.success ? <div className={styles.formError}>{feedback.text}</div> : null}
                <footer>
                  <button type="button" onClick={() => setEditor("closed")}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveRule}>
                    Save rule
                  </button>
                </footer>
              </div>
            </aside>
          ) : (
            <aside className={styles.detailPanel}>
              {selected ? (
                <>
                  <header>
                    <div>
                      <span>{selected.code}</span>
                      <h3>{selected.name}</h3>
                      <p>
                        {selected.origin} · Priority {selected.priority}
                      </p>
                    </div>
                    <EffectBadge effect={selected.effect} />
                  </header>
                  {feedback.key === `${selected.kind}-${selected.id}` && feedback.text ? (
                    <div className={feedback.success ? styles.successMessage : styles.errorMessage}>
                      {feedback.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {feedback.text}
                    </div>
                  ) : null}
                  <div className={styles.detailActions}>
                    <button type="button" onClick={openEdit}>
                      Edit rule
                    </button>
                    <button type="button" onClick={() => setStatusConfirm(true)}>
                      {selected.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                  <section className={styles.ruleSummary}>
                    <div>
                      <span>Condition</span>
                      <strong>{selected.condition}</strong>
                    </div>
                    <div>
                      <span>Scope</span>
                      <strong>{selected.scope}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{selected.active ? "Active" : "Inactive"}</strong>
                    </div>
                    <div>
                      <span>Conflict check</span>
                      <strong>{selected.conflict ? "Review required" : "No conflict"}</strong>
                    </div>
                  </section>
                  <section className={styles.legalSection}>
                    <h4>Rule definition</h4>
                    <p>{selected.raw.description}</p>
                    <dl>
                      <div>
                        <dt>Legal basis</dt>
                        <dd>{selected.raw.legalBasis}</dd>
                      </div>
                      <div>
                        <dt>Last updated</dt>
                        <dd>{selected.raw.updatedAt}</dd>
                      </div>
                    </dl>
                  </section>
                  <section className={styles.activitySection}>
                    <h4>Rule activity</h4>
                    {selectedActivities.map((a) => (
                      <div key={a.id}>
                        <i />
                        <div>
                          <strong>{a.action}</strong>
                          <span>
                            {a.actor} · {a.date}
                          </span>
                          <p>{a.note}</p>
                        </div>
                      </div>
                    ))}
                  </section>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <ShieldQuestion size={24} />
                  <h3>Select a rule</h3>
                  <p>Choose a record to inspect its condition and legal basis.</p>
                </div>
              )}
            </aside>
          )}
        </div>
      </section>
      {statusConfirm && selected ? (
        <div className={styles.modalBackdrop}>
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="rule-status-title">
            <AlertTriangle size={20} />
            <h3 id="rule-status-title">
              {selected.active ? "Deactivate" : "Activate"} {selected.code}?
            </h3>
            <p>This immediately changes whether the rule participates in project-to-fund eligibility evaluations.</p>
            <div>
              <span>Recorded by</span>
              <Select value={statusActor} onValueChange={setStatusActor}>
                <SelectTrigger className={styles.formSelect} aria-label="Status change recorded by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_ACTORS.map((actor) => (
                    <SelectItem key={actor} value={actor}>
                      {actor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {feedback.key === `${selected.kind}-${selected.id}` && !feedback.success && feedback.text ? (
              <div className={styles.formError}>{feedback.text}</div>
            ) : null}
            <footer>
              <button type="button" onClick={() => setStatusConfirm(false)}>
                Cancel
              </button>
              <button type="button" onClick={confirmToggle}>
                Confirm status change
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function RuleFields({
  draft,
  errors,
  onChange,
}: {
  draft: TemplateRuleInput | OverrideRuleInput;
  errors: EligibilityFieldErrors;
  onChange: (c: Partial<TemplateRuleInput & OverrideRuleInput>) => void;
}) {
  const condition = draft.conditionType ?? "Project Type";
  const operator = draft.operator ?? OPERATORS_BY_CONDITION[condition][0];
  return (
    <>
      <div className={styles.twoColumns}>
        <label>
          <span>Rule code</span>
          <input value={draft.code} onChange={(e) => onChange({ code: e.target.value })} />
          <ErrorText text={errors.code} />
        </label>
        <label>
          <span>Priority</span>
          <input
            type="number"
            min="1"
            value={draft.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) })}
          />
          <ErrorText text={errors.priority} />
        </label>
      </div>
      <label>
        <span>Rule name</span>
        <input value={draft.name} onChange={(e) => onChange({ name: e.target.value })} />
        <ErrorText text={errors.name} />
      </label>
      <label>
        <span>Description</span>
        <textarea rows={2} value={draft.description} onChange={(e) => onChange({ description: e.target.value })} />
        <ErrorText text={errors.description} />
      </label>
      <div className={styles.twoColumns}>
        <div>
          <span>Condition</span>
          <Select
            value={condition}
            onValueChange={(v) => {
              const next = v as EligibilityConditionType;
              onChange({ conditionType: next, operator: OPERATORS_BY_CONDITION[next][0], values: [] });
            }}
          >
            <SelectTrigger className={styles.formSelect} aria-label="Rule condition type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_TYPES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <span>Operator</span>
          <Select value={operator} onValueChange={(v) => onChange({ operator: v as EligibilityOperator })}>
            <SelectTrigger className={styles.formSelect} aria-label="Rule operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS_BY_CONDITION[condition].map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText text={errors.operator} />
        </div>
      </div>
      {!["Is True", "Is False"].includes(operator) ? (
        <label>
          <span>Comparison values</span>
          <input
            value={draft.values.join(", ")}
            placeholder="Separate multiple values with commas"
            onChange={(e) =>
              onChange({
                values: e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
          <ErrorText text={errors.values} />
        </label>
      ) : null}
      <div>
        <span>Effect</span>
        <Select value={draft.effect ?? "Allow"} onValueChange={(v) => onChange({ effect: v as EligibilityEffect })}>
          <SelectTrigger className={styles.formSelect} aria-label="Rule effect">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EFFECTS.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label>
        <span>Legal basis</span>
        <textarea rows={2} value={draft.legalBasis} onChange={(e) => onChange({ legalBasis: e.target.value })} />
        <ErrorText text={errors.legalBasis} />
      </label>
    </>
  );
}
