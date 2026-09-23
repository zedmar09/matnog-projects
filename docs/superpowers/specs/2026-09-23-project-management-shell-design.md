# LGU Matnog Project Management Shell Design

## Objective

Create the initial application shell for the LGU Matnog Project Management System. This first implementation establishes the product frame only: a production-quality sidebar, top navigation, responsive behavior, and an empty content canvas. Project-management modules and their final navigation structure are deliberately excluded until the sidebar information architecture is reviewed separately.

## Reference and visual direction

- Use `WebApp(Barangay-Affairs)` as the structural and implementation reference.
- Preserve its Next.js App Router, TypeScript, component organization, responsive behavior, and local-first prototype approach.
- Adapt the supplied visual reference into an LGU interface: a charcoal sidebar, white top navigation, orange accent, compact icons, restrained borders, and a light neutral workspace.
- Treat the reference image as visual inspiration only. Its product labels and features are not requirements.

## Application frame

### Sidebar

- Fixed left rail on desktop and an overlay drawer on narrow screens.
- Municipality of Matnog identity at the top.
- Compact navigation rows with white or muted icons and labels.
- Orange is used for the active item and small attention indicators.
- Section headings and navigation entries are driven by a typed configuration file.
- The initial configuration contains only `Overview` as a temporary entry.
- Project-management modules will not be invented during shell implementation.

### Top navigation

- White horizontal bar aligned with the content area.
- Current page title.
- Global search field presented as an application-level affordance.
- Fiscal-year selector.
- Jurisdiction selector supporting municipal scope, all barangays, and individual barangay scope.
- Notifications control.
- User profile menu using realistic LGU staff identity data.

### Content canvas

- Empty light-neutral workspace beneath the top navigation.
- No dashboard widgets, charts, tables, forms, or project records in this phase.
- The canvas must provide a clean layout target for later feature screens.

## Interaction state

Zustand owns shell-level UI state:

- Sidebar collapsed or expanded state.
- Mobile drawer open or closed state.
- Selected fiscal year.
- Selected jurisdiction scope.

State is prototype-local and requires no API, database, authentication provider, or file service.

## Component boundaries

- `AppShell`: overall desktop and mobile layout.
- `Sidebar`: brand, sections, navigation items, collapse behavior, and mobile dismissal.
- `TopNavigation`: page title, search, selectors, notifications, and profile actions.
- `navigation.ts`: typed navigation configuration kept independent from rendering.
- `shell-store.ts`: Zustand state and actions for the application frame.
- Shared UI primitives remain independent of project-management domain modules.

## Responsive and accessibility requirements

- Desktop sidebar remains visible and may collapse to an icon rail.
- Mobile sidebar opens as a modal drawer with a scrim and closes on navigation or Escape.
- All controls have accessible names and visible keyboard focus.
- Active navigation uses more than color alone.
- Icon-only controls provide tooltips or equivalent accessible labels.
- Text and control contrast meet WCAG AA expectations.

## Implementation constraints

- Build inside `WebApp(Project-Management)`.
- Do not modify `WebApp(Barangay-Affairs)`.
- Reuse the reference project's tooling and compatible package versions.
- Do not copy build artifacts, dependency folders, deployment metadata, or Git history.
- Use realistic dummy identity and selector values.
- Do not implement final sidebar modules during this phase.
- Do not add a backend, authentication service, database, or persistent file storage.

## Verification

- TypeScript type-check passes.
- Production build passes.
- Shell renders at desktop and mobile widths.
- Sidebar collapse and mobile drawer interactions work.
- Fiscal-year and jurisdiction selections update Zustand state.
- Keyboard navigation and Escape dismissal work.
- The content canvas remains intentionally empty.

## Completion criteria

The phase is complete when the project opens to a polished, responsive LGU Matnog shell matching the approved visual direction, with only the temporary `Overview` navigation item and no project-management feature content.
