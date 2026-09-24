# Fund Utilization Report Design

## Purpose

Build the first Reports phase for the LGU Matnog Project Management System. The Fund Utilization report will help non-technical municipal leaders understand budget execution quickly while preserving the detailed figures needed by planning, accounting, treasury, and engineering staff.

The page will use a hybrid design: concise graphical summaries for interpretation, followed by a detailed project-level table for validation and drill-down. All figures remain production-style dummy data derived from existing Zustand stores; no backend, accounting integration, or spreadsheet import is included.

## Scope

### Included

- A Fund Utilization report at `/reports/fund-utilization`.
- The supplied `reports.jpg` image as the report banner background with a dark overlay for readable white text.
- Shared filters for fiscal year, fund source, barangay or municipal scope, project type, delivery stage, and utilization condition.
- Financial summary indicators for appropriation, obligations, disbursements, balances, and execution rates.
- Fund-source-first graphical reporting with project-level drill-down.
- A detailed, sortable, paginated project table.
- Export feedback appropriate for a dummy-data interface.
- Responsive, accessible presentation consistent with the existing Monitoring, Planning & Funding, and Project Registry pages.

### Excluded

- Barangay Performance and Project Status report pages.
- Backend persistence or live financial-system integration.
- Transaction-level journal entries, vouchers, purchase orders, or check registers.
- Editing financial values from the report page.
- Real PDF, Excel, or CSV generation in this phase.
- User-configurable chart builders or saved report templates.

## Audience and Information Hierarchy

The primary audience is the Mayor, department heads, planning staff, and other users who may not be technically or financially specialized. The initial viewport must answer four questions without requiring table inspection:

1. How much funding is available?
2. How much has been obligated?
3. How much has actually been disbursed?
4. Which fund sources or projects need attention?

The page therefore starts with plain-language summary indicators and visual comparisons. Detailed figures and project links appear after the charts for finance and operations users.

## Financial Definitions

The report uses the existing project and fund-source terminology:

- `appropriation`: authorized funding available for execution;
- `obligation`: amount legally committed against the appropriation;
- `disbursement`: amount already paid;
- `availableBalance`: appropriation minus obligation;
- `undisbursedObligation`: obligation minus disbursement;
- `obligationRate`: obligation divided by appropriation;
- `disbursementRate`: disbursement divided by appropriation.

All derived values guard against zero appropriation and negative display values. Currency uses Philippine peso formatting. Rates are rounded for executive summaries while exact amounts remain available in the table and tooltips.

## Page Design

### Banner

The report banner reuses the established full-width module treatment. `reports.jpg` will be copied from the user's Downloads folder into `/public/images/reports.jpg` and displayed beneath a dark charcoal-to-green overlay.

The banner contains:

- the eyebrow `Financial reports`;
- the title `Fund Utilization`;
- a one-sentence description explaining appropriation, obligation, and disbursement monitoring;
- an `Export Report` action that provides production-style feedback without creating a real file.

### Filter Bar

One shared filter state drives every summary card, chart, alert, and table row. Controls use the existing Shadcn Select implementation rather than native selects.

Filters include:

- fiscal year;
- fund source;
- jurisdiction: municipality-wide or a specific barangay;
- project type;
- delivery stage;
- utilization condition: all, low utilization, healthy, high utilization, or fully utilized;
- free-text search for project code or title.

Changing a filter immediately recalculates every report section and resets table pagination to the first page. A visible `Clear filters` action appears only when a non-default filter is active.

### Summary Indicators

Six indicators present filtered portfolio totals:

- total appropriation;
- total obligations;
- total disbursements;
- available balance;
- obligation rate;
- disbursement rate.

Amounts use compact peso notation with full values available in accessible labels or supporting text. Rate cards include progress bars and plain-language descriptors such as `Healthy execution` or `Needs attention`; color is never the only status signal.

### Graphical Reports

The visual section contains four focused reports rather than a dense analytics dashboard:

1. **Budget execution overview** — a grouped horizontal comparison of appropriation, obligations, and disbursements. This gives non-technical users the clearest view of the budget pipeline.
2. **Utilization by fund source** — ranked horizontal bars showing obligation and disbursement rates for the largest active fund sources. The view is fund-source-first by default.
3. **Utilization by barangay** — a ranked comparison of barangay appropriation and disbursement rate, with municipality-wide projects shown as a separate scope.
4. **Monthly disbursement trend** — a cumulative line or area chart using deterministic dummy monthly allocations derived from the current project totals.

Each chart includes a title, short explanatory subtitle, legend, readable value labels or tooltips, and a no-data state. Charts use the established green palette with muted teal, amber for attention, and restrained red only for critical exceptions.

### Attention Panel

A compact `Needs attention` panel identifies the most actionable exceptions:

- projects with appropriation but no obligation;
- obligated projects with low disbursement;
- large undisbursed obligations;
- high financial slippage or delayed implementation where available.

Each item contains a concise explanation and links to the relevant project. The panel is derived from existing project data and does not create a separate workflow or mutation.

### Detailed Project Table

The table provides the audit-level view beneath the graphics. Columns include:

- project code and title;
- barangay or municipality-wide scope;
- fund source;
- project type and delivery stage;
- appropriation;
- obligation;
- disbursement;
- available balance;
- obligation rate;
- disbursement rate;
- utilization condition;
- action to open the project record.

The table supports sorting, a Shadcn rows-per-page selector, result range, Previous and Next controls, empty state, and horizontal scrolling on narrow screens. The default page size is 15 rows so the report remains readable without presenting the entire portfolio at once.

## Data Architecture

The report is read-only and does not need a new mutation store. It consumes:

- projects from `useProjectRegistryStore` for project identity, financial totals, barangay, type, delivery stage, risk, and fund allocations;
- fund sources and fiscal profiles from `useFundSourceStore` for official fund-source names, categories, and annual profiles;
- the shell fiscal-year selection when compatible with the current store interface.

A dedicated report utility module will normalize the source data into typed report rows and compute totals, fund-source groups, barangay groups, trend points, and attention items. Derived report values will not be copied into Zustand state.

When a project has multiple fund allocations, financial amounts are distributed by allocation share. Projects without explicit allocations remain visible under `Unassigned funding` so totals are not silently omitted.

## Component Boundaries

- Route page: thin route component for `/reports/fund-utilization`.
- Report view: owns filters, sorting, pagination, selection, and export feedback.
- Summary strip: renders the six financial indicators.
- Chart section: renders the four graphical summaries from typed derived data.
- Attention panel: renders actionable exceptions and project links.
- Project table: renders sortable, paginated audit rows.
- Report utilities: normalization, grouping, financial calculations, trend generation, formatting, and utilization classification.
- Report types: filter, row, group, trend, and attention-item contracts.

The component structure remains feature-local under `src/features/reports` so later Reports pages can reuse visual primitives without coupling their business logic.

## Empty and Error States

- If filters return no projects, all sections show a coordinated no-data state with a `Clear filters` action.
- Zero appropriation displays `Not applicable` for execution rates rather than misleading zero-percent performance.
- Missing fund-source mappings display `Unassigned funding` and remain included in totals.
- Invalid derived values are clamped for display and surfaced as a data-quality attention item rather than causing rendering failure.
- Export feedback states that the filtered report was prepared; it does not claim that a file was downloaded.

## Accessibility and Responsive Behavior

- All filters, table controls, chart legends, and actions have accessible names.
- Charts include equivalent textual summaries for their key values.
- Financial status is communicated with labels and values, not color alone.
- Keyboard focus is visible and logical.
- At tablet width, chart panels collapse to one column and the attention panel moves below them.
- At mobile width, summary indicators stack, filters wrap, charts retain readable labels, and the table scrolls horizontally.

## Verification

The implementation must verify:

- Biome formatting, linting, and import organization for files touched by this phase;
- TypeScript compatibility, while reporting any unrelated pre-existing project errors separately;
- no author-written native `<select>` elements;
- successful rendering at `/reports/fund-utilization`;
- the supplied banner image loads with readable title contrast;
- summary, chart, attention, and table values change from the same filters;
- filter clearing and pagination reset behavior;
- sorting and page-size controls;
- project drill-down links;
- zero-appropriation, unassigned-funding, filtered-empty, and responsive states;
- no browser console errors in the running application.

## Delivery Boundary

Completion of this phase means users can understand and inspect municipal fund utilization from one filter-consistent hybrid report. Barangay Performance and Project Status remain separate future phases and will reuse only appropriate report primitives after this page is approved.
