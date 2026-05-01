# Pitlane Interface V0 Implementation Plan

Date: 2026-05-01

## Summary

This plan formalizes the Pitlane interface redesign based on:

- `docs/TODO/ui-redesign-command-center-reference.png`
- `docs/TODO/pitlane-aurora-palette-reference.png`
- `docs/TODO/ui-redesign-tab-scope.md`
- the current React/Tauri UI in `src/components`
- the existing Aurora theme tokens in `src/index.css`

The implementation should move Pitlane from the current four-tab layout into a more operational app shell centered on a new Command Center. The target navigation table is the source of truth for the v0 cut and future implementation priority. Future items use `Future-N`, where the lower number has higher implementation priority after v0.

No backend/Tauri command should be invented only for the redesign. If a tab or action needs data that does not exist yet, implement it as a clear placeholder or mark it as future work.

## Current State

The app currently has:

- `App.tsx` with tabs: `apps`, `log`, `history`, `settings`.
- `Sidebar` with four nav items.
- `StatusBar` as a compact top header.
- Screens for apps, logs, history, and settings.
- Existing hooks for apps, app statuses, iRacing status, logs, settings, and theme.
- Existing UI components for buttons, toggles, badges, modal, inputs, checkbox, empty state, and form fields.
- Aurora design tokens already defined in `src/index.css`.

The main implementation work is structural and compositional rather than a full rewrite.

## Target Navigation

Update the app shell around these planned tabs:

| Tab            | Purpose                                                         | V0/Future |
| -------------- | --------------------------------------------------------------- | --------- |
| Command Center | Main operational screen for session readiness and quick actions | V0        |
| Apps           | Administrative app library and per-app configuration            | V0        |
| Profiles       | Sets of apps and rules for different driving/streaming contexts | Future-0  |
| Automation     | Global launch/stop behavior and iRacing detection rules         | Future-1  |
| Logs           | Full diagnostic event log                                       | V0        |
| Settings       | General product preferences                                     | V0        |

Use stable internal ids:

```ts
type Tab = 'command' | 'apps' | 'profiles' | 'automation' | 'logs' | 'settings'
```

The default tab should be `command` once Command Center exists. If Command Center is deferred, default to `apps` and keep the sidebar item disabled or hidden according to the v0 cut.

## App Shell

Build the new shell as reusable layout components before changing individual screens.

### Components

- `AppShell`
    - Owns the top-level layout.
    - Provides the fixed top bar, sidebar, main content area, and bottom status bar.
    - Keeps `h-screen`, no page-level browser scrolling.

- `TopBar`
    - Displays Pitlane branding.
    - Displays the active profile selector area.
    - Keeps existing theme/language/settings controls where appropriate.
    - Window controls from the mockup are visual only unless the Tauri window API is intentionally wired.

- `Sidebar`
    - Expand current sidebar to the six planned tabs.
    - Use icon + label rows.
    - Use `aria-current="page"` for the active item.
    - Preserve keyboard-operable buttons.

- `BottomStatusBar`
    - Displays current time, service status, managed app count, and active profile.
    - Use existing data from `useApps`, `useAppStatuses`, and `useIRacingStatus`.
    - Do not add fake live service data beyond what exists.

### Data Flow

Keep data loading in `App.tsx` or a thin shell container:

- `useIRacingStatus()` for iRacing state.
- `useAppStatuses()` for running/crashed/idle app states.
- `useApps()` for active profile, apps, and auto-stop state.
- `useLog()` only in Command Center and Logs, unless the bottom bar needs recent event time.

Avoid duplicating API calls inside both shell and screen when the same data can be passed as props.

## Design Tokens And Visual Rules

Use `Pitlane Aurora` as the primary theme. Before implementation, compare `docs/TODO/pitlane-aurora-palette-reference.png` with `src/index.css` and only adjust tokens when there is an actual mismatch.

UI-00 result: the Aurora ramp and semantic tokens in `src/index.css` already match the palette reference. No token patch is required before component work starts.

Required visual rules:

- Main surfaces remain dark purple with aqua used for primary action and focus.
- Success, warning, and danger must use separate semantic colors.
- Operational states must include text or icon, not only color.
- Avoid cards inside cards.
- Keep cards/panels at `8px` radius or less unless an existing component requires otherwise.
- Keep text readable on all expected desktop widths.
- Do not introduce decorative gradient orbs or non-functional marketing layout.

The screenshot uses a subtle cockpit-like background treatment in the hero/status area. Implement that as restrained panel styling only if it does not reduce contrast or distract from operational content.

## Base Components

Consolidate these components before screen work:

### Styling Strategy

The redesign should keep Tailwind CSS v4, but avoid spreading long utility strings through screen files.

Detailed guide: `docs/TODO/ui-redesign-styling-strategy.md`.

Rules for V0:

- Screen components should prefer semantic components (`Panel`, `Toolbar`, `AppCommandRow`, `ActivityRow`, `MetricTile`) over repeated `className` blocks.
- Component variants should use `cva` when a component has meaningful variants, sizes, or state-driven styles.
- `cn(...)` should stay for short conditional composition, not as a place to hide large one-off layouts.
- Long Tailwind class strings are acceptable inside low-level reusable components, but should not dominate screen-level JSX.
- `src/index.css` may define small semantic classes only for repeated structural patterns that are awkward as components; do not create a broad parallel CSS framework.
- Do not migrate away from Tailwind, introduce CSS-in-JS, or add another styling dependency for V0.
- When unsure, create a focused component before adding a page-local styling abstraction.

### Existing Components To Reuse

- `Button`
- `Toggle`
- `Modal`
- `TextInput`
- `NumberInput`
- `Checkbox`
- `EmptyState`
- `FormField`
- `AppAvatar`
- existing status badge/tag components

### Components To Add Or Evolve

- `IconButton`
    - 44x44 or equivalent click target.
    - Requires `aria-label`.
    - Uses lucide icons.

- `StatusPill`
    - Variants: `online`, `offline`, `running`, `idle`, `crashed`, `disabled`, `warning`.
    - Includes icon/dot plus label.

- `Panel`
    - Lightweight surface wrapper with header/action slots.
    - Must not be nested inside another card-like panel.

- `MetricTile`
    - Compact summary tile for counts like `3 / 4 ready`.
    - Includes icon and label.

- `Toolbar`
    - Horizontal action/filter row.
    - Used in Command Center, Apps, and Logs.

- `AppCommandRow`
    - Dense operational app row for Command Center.
    - Includes identity, status, toggles, primary action, and overflow action.

- `ActivityRow`
    - Compact recent/full log row.
    - Includes timestamp, semantic event label, source/app, and message.

## Command Center

`V0/Future: V0`

Command Center answers: "Can I race now?"

### Content

- Overall readiness state:
    - `Ready for session`
    - `Needs attention`
    - `iRacing not detected`
- iRacing status.
- Active profile.
- App summary:
    - total apps
    - running count
    - crashed count
    - idle count
    - ready count
- Compact app list.
- Recent Activity.

### Calculations

Use the current app list and app statuses:

- `running`: status state is `running`.
- `crashed`: status state is `crashed`.
- `idle`: app is enabled and has no running/crashed status.
- `disabled`: app `enabled === false`.
- `ready`: enabled apps that are either running or idle, excluding crashed.

If no apps exist, show an empty state with a route/action to Apps.

### Actions

Per app:

- Start: `api.forceLaunchApp(app.id)`.
- Stop: `api.forceKillApp(app.id)`.
- Restart:
    - If no dedicated API exists, implement only if acceptable as stop then start with a short local sequence.
    - Otherwise mark as future/disabled.
- Auto-launch toggle:
    - Use existing `enabled` flag.
- Auto-stop toggle:
    - Use existing `stop_with_iracing` flag.
- Quick config:
    - Opens the existing app edit modal or navigates to Apps with the app selected.

Bulk actions:

- Start all:
    - Can be implemented by iterating enabled non-running apps and calling `forceLaunchApp`.
    - Errors should not stop attempts for the remaining apps; collect/report failures.
- Stop all:
    - Can be implemented by iterating running apps and calling `forceKillApp`.
    - Errors should not stop attempts for remaining apps.

Do not show a working bulk action unless it is actually wired.

## Apps

`V0/Future: V0`

Apps is the administrative library, not the primary session dashboard.

### Keep

- Add app.
- Edit app.
- Delete app.
- Start/stop test actions.
- Existing app form data model.
- Existing icon extraction.
- Existing enabled and stop-with-iRacing toggles.

### Change

- Make the list more administrative:
    - name
    - version if available in future
    - executable path
    - arguments
    - working directory
    - enabled/disabled state
    - startup/stop rules
- Move quick operational emphasis to Command Center.
- Keep cards/rows dense and scannable.

### App Form

Refactor only after shell and Command Center structure are stable.

Sections:

- Basic:
    - name
    - executable path
    - enabled
    - stop with iRacing
- Launch:
    - startup delay
    - arguments
    - working directory
- Recovery:
    - restart on crash
    - max restart attempts
- Advanced:
    - track process name
    - force kill
    - kill process tree

Basic and Launch can be open by default. Recovery and Advanced should be collapsible.

## Profiles

`V0/Future: Future-0`

Profiles need backend support beyond what exists today.

Current API exposes:

- `getProfiles`
- `getActiveProfileId`
- profile fields on apps

Missing or not confirmed:

- create profile
- duplicate profile
- rename profile
- delete profile
- set active profile
- assign apps to profile
- per-profile automation overrides

If Profiles is included in v0 before backend support, implement a read-only screen or placeholder showing the active profile and known profiles. Do not present fake CRUD controls.

## Automation

`V0/Future: Future-1`

Automation should contain global behavior rules.

Use existing data where available:

- global auto-stop from `getAutoStop` / `setAutoStop`
- default trigger from settings
- poll interval from settings
- autostart from settings if it remains system-level

Potential future controls:

- auto-launch global enablement
- launch delay between apps
- behavior when an app is already open
- minimize to tray
- confirm before stopping apps
- iRacing detection mode/details

If this tab is deferred, keep current relevant settings in Settings.

## Logs

`V0/Future: V0`

Evolve `LogScreen` from a raw feed into a diagnostic surface.

### Content

- Full event list from `useLog`.
- Filters:
    - All
    - Apps
    - iRacing
    - Errors, only if error events exist
- Search can be future unless required for v0.

### Rows

Use `ActivityRow` with:

- timestamp
- event chip:
    - `LAUNCH`
    - `STOP`
    - `IRACING ON`
    - `IRACING OFF`
- app/source label
- message

Avoid using symbols as the only event distinction.

### Missing APIs

Mark as future unless available:

- clear logs
- export logs
- copy event
- open logs folder

## Settings

`V0/Future: V0`

Settings remains for product preferences, not operational rules.

Keep:

- language
- theme
- notifications
- app version if available
- export/import config if added later
- reset/open data folder if added later

Move or duplicate carefully:

- autostart belongs in Settings unless Automation later takes ownership of startup behavior.
- poll interval/default trigger may belong in Automation.

Do not create multiple controls for the same setting unless they share one source of truth.

## i18n

Update `src/i18n/locales/en.json` and `src/i18n/locales/pt-BR.json` with keys for:

- new navigation labels
- Command Center headings and metrics
- app status summaries
- bulk action labels
- profile selector labels
- bottom status bar labels
- future/placeholder tab copy, if placeholders are included

Keep labels concise. Avoid explanatory text inside the operational UI unless it is necessary for an empty state or placeholder.

## Accessibility Requirements

- Active nav item uses `aria-current="page"`.
- Icon-only buttons require `aria-label`.
- Switches keep `role="switch"` and `aria-checked`.
- Modal keeps focus trap, Escape close, `aria-labelledby`, and focus return.
- Inputs with validation use `aria-invalid` and `role="alert"` for errors.
- Keyboard users can complete add/edit app flow.
- Focus ring is visible on all controls over `surface` and `elevated`.
- Main interactive targets are 44x44 or have equivalent clickable area.

## Implementation Order

1. Compare `docs/TODO/pitlane-aurora-palette-reference.png` and `src/index.css`; patch only real token differences.
2. Add or update base UI components: `IconButton`, `StatusPill`, `Panel`, `MetricTile`, `Toolbar`, `ActivityRow`.
3. Refactor `Sidebar` tab model and nav rendering.
4. Introduce `AppShell`, `TopBar`, and `BottomStatusBar`.
5. Add `CommandCenterScreen` using existing hooks and APIs.
6. Repoint app default tab according to the v0 cut.
7. Refactor Apps into administrative layout while preserving add/edit/delete behavior.
8. Evolve Logs with filters and `ActivityRow`.
9. Defer Profiles and Automation according to their future priority unless the v0 cut changes.
10. Update i18n.
11. Update unit tests and snapshots.
12. Run verification.

## Test Plan

Run:

```bash
npm run format:check
npm run build
npm run test
```

Add or update tests for:

- new shell renders without crashing
- sidebar lists the planned tabs and excludes out-of-scope tabs
- active tab changes content
- Command Center summary counts running, idle, crashed, disabled, and ready apps correctly
- per-app start/stop buttons call the expected API methods
- bulk start/stop calls the expected apps and handles partial failure
- icon buttons have accessible names
- empty app state still provides a path to add an app
- log filters show the expected event categories
- existing add/edit/delete app flow still works

Use Playwright visual checks after implementation for:

- desktop layout
- narrower desktop layout
- app modal
- focus states
- no overlapping text
- no blank primary panels

## Acceptance Criteria

- The app shell visually matches the direction of `docs/TODO/ui-redesign-command-center-reference.png` while staying implementable with current data.
- Aurora tokens remain the single source of visual color decisions.
- Command Center, if included in v0, is functional and uses real app/status/log data.
- Apps remains fully functional for add/edit/delete/start/stop.
- No UI control claims a working feature that is not wired.
- All nav labels and new UI strings exist in English and Portuguese.
- Build, format check, and tests pass.

## Explicit Assumptions

- This document is the implementation source of truth until the v0/future cut is finalized.
- Future priority follows the `Future-N` values in the Target Navigation table; lower numbers should be implemented first after v0.
- Current backend commands remain unchanged unless a future implementation step explicitly adds Tauri/Rust support.
- Profiles and Automation controls are future work unless their APIs are added first.
- Window controls in the mockup are not functional requirements unless explicitly added to the v0 cut.
