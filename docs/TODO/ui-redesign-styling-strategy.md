# UI Redesign Styling Strategy

Date: 2026-05-01

This document defines how the redesign should reduce Tailwind verbosity without changing the styling stack.

## Decision

Keep Tailwind CSS v4 for V0. Do not migrate to CSS Modules, CSS-in-JS, styled-components, or a different styling system during the redesign.

The readability problem should be solved by moving repeated visual patterns into reusable components and variant helpers.

## Rules

- Screen files should describe product structure, not low-level styling.
- Repeated UI patterns should become components before they become repeated `className` strings.
- Components with variants, sizes, or state-driven styles should use `cva`.
- `cn(...)` is for short conditional composition only.
- Long Tailwind strings are acceptable inside low-level reusable components.
- Long Tailwind strings should not dominate screen-level JSX.
- Small semantic classes in `src/index.css` are allowed only for repeated structural patterns that are awkward as components.
- Do not create a broad parallel CSS framework in `src/index.css`.

## Preferred Pattern

Screen-level JSX should read like this:

```tsx
<Panel>
    <PanelHeader title={title} action={<Toolbar>{actions}</Toolbar>} />
    <AppCommandRow app={app} status={status} />
</Panel>
```

Avoid screen-level JSX that repeats full visual construction:

```tsx
<section className="rounded-lg border border-border bg-surface px-4 py-3 shadow-sm ...">
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 ...">
        ...
    </div>
</section>
```

If the second pattern appears more than once, create or extend a component.

## Component Guidance

Use `cva` for:

- `Button`
- `IconButton`
- `StatusPill`
- `Panel`
- `MetricTile`
- `ActivityRow`
- `AppCommandRow`

Use plain `className` for:

- tiny wrappers with no variants
- one-off flex/grid positioning inside a component
- local spacing where extracting a component would obscure intent

Use semantic CSS classes only when:

- the same structural class set appears in several components
- the class is tied to layout behavior rather than product meaning
- the name is generic and durable, such as `.app-scroll-area`

Do not use semantic CSS classes for:

- one-off page styling
- status colors that already have tokens
- component variants better represented with `cva`
- hiding complex product behavior behind an unclear class name

## Naming

Component names should describe UI responsibility:

- `Panel`
- `Toolbar`
- `MetricTile`
- `StatusPill`
- `ActivityRow`
- `AppCommandRow`

Avoid names that encode styling implementation:

- `PurpleCard`
- `FlexBoxPanel`
- `GradientHeader`
- `BorderedThing`

## Review Checklist

Before merging a UI redesign PR:

- [ ] Screen files remain readable at product level.
- [ ] Repeated Tailwind blocks are componentized.
- [ ] Components with variants use `cva`.
- [ ] `cn(...)` is not hiding large layout strings.
- [ ] New semantic CSS classes are minimal and justified.
- [ ] No new styling dependency was added.
- [ ] No migration away from Tailwind was introduced.
