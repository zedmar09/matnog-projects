# Fund Source Registry Implementation Plan

## Objective

Implement the approved Fund Source Registry design as the first Planning & Funding phase. The feature will use realistic Zustand dummy data, Shadcn controls, existing Matnog UI conventions, and no backend services.

Design reference: `docs/superpowers/specs/2026-09-23-fund-source-registry-design.md`

## Delivery Strategy

Build the registry in isolated layers so domain validation can be verified before UI workflows depend on it:

1. domain types and financial utilities;
2. deterministic dummy data;
3. Zustand store and validated actions;
4. reusable registry components;
5. page orchestration and routing;
6. build and browser verification.

## Task 1: Add the Funding Registry Domain

### Files

- Create `src/features/funding-registry/types/fund-source.ts`.
- Create `src/features/funding-registry/utils/fund-source-utils.ts`.

### Work

- Define `FundCategory`, `FundOwnership`, `FundSource`, `FundFiscalProfile`, and `FundRegistryActivity`.
- Define create and update input types that prevent immutable identifiers from being overwritten.
- Define a typed mutation result with success and field-error variants.
- Add pure helpers for available balance, undisbursed obligations, utilization, fiscal-profile lookup, and currency formatting.
- Add pure validation for fund identity, ownership, fiscal profiles, duplicate codes, and deactivation safeguards.

### Verification

- Confirm financial helpers handle zero appropriation without division errors.
- Confirm commitments plus obligations cannot exceed appropriation.
- Confirm disbursements cannot exceed obligations.
- Confirm barangay ownership requires a barangay and municipal ownership clears it.
- Confirm code comparisons are case-insensitive.

## Task 2: Seed Deterministic Dummy Data

### Files

- Create `src/features/funding-registry/data/fund-source-dummy-data.ts`.

### Work

- Seed permanent fund definitions for General Fund, Municipal Development Fund, Local DRRM Fund, GAD, Special Education Fund, a sectoral appropriation, a trust fund, an external grant, and a development loan.
- Seed several barangay development funds using Matnog barangay names.
- Add fiscal profiles for 2024, 2025, and 2026 where appropriate.
- Include active and inactive sources and a range of utilization levels.
- Include sources with no open balance, open commitments, and undisbursed obligations so both permitted and blocked deactivation states are visible.
- Seed concise registry activity history.

### Verification

- Validate every seeded profile with the domain validator.
- Confirm fund codes and `(fundSourceId, fiscalYear)` pairs are unique.
- Confirm seeded figures produce non-negative available balances.

## Task 3: Implement the Zustand Registry Store

### Files

- Create `src/features/funding-registry/stores/fund-source-store.ts`.

### Work

- Initialize the store from deterministic dummy data.
- Implement `addFundSource` with duplicate-code and field validation.
- Implement `updateFundSource` while preserving immutable IDs and codes.
- Implement `setFundSourceActive` with current-year balance safeguards and explicit actor/note requirements.
- Implement `addFiscalProfile` with unique-year validation.
- Implement `updateFiscalProfile` with financial validation.
- Implement `getFundSourceById`.
- Append an audit activity after every successful mutation.
- Ensure failed mutations leave state unchanged and return typed field or operation errors.

### Verification

- Exercise successful create, edit, activate, and safe deactivate actions.
- Exercise duplicate code, duplicate fiscal year, invalid financial amounts, and blocked deactivation failures.
- Confirm successful actions update related activity history exactly once.

## Task 4: Build Reusable Registry Components

### Files

- Create `src/features/funding-registry/components/fund-registry-table.tsx`.
- Create `src/features/funding-registry/components/fund-detail-panel.tsx`.
- Create `src/features/funding-registry/components/fund-source-form.tsx`.
- Create `src/features/funding-registry/components/fiscal-profile-form.tsx`.
- Create `src/features/funding-registry/components/fund-registry-controls.tsx` if shared filters and badges justify a separate component.
- Create `src/features/funding-registry/views/fund-source-registry.module.css`.

### Work

- Build a selectable table with code, source, ownership, office, appropriation, available balance, utilization, and active status.
- Build text-backed status and utilization badges.
- Build the detail panel with identity, purpose, restrictions, annual financials, audit history, and action controls.
- Build controlled create/edit forms with field-specific errors.
- Use Shadcn Select for every categorical field.
- Add explicit confirmation for activation-state changes.
- Preserve the existing Poppins typography, green brand palette, small enterprise density, and responsive master-detail layout.

### Verification

- Confirm every control has an accessible name.
- Confirm no native `<select>` is introduced.
- Confirm long names, legal bases, and restrictions wrap without breaking the panel.
- Confirm the table remains horizontally scrollable on small viewports.

## Task 5: Implement the Registry View and Route

### Files

- Create `src/features/funding-registry/views/fund-source-registry-view.tsx`.
- Create `src/app/planning-funding/fund-sources/page.tsx`.

### Work

- Connect shell fiscal-year and jurisdiction selections to registry filtering.
- Add search and Shadcn filters for category, office, jurisdiction, and active status.
- Calculate filtered summary cards for active sources, appropriation, available balance, and utilization.
- Orchestrate selection, create mode, edit mode, fiscal-profile editing, confirmation, and feedback state.
- Keep form drafts local until a validated store action succeeds.
- Restore a safe selection when filters or mutations remove the selected record from view.
- Provide empty states for the whole registry and filtered results.
- Keep the route component thin.

### Verification

- Confirm filters and summary values remain synchronized.
- Confirm create and edit results appear immediately in the table and detail panel.
- Confirm fiscal-year switching selects the matching profile or shows a clear no-profile state.
- Confirm an unsuccessful save preserves entered values.
- Confirm activation changes update status and audit history without modifying financial figures.

## Task 6: Quality and Browser Verification

### Commands

- `npm run format`
- `npm run check`
- `npm run typecheck`
- `npm run build`
- `rg -n '<select' src`

### Browser Checks

- Open `/planning-funding/fund-sources` in the running app.
- Verify the default FY 2026 municipal registry and selected detail panel.
- Filter by category, office, barangay, and status.
- Search by fund code and name.
- Create a municipal source and a barangay source.
- Trigger duplicate-code validation.
- Edit governance metadata and the current fiscal profile.
- Trigger both financial validation rules.
- Activate an inactive source.
- Deactivate a source with no open current-year balance.
- Verify deactivation is blocked for a source with open commitments or undisbursed obligations.
- Inspect narrow-layout behavior and horizontal table scrolling.
- Confirm no runtime or console errors.

## Completion Criteria

- The approved registry route is fully usable with Zustand dummy data.
- Permanent fund definitions and annual profiles remain cleanly separated.
- All specified management workflows and safeguards are implemented.
- The page matches the existing Matnog enterprise UI and uses only Shadcn selects.
- Formatting, lint, type checking, production build, source guard, and browser checks pass.
- The development server is running when the phase is handed back.
- No eligibility-rule, appropriation-allocation, or Funded-pipeline behavior is added in this phase.
