# Fund Eligibility Rules Design

## Purpose

Build the eligibility-control layer that determines whether an LGU Matnog project may use a registered funding source. The feature will explain each decision and later block ineligible project-to-fund assignments at save time.

This phase uses Zustand dummy data. It evaluates and manages rules but does not allocate funds, create appropriations, or change project pipeline status.

## Scope

### Included

- Eligibility Rules workspace at `/planning-funding/eligibility-rules`.
- Category-level rule templates inherited by registered fund sources.
- Fund-specific rules that add to, replace, or disable inherited rules.
- Active/inactive rule status and explicit evaluation priority.
- Allow, Block, and Require Validation effects.
- Conditions based on existing project data.
- Live evaluation of an existing project against a registered fund source.
- Per-rule explanations and an overall eligibility result.
- Create, edit, activate/deactivate, reorder, and override workflows.
- Audit entries for rule changes.
- Zustand-only rule, scenario, and audit data.

### Excluded

- Funding allocation and appropriation records.
- Fund-balance reservation.
- Moving a project to Funded.
- Backend persistence or server-side enforcement.
- Readiness, procurement, or implementation gates.

## Domain Model

### Rule Template

`EligibilityRuleTemplate` defines a reusable category rule:

- `id`: immutable identifier.
- `code`: unique rule code.
- `name`: concise operational name.
- `description`: plain-language intent.
- `fundCategory`: category receiving the rule.
- `conditionType`: project attribute evaluated.
- `operator`: comparison operation.
- `values`: accepted values or threshold operands.
- `effect`: Allow, Block, or Require Validation.
- `priority`: positive integer; lower numbers evaluate first.
- `active`: whether the rule participates in evaluation.
- `legalBasis`: authority for the rule.
- `createdAt` and `updatedAt`.

### Fund Override

`FundEligibilityOverride` targets one registered fund source:

- `id`: immutable identifier.
- `fundSourceId`: registered source receiving the override.
- `templateRuleId`: inherited rule being replaced or disabled, or null for an additional rule.
- `mode`: Add, Replace, or Disable.
- rule condition, effect, priority, explanation, and active status when applicable.
- `updatedAt`.

### Condition Types

The initial engine supports:

- Project Type
- Barangay or Jurisdiction
- Plan Linkage
- Project Tag
- Emergency Classification
- Requesting Office
- Proposed Budget

Operators are constrained by condition type:

- text or enumerated attributes: Is Any Of, Is None Of;
- array attributes: Contains Any, Contains All;
- boolean attributes: Is True, Is False;
- budget: Less Than or Equal, Greater Than or Equal, Between.

### Evaluation Result

`FundEligibilityEvaluation` contains:

- project and fund-source identifiers;
- `result`: Eligible, Ineligible, or Needs Validation;
- evaluation date;
- ordered `ruleResults` with Passed, Failed, or Needs Validation status;
- source of each rule: inherited template or fund override;
- plain-language reason for each result.

## Rule Composition and Precedence

1. Load active category templates for the selected fund source.
2. Apply active Disable overrides by removing the targeted inherited rules.
3. Apply Replace overrides in place of their targeted inherited rules.
4. Add active fund-specific Add overrides.
5. Sort the effective set by ascending priority, then stable rule code.
6. Evaluate every effective rule and retain every explanation.

Overall result precedence is:

1. Any matched Block rule produces Ineligible.
2. Otherwise, any matched Require Validation rule produces Needs Validation.
3. Otherwise, matched Allow rules produce Eligible.
4. If no rule establishes eligibility, return Needs Validation rather than silently allowing use.

A rule matches when its configured condition is satisfied. A non-matching Block or Require Validation rule passes without applying its effect. Allow rules must match to establish eligibility.

## Conflict Rules

- Rule codes are case-insensitively unique.
- Priorities must be positive integers.
- A condition must include the values required by its operator.
- Add rules for the same category or fund cannot use identical condition, operator, values, and priority with opposing effects.
- A template can have at most one active Replace or Disable override per fund source.
- Disable overrides require a template target and contain no independent condition.
- Replace overrides require a template target and a complete replacement rule.
- Contradictory rules at different priorities remain valid because precedence is explicit, but the UI flags them for review.

## State Architecture

A dedicated Zustand eligibility store will contain:

- rule templates;
- fund overrides;
- rule activity records;
- saved dummy evaluation scenarios.

The evaluator remains a pure utility that receives a project, fund source, templates, and overrides. It must not read Zustand directly. This lets later appropriation workflows reuse exactly the same evaluation logic before saving an allocation.

Required store actions:

- add and update template;
- add and update override;
- activate or deactivate rule;
- reorder rule priority;
- evaluate project and fund source;
- retrieve effective rules for a fund source.

Failed mutations return typed field or operation errors and do not modify state.

## User Interface

### Header and Summary

The page identifies the current fiscal year and eligibility-control context. Summary cards show:

- active rules;
- fund sources covered;
- rules requiring manual validation;
- unresolved conflict warnings.

### Filters

Search and Shadcn Select filters cover:

- fund category;
- registered fund source;
- template or override origin;
- active status;
- condition type;
- effect.

No native HTML select elements are permitted.

### Rule Matrix

The primary matrix shows:

- priority;
- rule code and name;
- applicable category or fund source;
- inherited or override origin;
- condition summary;
- effect;
- active status;
- conflict indicator.

Selecting a rule opens its detailed configuration and audit history. Inherited rules are visually distinguished from source-specific overrides without relying on color alone.

### Rule Editor

Create and edit forms expose only operators valid for the selected condition type. Values use Shadcn Select controls where options are known and validated text or numeric inputs where needed.

The editor supports template rules and Add, Replace, or Disable overrides. Changing override mode updates the required fields without discarding compatible input.

### Live Eligibility Tester

The tester allows a user to select:

- one existing project;
- one active registered fund source.

It then displays:

- overall result;
- project and fund summary;
- effective rules in evaluation order;
- pass, fail, or validation status per rule;
- inherited versus overridden source;
- specific explanation using actual project values.

Evaluation does not mutate project or fund state.

### Confirmations and Feedback

Deactivating a rule or disabling an inherited template requires confirmation. Successful changes immediately update the matrix, summary, effective-rule preview, and audit history.

## Dummy Data

Dummy templates cover realistic controls including:

- Development Fund projects must link to the AIP or LDIP.
- Barangay Development Funds require matching barangay jurisdiction.
- DRRM funds require DRR or emergency relevance; Quick Response use requires validation.
- GAD funds require an approved GAD tag or validation.
- Special Education Fund rules limit eligible project types and requesting offices.
- Trust funds, grants, and loans require validation against their specific agreement.
- Project budget caps demonstrate numeric conditions.

Overrides will demonstrate Add, Replace, and Disable modes across existing registered funds.

## Component Boundaries

- Thin route page.
- Eligibility workspace view for filters, selection, editor mode, and tester orchestration.
- Rule matrix component.
- Rule detail panel with audit activity.
- Template and override form components.
- Eligibility tester component.
- Dedicated Zustand store.
- Pure rule-composition, conflict-detection, and evaluation utilities.

Project and fund stores remain authoritative for their respective records. The eligibility feature reads them through selectors and does not duplicate their data.

## Error and Empty States

- Invalid rules retain form values and show field-specific correction messages.
- Missing project or fund records produce safe tester guidance.
- A fund with no effective rules evaluates to Needs Validation.
- Empty filters explain how to restore visible records.
- Conflicts remain visible and identify the opposing rule.

## Accessibility and Responsive Behavior

- Every control has an accessible name and visible keyboard focus.
- Result, effect, origin, and conflict states include text labels.
- The rule matrix scrolls horizontally on narrow screens.
- The matrix and detail panel stack below the desktop breakpoint.
- Editor and tester fields become single-column on mobile.

## Verification

Implementation must pass:

- Biome formatting, linting, and import organization;
- TypeScript checking;
- production Next.js build;
- native-select source guard;
- browser rendering and runtime-log inspection;
- template and override creation/editing;
- activation, deactivation, and priority changes;
- duplicate-code and contradictory-rule validation;
- Add, Replace, and Disable rule composition;
- Eligible, Ineligible, and Needs Validation evaluation cases;
- empty, filtered, and responsive states.

## Delivery Boundary

Completion means administrators can manage explainable eligibility rules and test real dummy projects against real registry funds. The next funding workflow may call this evaluator before saving a project-to-fund assignment, but that assignment workflow is not part of this phase.
