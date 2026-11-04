# Qirvexa — Product Requirements Document

**Document status:** Current product baseline  
**Last updated:** 4 November 2026  
**Product:** Qirvexa, a bilingual workspace for independent professionals and small service teams  
**Product URL:** <https://qirvexa.qirvexa.workers.dev>  
**Repository:** <https://github.com/abomosaa/qirvexa>

## 1. Product overview

Qirvexa brings a small service business's project records, tasks, deadlines, client details, and recorded financial figures into one workspace. A focused AI assistant turns a short idea into an editable project brief. The product is designed for clear day-to-day tracking rather than accounting, billing, or team collaboration.

The current implementation is a public portfolio product. Its sample clients, projects, amounts, and tasks are fictional. It supports Arabic with right-to-left layout and English with left-to-right layout.

## 2. Problem and opportunity

Independent professionals often track projects, client details, deadlines, and payment status in separate notes or spreadsheets. This makes it harder to see what needs attention, understand progress, and prepare a consistent project brief. Qirvexa provides one clear, lightweight view of this work.

## 3. Users

- **Independent professional:** manages several client projects and needs to track tasks, deadlines, and recorded payment status.
- **Small service-business owner:** needs a quick overview of active work, client relationships, and outstanding balances.
- **Portfolio evaluator:** recruiter or prospective client exploring a realistic bilingual dashboard and its product workflows.

The current product does not provide shared team accounts or collaboration permissions.

## 4. Product goals

1. Let a user understand their current workload and next actions from the dashboard.
2. Support practical create, view, edit, and delete workflows for projects, tasks, and client records.
3. Make project progress, deadlines, and recorded financial figures easy to review.
4. Help users draft and refine project briefs using the AI assistant.
5. Provide a usable Arabic-first experience and a complete English interface across desktop and mobile layouts.
6. Keep each signed-in user's cloud records isolated, while retaining a usable device-local guest mode.

## 5. Non-goals

- Invoices, payment processing, bank connections, bookkeeping, tax calculations, or financial advice.
- Shared workspaces, team invitations, role administration, or real-time collaboration.
- Calendar-provider synchronization, appointment booking, or native mobile applications.
- Guarantees about AI output accuracy or automatic changes to project records.
- Treating fictional sample data or manual payment-status fields as evidence of real clients or transactions.

## 6. Core user journeys

### 6.1 Review the workspace

The user opens the dashboard, reviews project and financial summaries, sees project statuses and task progress, and identifies upcoming deadlines or clients that need attention. Dashboard totals and visualizations are derived from the currently displayed project records and active filters.

### 6.2 Manage project work

The user creates or edits a project, associates it with a client, records a value and status, and adds tasks with due dates, priorities, and progress. The user can open project details directly, update work, and remove records after confirmation. Unsaved edits are protected when navigating away.

### 6.3 Organize client records

The user maintains client contact details and reviews the projects and recorded value associated with each client.

### 6.4 Draft an AI project brief

The user enters a short idea and requests a brief. Qirvexa displays the generated text for review and editing. The user may save the reviewed brief to a project. The assistant does not create or update a project without the user's explicit save action.

### 6.5 Use Qirvexa as a guest or signed-in user

Guests use local device storage; guest data is not uploaded when they sign in. Signed-in users authenticate through Supabase Auth and access their own cloud records, which are protected by database ownership policies. Google sign-in is configured. Email confirmation and recovery depend on a functioning email delivery provider.

## 7. Functional requirements

### FR-1 — Dashboard and navigation

- Provide navigation to overview, projects, deadlines, clients, finances, AI brief assistant, and account settings.
- Show useful summaries, project status, upcoming work, client value, and task progress.
- Derive dashboard figures from the displayed project records; filters and date periods must update relevant summaries and charts.
- Provide quick search and responsive navigation for narrow screens.

### FR-2 — Project management

- Create, view, edit, and delete projects.
- Store project name, client relationship, status, dates, financial values, description, and optional private notes/details supported by the current data model.
- Support search, sorting, status/date filtering, and project deep links.
- Allow CSV export of project data.

### FR-3 — Task and deadline management

- Associate tasks with a project.
- Record task title, status, priority, and due date, plus progress/details available in the current interface.
- Show upcoming deadlines and task completion in the workspace.
- Persist edits according to guest or authenticated storage mode.

### FR-4 — Client management

- Create and edit client contact profiles.
- Relate clients to projects and show a summary of those projects and their recorded values.
- Keep client data within the same guest-local or authenticated-owner boundary as related projects.

### FR-5 — Financial tracking

- Record project contract value, amount marked paid, and outstanding balance.
- Provide summary and chart views based on recorded project data.
- Label payment status as manually recorded; do not imply that Qirvexa processes or verifies a payment.

### FR-6 — AI brief assistant

- Accept a bounded user idea and request a brief through the Cloudflare Worker endpoint.
- Show loading, success, and recoverable failure states, including when the free inference quota is unavailable.
- Let the user review and edit generated text before saving it to a selected project.
- Do not expose provider credentials in the browser or silently persist generated content.

### FR-7 — Authentication and data isolation

- Support guest mode and configured Google authentication through Supabase Auth.
- Persist guest records on the current device only.
- Store signed-in records in Supabase with owner-scoped access enforced by Row Level Security and ownership relationships.
- Do not migrate guest data into an account automatically.
- Provide sign-out and recover cleanly when the active account changes.

### FR-8 — Internationalization and accessibility

- Provide Arabic RTL and English LTR interfaces.
- Preserve the chosen language during navigation and present readable forms, tables, charts, and dialogs in both directions.
- Support keyboard navigation, visible focus, reduced-motion preferences, responsive layouts, and accessible names for controls.

## 8. Data and security requirements

- Never place Supabase secret/service-role credentials or Cloudflare provider credentials in client-side code.
- Enforce authenticated record ownership in the database, not only in the UI.
- Treat all prefilled sample records as fictional and label guest sample data accordingly.
- Keep user-provided AI ideas within documented request limits and handle failures without losing the draft.
- Do not use real client information, personal contacts, or payment details in portfolio fixtures.

## 9. Non-functional requirements

- **Responsive:** core journeys work on common phone, tablet, and desktop widths.
- **Localization:** all user-facing workflows support Arabic RTL and English LTR.
- **Resilience:** unavailable AI or authentication services produce understandable errors and preserve unsaved work where applicable.
- **Privacy:** guest data remains local; authenticated data is isolated by owner policies.
- **Motion:** transitions communicate state and respect reduced-motion preferences.
- **Performance:** avoid unnecessary requests and keep interactions responsive; deployment and bundle limits remain subject to the configured free service plans.

## 10. Acceptance criteria

1. A guest can review sample projects, search/filter them, navigate to deadlines and clients, and see summaries that match the visible records.
2. A guest can create and update a project and its tasks, refresh the page, and retain those records on the same device.
3. A signed-in user can manage cloud records, refresh, and retrieve their own records; another user cannot read or change them.
4. Project search, date/status filters, CSV export, and project deep links work without losing unrelated unsaved edits.
5. Arabic and English layouts work at mobile and desktop widths, with usable keyboard focus and reduced-motion behavior.
6. The AI assistant returns an editable brief or a clear recoverable error. Saving a brief requires an explicit user action.
7. Financial labels make clear that values and payment status are recorded manually and no real payment is processed.

## 11. Success measures

For the portfolio version, success is demonstrated by completing the key journeys reliably: project and task management, client review, financial summaries, bilingual navigation, guest persistence, owner-isolated cloud access, and AI brief review/save. These measures describe product validation goals; no visitor analytics or commercial conversion figures are claimed.

## 12. Known constraints and dependencies

- Cloud storage and authentication depend on the configured Supabase project and its free-plan availability.
- AI brief generation depends on the Cloudflare Worker and available Workers AI quota.
- Email confirmation/recovery requires a verified SMTP configuration; if email delivery is unavailable, Google sign-in and guest mode remain the usable paths.
- Sample names and business figures are fictional. Finance screens are organizational summaries, not accounting records.
- Current visual and test evidence is documented separately in `REVIEW.md`; this PRD describes expected product behavior and does not itself certify production readiness.

## 13. Related documentation

- [README](README.md) — public overview and project setup.
- [PRODUCT](PRODUCT.md) — concise product/design constraints.
- [REVIEW](REVIEW.md) — implementation evidence, test scope, and known limitations.
- [DESIGN](DESIGN.md) — visual system and interface direction.
