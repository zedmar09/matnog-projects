# Fund Utilization Report Implementation Plan

## Objective

Implement the approved hybrid Fund Utilization report at `/reports/fund-utilization` using existing Zustand project and fund-source data, the supplied `reports.jpg` banner, Shadcn filters, graphical summaries, an attention panel, and a paginated detail table.

Design reference: `docs/superpowers/specs/2026-09-24-fund-utilization-report-design.md`

## Delivery Strategy

1. Add typed, pure report calculations.
2. Build reusable report visuals without adding a chart dependency.
3. Compose the filter-consistent report view.
4. Add the route and banner asset.
5. Verify calculations, responsive rendering, filters, and pagination.

## Task 1: Report Types and Calculations

### Files

- Create `src/features/reports/types/fund-utilization.ts`.
- Create `src/features/reports/utils/fund-utilization-utils.ts`.

### Work

- Define filters, normalized project rows, grouped fund and barangay summaries, trend points, attention items, and sort keys.
- Normalize project financial values and funding allocations.
- Derive totals, rates, utilization conditions, group rankings, deterministic monthly trend points, and attention items.
- Preserve unassigned funding as a visible group.

### Verification

- Guard zero appropriation and negative derived balances.
- Confirm allocation shares preserve each project's financial totals.
- Confirm all summaries reconcile with the filtered rows.

## Task 2: Build Report Visual Components

### Files

- Create `src/features/reports/components/fund-utilization-charts.tsx`.
- Create `src/features/reports/components/fund-utilization-table.tsx`.
- Create `src/features/reports/views/fund-utilization-report.module.css`.

### Work

- Build accessible CSS/SVG budget execution, fund-source, barangay, and monthly trend charts.
- Add textual values, legends, and empty states.
- Build the sortable project table with utilization badges, progress indicators, project links, and pagination controls.
- Preserve Poppins typography, green visual language, and compact enterprise density.

### Verification

- Ensure charts remain readable without hover.
- Ensure the table scrolls horizontally on narrow screens.
- Ensure no native select is added.

## Task 3: Compose the Report View

### Files

- Create `src/features/reports/views/fund-utilization-report-view.tsx`.

### Work

- Consume project, fund-source, and shell stores read-only.
- Add the banner, export feedback, filters, six KPI cards, four charts, attention panel, and detailed table.
- Apply one filter state to every report section.
- Reset pagination after filter changes and expose a coordinated empty state.

### Verification

- Confirm every section changes with the same filters.
- Confirm filtering and clearing preserve valid selections.
- Confirm attention links open existing project records.

## Task 4: Route and Asset

### Files

- Copy `/Users/edmarsanchez/Downloads/reports.jpg` to `public/images/reports.jpg`.
- Create `src/app/reports/fund-utilization/page.tsx`.

### Work

- Add a thin App Router page that renders the report view.
- Use the copied image in a darkened report banner.

### Verification

- Confirm `/reports/fund-utilization` returns HTTP 200.
- Confirm the banner image loads and heading contrast is readable.

## Task 5: Quality and Browser Verification

### Checks

- Format and lint the files touched by this phase.
- Run TypeScript checking and report unrelated pre-existing failures separately.
- Run `git diff --check` and a native-select source guard.
- Test default rendering, filter reset, zero-result state, sorting, page-size changes, Next/Previous navigation, export feedback, and project links.
- Inspect the browser console for errors.

## Completion Criteria

- Non-technical users can understand appropriation, obligation, disbursement, and attention areas from the graphical report.
- Finance and operations users can validate the same filtered data in the detailed table.
- The supplied report banner and existing LGU visual system are used consistently.
- All data remains dummy data derived from Zustand stores.
- No other Reports page is implemented in this phase.
