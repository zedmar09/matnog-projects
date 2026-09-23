# Fund Source Registry Design

## Purpose

Build the first Planning & Funding phase for the LGU Matnog Project Management System. The registry will establish the municipal and barangay funding sources that later eligibility, funding review, appropriation, and Funded Projects workflows depend on.

This phase uses production-style dummy data stored only in Zustand. It does not connect to a backend and does not approve or fund projects.

## Scope

### Included

- A Fund Source Registry at `/planning-funding/fund-sources`.
- Fund-source definitions with permanent identity and governance metadata.
- Fiscal-year financial profiles separated from permanent fund definitions.
- Municipal and barangay-owned sources.
- Create, edit, activate, and deactivate workflows.
- Fiscal-year, category, managing-office, jurisdiction, and status filters.
- Portfolio totals and utilization summaries.
- Financial and governance details in a selected-record panel.
- Audit entries for material registry changes.
- Zustand dummy data and actions.
- Validation, confirmation, empty, success, and error states.

### Excluded

- Project-to-fund eligibility evaluation.
- Funding-review decisions.
- Appropriation allocation to projects.
- Obligation and disbursement transactions.
- Moving projects to the Funded pipeline state.
- Backend persistence, authentication, and authorization enforcement.

## Domain Model

### Fund Source

`FundSource` represents the stable identity and rules of a funding source:

- `id`: immutable internal identifier.
- `code`: unique human-readable code.
- `name`: official fund-source name.
- `category`: General Fund, Development Fund, DRRM Fund, GAD, SK, Sectoral Appropriation, Special Education Fund, Trust Fund, External Grant, or Loan.
- `ownership`: Municipal or Barangay.
- `barangay`: required when ownership is Barangay; otherwise null.
- `managingOffice`: office accountable for administration.
- `legalBasis`: ordinance, law, memorandum, grant agreement, or other authority.
- `purpose`: concise description of the intended public spending purpose.
- `restrictions`: human-readable spending restrictions.
- `active`: whether the source may be selected by future funding workflows.
- `createdAt` and `updatedAt`: audit dates.

### Fiscal Profile

`FundFiscalProfile` represents one fund source in one fiscal year:

- `id`: immutable internal identifier.
- `fundSourceId`: parent fund source.
- `fiscalYear`: reporting year.
- `appropriation`: total authorized amount.
- `commitments`: amount reserved or programmed but not yet obligated.
- `obligations`: amount legally obligated.
- `disbursements`: amount paid.
- `updatedAt`: last financial-profile update.

The available balance is derived as `appropriation - commitments - obligations`. Utilization is derived from obligations divided by appropriation. Disbursements are shown separately and cannot exceed obligations.

### Audit Entry

`FundRegistryActivity` records:

- action date;
- action type;
- actor;
- affected fund source;
- concise change note.

## State and Actions

A dedicated Zustand store will own registry state independently from the project-registry store. This keeps funding configuration separate from project workflow state while providing stable interfaces for later phases.

Required actions:

- `addFundSource`
- `updateFundSource`
- `setFundSourceActive`
- `addFiscalProfile`
- `updateFiscalProfile`
- `getFundSourceById`

All state mutations return the affected record or a typed failure result. Material changes append an audit entry. UI components must not mutate arrays or nested records directly.

## Validation Rules

- Fund codes are required, trimmed, case-insensitively unique, and immutable after creation.
- Fund name, category, ownership, managing office, legal basis, purpose, restrictions, and change actor are required.
- Barangay ownership requires a barangay; municipal ownership clears the barangay value.
- A fund can have only one fiscal profile per fiscal year.
- All financial amounts must be zero or positive.
- Commitments plus obligations cannot exceed appropriation.
- Disbursements cannot exceed obligations.
- A fund with open commitments or undisbursed obligations in the current fiscal profile cannot be deactivated until those balances are cleared.
- Inactive funds remain visible for historical reporting but are unavailable to future allocation workflows.

## User Interface

### Page Header and Summary

The page header identifies the current fiscal year and Planning & Funding context. Four summary cards show:

- active fund sources;
- total appropriation;
- available balance;
- portfolio utilization.

Summary values respond to the active filters.

### Filters

The filter bar includes search and Shadcn Select controls for:

- fiscal year;
- category;
- managing office;
- jurisdiction or barangay;
- active status.

No native HTML select elements are permitted.

### Registry Table

The main table shows:

- fund code and name;
- category and ownership;
- managing office;
- appropriation;
- available balance;
- utilization;
- active status.

The table supports record selection and provides an empty state when no record matches the filters.

### Detail Panel

The selected fund panel shows:

- official identity and legal basis;
- purpose and restrictions;
- municipal or barangay ownership;
- fiscal-year appropriation, commitments, obligations, disbursements, and available balance;
- utilization indicator;
- recent audit history;
- edit and activate/deactivate actions.

### Create and Edit Forms

Create and edit forms use Shadcn Select components and existing application form styling. Form validation is inline and preserves user-entered values after an error.

Fund identity and governance fields are edited independently from the fiscal profile. This avoids conflating permanent configuration with annual balances.

### Confirmation and Feedback

Deactivation requires explicit confirmation. If financial safeguards block deactivation, the UI explains the exact outstanding balance. Successful saves show a concise confirmation and immediately update the table, summary, detail panel, and audit trail.

## Dummy Data

Seed data will demonstrate the full registry model with realistic Matnog examples:

- General Fund;
- 20% Municipal Development Fund;
- barangay development funds for multiple barangays;
- Local DRRM Fund with representative prevention, response, and quick-response classifications in restrictions or purpose;
- GAD allocation;
- Special Education Fund;
- sectoral appropriation;
- trust fund;
- provincial or national grant;
- development loan.

Records will include a mix of utilization levels, active and inactive statuses, and municipal and barangay ownership. The selected fiscal year defaults to the application shell fiscal year.

## Component Boundaries

- Route page: thin server component that renders the feature view.
- Registry view: filter orchestration, selected record, form mode, and feedback state.
- Registry table: tabular rendering and selection only.
- Detail panel: financial and governance presentation plus action entry points.
- Fund form: permanent fund-source fields and validation display.
- Fiscal-profile form: annual financial fields and validation display.
- Store: dummy records, derived-independent mutations, and audit creation.
- Utilities: balance, utilization, formatting, and validation helpers.

Components will communicate through typed props and store actions. Derived totals remain selectors or view calculations rather than duplicated state.

## Error Handling

- Validation failures do not mutate Zustand state.
- Duplicate codes and duplicate fiscal-year profiles return field-specific errors.
- Missing records produce a safe empty selection instead of throwing.
- Deactivation safeguards return a blocking message containing the relevant committed or obligated amount.
- Forms prevent double submission while a save handler is executing, even though the current store is synchronous.

## Accessibility and Responsive Behavior

- All controls have accessible names.
- Form labels are explicitly associated with their controls.
- Keyboard focus is visible.
- Status and utilization are communicated with text, not color alone.
- On narrower screens, filters wrap, the registry and detail panel stack, and the table remains horizontally scrollable.

## Verification

The implementation must pass:

- Biome formatting, linting, and import organization;
- TypeScript type checking;
- a production Next.js build;
- a native-select source guard;
- browser rendering at `/planning-funding/fund-sources`;
- create and edit workflow checks;
- duplicate-code validation;
- annual financial-rule validation;
- successful activation and permitted deactivation;
- blocked deactivation with outstanding commitments or obligations;
- filter, empty-state, and responsive-layout checks;
- confirmation that the running development server remains available after verification.

## Delivery Boundary

Completion of this phase means administrators can manage realistic fund-source and annual-profile dummy data with reliable validation and audit history. The next phase will consume this registry to implement fund eligibility rules; it will not be bundled into this phase.
