# Project Registry Foundation Design

## Objective

Establish the shared project domain and the first complete operational workspace for the LGU Matnog Project Management System. This phase delivers realistic Zustand-backed project records, the portfolio Overview, the All Projects masterlist, the Project Detail workspace, and Proposal Intake. Later planning, funding, procurement, inspection, closeout, transparency, and audit modules will consume the same project record.

## Reference conventions

Use `WebApp(Barangay-Affairs)` as the behavioral and visual reference without modifying or importing code across project boundaries.

The implementation will follow these patterns:

- Feature-based folders containing `types`, `data`, `stores`, `utils`, `components`, and `views`.
- Deterministic dummy-data factory functions rather than one large hard-coded array.
- Typed Zustand stores initialized once at module scope with session-only mutations.
- Narrow Zustand selectors in React views.
- Compact Poppins typography, green civic palette, white cards, thin borders, restrained shadows, semantic badges, dense operational tables, and responsive forms.
- Thin App Router route files that render feature views.
- shadcn/Radix controls for selects, tabs, dialogs, and other interactive primitives. Native `<select>` elements are prohibited.

## Feature architecture

```text
src/
  app/
    page.tsx
    pipeline/
      all-projects/page.tsx
      proposal-intake/page.tsx
    projects/[id]/page.tsx
  data/
    barangays.ts
  features/
    project-registry/
      components/
      data/project-dummy-data.ts
      stores/project-registry-store.ts
      types/project.ts
      utils/project-utils.ts
      views/
        portfolio-overview-view.tsx
        project-masterlist-view.tsx
        project-detail-view.tsx
        proposal-intake-view.tsx
  shared/components/ui/
```

## Shared project record

The `Project` resource is the authoritative record for this frontend prototype. It includes enough structured data to support current screens and later modules without embedding every future workflow in the first phase.

### Identity and ownership

- Internal ID and human-readable project code.
- Project title, short description, problem statement, expected outcome, and project type.
- Proposal source: department, barangay BDP, council resolution, constituent request, or emergency assessment.
- Implementing department, requesting office, lead officer, and barangay or municipality-wide scope.
- Target location, coordinates, beneficiary count, and beneficiary sectors.

### Lifecycle

- Pipeline status: Draft, Submitted, Under Review, Prioritized, Funded, Deferred, or Rejected.
- Delivery stage: Planning, Readiness, Procurement, Implementation, Inspection, Closeout, Completed, or On Hold.
- Priority rank and scoring breakdown.
- Created, submitted, approved, target-start, target-completion, and last-updated dates.

### Planning and funding summaries

- CDP, LDIP, and AIP references.
- Fiscal year and multi-year flag.
- One or more funding allocations with source, share, amount, and eligibility state.
- Total budget, appropriation, obligation, and disbursement values.
- Physical and financial progress percentages.

### Operational summaries

- Readiness checklist completion and blocking-item count.
- Procurement mode and procurement status.
- Contractor or supplier summary when awarded.
- Schedule variance, slippage days, risk level, and risk reasons.
- Thematic tags with optional percentage attribution.
- Document count and completeness percentage.
- Recent activities and milestone dates.

## Dummy data

Create a deterministic factory producing 72 fictional but locally credible projects distributed across Matnog barangays, municipal departments, project types, fiscal years, funding sources, pipeline statuses, and delivery stages.

The dataset must deliberately include:

- Municipal and barangay-funded projects.
- Co-funded and multi-year projects.
- Projects across every pipeline status and delivery stage.
- Road, water, health, education, evacuation, livelihood, coastal protection, public building, drainage, and digital-service projects.
- Healthy, watch-list, at-risk, stalled, and completed projects.
- Different readiness, procurement, physical-progress, and financial-progress conditions.
- Emergency projects and thematic GAD, climate, DRR, senior/PWD, and SDG tags.
- Activity histories and document summaries suitable for detail tabs.

The factory uses a fixed seeded pseudo-random generator so reloads are stable. Explicit featured records provide predictable examples for dashboard callouts and tests.

## Zustand store

`useProjectRegistryStore` owns session-only project state and supports:

- `projects` and `nextProjectSequence`.
- `addProposal(input)` returning the created draft or submitted project.
- `updateProject(id, changes)` while preserving immutable identifiers.
- `transitionProject(id, status, note)` with an appended activity entry.
- `getProjectById(id)` for imperative workflow actions.
- `addActivity(projectId, activity)` for audit-like session history.

Search, filtering, sorting, pagination, and dashboard aggregation remain pure utilities or memoized view derivations, not duplicated state.

## Overview dashboard

The root route becomes a portfolio command center scoped by the existing fiscal-year and jurisdiction controls.

### Header and actions

- Page title and concise portfolio description.
- Primary action: New proposal.
- Secondary action: Open project masterlist.

### Portfolio summaries

- Total projects and total approved portfolio value.
- Active implementation count.
- Obligation and disbursement utilization.
- Projects at risk.
- Readiness-blocked projects.
- Projects completed this fiscal year.

### Operational panels

- Pipeline distribution by status.
- Financial utilization by fund source.
- Physical versus financial progress comparison.
- At-risk project table with risk reason, barangay, slippage, and responsible office.
- Upcoming milestones and expiring items.
- Barangay portfolio rollup.
- Recent project activity.

Charts remain simple and decision-oriented. Avoid decorative visualizations.

## All Projects masterlist

The `/pipeline/all-projects` route becomes the authoritative portfolio list.

### Toolbar

- Search by project code, title, barangay, department, contractor, or fund source.
- shadcn Select filters for fiscal year, pipeline status, delivery stage, fund source, department, barangay, project type, and risk level.
- Clear-filters action and visible active-filter count.
- Column visibility control.
- New proposal action.

### Table

Default columns:

- Project code and title.
- Barangay or municipal scope.
- Implementing department.
- Fiscal year.
- Fund source.
- Budget.
- Pipeline status.
- Delivery stage.
- Physical and financial progress.
- Risk.
- Target completion.
- Contextual actions.

The table supports client-side sorting, pagination, 15/25/50 row sizes, sticky headers, horizontally scrollable density, semantic badges, hover state, empty-filter results, and links to project details.

## Project Detail workspace

The `/projects/[id]` route presents one project as the single source of operational truth.

### Record header

- Back to masterlist.
- Project code, title, location, department, status, stage, risk, and emergency indicator.
- Contextual actions appropriate to the current status.
- Budget, physical progress, financial progress, and target completion summaries.

### Tabs

- Summary: core description, outcomes, beneficiaries, location, funding, milestones, risks, and responsible staff.
- Planning: proposal source, scoring, prioritization, and CDP/LDIP/AIP linkage.
- Funding: allocations, appropriation, obligation, disbursement, and utilization.
- Readiness: checklist summary and blocking prerequisites.
- Procurement: method, procurement state, contractor, securities, and key dates.
- Implementation: program-of-work summary, progress, slippage, variations, and billing.
- Inspections: inspection summary, issues, tests, photos, and punch list counts.
- Documents: categorized document register and completeness status.
- History: reverse-chronological immutable-looking activity timeline.

Tabs expose meaningful dummy summaries now and become deeper operational views in later phases.

## Proposal Intake

The `/pipeline/proposal-intake` route provides a production-style multi-step form:

1. Source and ownership.
2. Need, beneficiaries, and location.
3. Expected outcome, project type, cost, and schedule.
4. Plan linkage, proposed fund sources, and thematic tags.
5. Review and save.

Use React Hook Form with Zod validation and shadcn controls. The user may save a Draft or Submit the proposal. Both actions write to Zustand, append an activity record, and route to the created Project Detail page. Required fields display inline errors and the review step summarizes all entered information.

## Shared UI and styling

Create only the reusable primitives needed by this phase:

- Button, Card, Badge, Input, Textarea, Select, Tabs, Progress, Dialog or Dropdown Menu, and Pagination controls.
- PageHeader, MetricCard, StatusBadge, ProgressPair, EmptyState, and DataTable-oriented styles.

All controls use the existing green palette and Poppins typography. Semantic yellow, red, and blue are reserved for warning, danger, and information states. Components meet visible-focus and accessible-name requirements.

## State and filtering behavior

- The top-bar fiscal year and jurisdiction scope filter Overview and All Projects.
- Municipality-wide scope includes municipal projects plus all barangays.
- All-barangays scope excludes purely municipal-office projects.
- A specific barangay includes that barangay’s projects and municipality-wide projects that explicitly cover it.
- Newly created proposals immediately appear in dashboard counts and the masterlist.
- No state is persisted across browser reloads during the dummy-data phase.

## Error and empty states

- Unknown project IDs show a focused not-found state with a masterlist return action.
- Filters with no results show an actionable empty state and Clear filters.
- Form validation is inline and prevents invalid saves.
- Zustand mutations return `undefined` when a target does not exist; views surface a clear message rather than failing.

## Verification

- Unit tests cover deterministic generation, portfolio aggregation, filtering, sorting, and store mutations.
- TypeScript, Biome, and production build pass.
- Browser checks cover dashboard rendering, filters, sorting, pagination, project navigation, tab switching, proposal validation, draft creation, and submission.
- Desktop and narrow-screen layouts remain usable.
- No native `<select>` elements are introduced.

## Completion criteria

This phase is complete when a user can review the portfolio from Overview, find and filter projects in All Projects, open a realistic multi-tab Project Detail record, create or submit a proposal, and see the new session record reflected everywhere through Zustand.
