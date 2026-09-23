# Fund Eligibility Rules Implementation Plan

## Objective

Implement the approved Fund Eligibility Rules design as an explainable control layer shared by future funding assignments. The feature will manage category templates and fund-specific overrides, evaluate existing projects against registered fund sources, and remain independent from appropriation mutations.

Design reference: `docs/superpowers/specs/2026-09-23-fund-eligibility-rules-design.md`

## Delivery Strategy

Build and verify the feature in this order:

1. strongly typed rule domain;
2. pure rule composition and evaluation;
3. deterministic rule and audit data;
4. validated Zustand mutations;
5. reusable rule-management and tester components;
6. route orchestration and browser verification.

## Task 1: Define the Eligibility Domain

### Files

- Create `src/features/fund-eligibility/types/eligibility-rule.ts`.
- Create `src/features/fund-eligibility/constants/rule-options.ts`.

### Work

- Define condition types, compatible operators, rule effects, override modes, evaluation statuses, and overall results.
- Define `EligibilityRuleTemplate`, `FundEligibilityOverride`, `EffectiveEligibilityRule`, `EligibilityRuleResult`, `FundEligibilityEvaluation`, and audit types.
- Define create/update inputs that preserve immutable IDs and codes.
- Define discriminated mutation-result types with field errors.
- Centralize condition, operator, effect, and origin labels and options.

### Verification

- Confirm no `any` types are introduced.
- Confirm each condition type has a constrained operator set.
- Confirm override modes represent Add, Replace, and Disable without ambiguous optional fields.

## Task 2: Build Pure Composition, Validation, and Evaluation

### Files

- Create `src/features/fund-eligibility/utils/rule-validation.ts`.
- Create `src/features/fund-eligibility/utils/rule-composition.ts`.
- Create `src/features/fund-eligibility/utils/rule-evaluator.ts`.

### Work

- Validate required rule metadata, positive priority, operator compatibility, and required values.
- Detect case-insensitive duplicate codes.
- Detect opposing rules with equivalent condition, values, scope, and priority.
- Validate override mode requirements.
- Compose effective fund rules by applying Disable, Replace, and Add overrides to category templates.
- Sort effective rules by priority and stable code.
- Evaluate project type, jurisdiction, plan linkage, tags, emergency flag, requesting office, and proposed budget conditions.
- Return an explanation containing actual and expected values for every evaluated rule.
- Apply Block, Require Validation, Allow, and no-match precedence exactly as specified.

### Verification

- Verify Add, Replace, and Disable composition independently.
- Verify Eligible, Ineligible, Needs Validation, and no-effective-rule cases.
- Verify budget boundary behavior and array matching operators.
- Verify evaluation remains pure and does not mutate input records.

## Task 3: Seed Realistic Rules and Overrides

### Files

- Create `src/features/fund-eligibility/data/eligibility-rule-dummy-data.ts`.

### Work

- Seed category templates for Development Fund, DRRM Fund, GAD, Special Education Fund, Trust Fund, External Grant, and Loan.
- Include rules for plan linkage, project type, jurisdiction, tags, emergency classification, requesting office, and budget thresholds.
- Seed fund-specific Add, Replace, and Disable examples linked to current Fund Source Registry IDs.
- Seed active and inactive rules, validation effects, and conflict-warning examples.
- Seed audit history for templates and overrides.

### Verification

- Confirm every referenced category and fund source exists.
- Confirm rule and override codes are unique.
- Confirm seeded rules pass structural validation except intentionally flagged conflict demonstrations.

## Task 4: Implement the Zustand Eligibility Store

### Files

- Create `src/features/fund-eligibility/stores/eligibility-rule-store.ts`.

### Work

- Initialize templates, overrides, and activity data.
- Implement create and update actions for templates and overrides.
- Implement activation/deactivation and priority updates.
- Implement effective-rule retrieval through pure composition utilities.
- Implement project-and-fund evaluation through the pure evaluator.
- Append one audit activity after each successful mutation.
- Return field-specific or operation errors without changing state on failure.

### Verification

- Exercise successful and rejected rule mutations.
- Confirm failed mutations preserve reference state.
- Confirm audit history updates exactly once per successful action.

## Task 5: Build Rule Management Components

### Files

- Create `src/features/fund-eligibility/components/rule-matrix.tsx`.
- Create `src/features/fund-eligibility/components/rule-detail-panel.tsx`.
- Create `src/features/fund-eligibility/components/rule-form.tsx`.
- Create `src/features/fund-eligibility/components/eligibility-tester.tsx`.
- Create `src/features/fund-eligibility/views/eligibility-rules.module.css`.

### Work

- Build a rule matrix with priority, code, scope, origin, condition, effect, status, and conflict indicator.
- Build accessible text-backed badges for effect, origin, status, and conflict state.
- Build the detail panel with configuration, effective-scope preview, related override, and audit history.
- Build a controlled template/override form whose operators and values respond to condition type and override mode.
- Use Shadcn Select for every categorical control.
- Build the tester with existing project and registered fund selections and a rule-by-rule result trace.
- Add confirmation for deactivation and Disable overrides.

### Verification

- Confirm form state survives validation failures.
- Confirm inherited and override rules remain understandable without color.
- Confirm result explanations identify actual project values.
- Confirm no native `<select>` appears.

## Task 6: Compose the Workspace and Route

### Files

- Create `src/features/fund-eligibility/views/eligibility-rules-view.tsx`.
- Create `src/app/planning-funding/eligibility-rules/page.tsx`.

### Work

- Read project data from the project-registry store and fund data from the fund-source store without copying records.
- Add summary cards for active rules, covered sources, validation rules, and conflict warnings.
- Add search and Shadcn filters for category, fund source, origin, active status, condition type, and effect.
- Orchestrate rule selection, form mode, tester mode, confirmation, validation, and feedback.
- Keep derived effective rules, summaries, and conflicts memoized from source state.
- Restore a safe selection when filters or mutations hide the selected rule.
- Keep the route file thin.

### Verification

- Confirm filters, summary values, and selected record remain synchronized.
- Confirm rule changes immediately update tester results.
- Confirm missing project, missing fund, and no-rule states provide actionable guidance.
- Confirm the layout stacks cleanly at tablet and mobile breakpoints.

## Task 7: Quality and Browser Verification

### Commands

- `npm run format`
- `npm run check`
- `npm run typecheck`
- `npm run build`
- `rg -n '<select' src`

### Browser Checks

- Open `/planning-funding/eligibility-rules`.
- Verify summary cards, filters, rule matrix, selected detail, and audit history.
- Create and edit a category template.
- Create Add, Replace, and Disable overrides.
- Trigger duplicate-code, incomplete-condition, and contradictory-rule validation.
- Activate and deactivate a rule.
- Change rule priority and verify matrix order.
- Evaluate project/fund pairs that produce Eligible, Ineligible, and Needs Validation.
- Confirm a fund with no effective rules returns Needs Validation.
- Inspect narrow-layout behavior, horizontal matrix scrolling, and keyboard-visible focus.
- Inspect development runtime output for hydration, console, or rendering errors.

## Completion Criteria

- Category templates and per-fund overrides are fully manageable using Zustand dummy state.
- The pure evaluator produces deterministic, explainable results for existing projects and funds.
- Add, Replace, Disable, effect precedence, conflicts, and no-rule safeguards behave as designed.
- The workspace matches the established Matnog enterprise UI and uses Shadcn selects.
- Formatting, lint, type checking, production build, native-select guard, and browser checks pass.
- The development server remains running when the phase is handed back.
- No appropriation, balance reservation, or project-status mutation is introduced.
