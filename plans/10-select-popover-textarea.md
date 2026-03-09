# Plan 10: Select, Popover, and Textarea Components

## Overview

Add three new components to the design system in `src/design/`:

1. **Select** — a styled native `<select>` dropdown, replacing raw `<select>` elements
2. **Popover** — a generic popover panel anchored to a trigger button, extracting the pattern from `GearPopover`
3. **Textarea** — a styled textarea for markdown editing, replacing the raw `<textarea>` in `EditorPane`

All components follow the same conventions as existing design system components: token-only colours,
semantic HTML, `focus-visible`/`focus` keyboard support, static class maps, automatic dark mode,
and colocated Storybook stories.

---

## Directory Structure

```
src/design/
  Select/
    Select.tsx
    Select.stories.tsx
  Popover/
    Popover.tsx
    Popover.stories.tsx
  Textarea/
    Textarea.tsx
    Textarea.stories.tsx
  index.ts          ← update barrel exports
```

---

## Step 1 — Select (`src/design/Select/Select.tsx`)

A controlled native `<select>` wrapper with consistent styling. Uses the native `<select>` element
for maximum accessibility and mobile friendliness — no custom dropdown rendering needed.

### API

```ts
type SelectSize = "sm" | "md";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  size?: SelectSize;
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
};
```

### Class mappings

**Base input classes:**
```
bg-surface border border-edge-2 rounded-md text-paper
focus:outline-2 focus:outline-accent focus:border-transparent
appearance-none cursor-pointer
```

Use `appearance-none` to remove native browser styling, then add a custom chevron indicator via a
trailing SVG positioned absolutely (same pattern as SearchField's icons).

**Size classes:**

| Size | Classes |
|---|---|
| `sm` | `pl-2 pr-7 py-1 text-xs` |
| `md` | `pl-3 pr-8 py-2 text-sm` |

Use static lookup maps — no template strings.

**Disabled state:** `text-muted pointer-events-none cursor-default` (no `opacity-*`).

**Label:** same pattern as SearchField — `label` is always required, `labelVisible` defaults to
`false` (sr-only). Use `useId()` for stable id association.

### Chevron icon

A small inline SVG chevron-down, absolutely positioned on the right side of the select:
- Position: `absolute right-2 top-1/2 -translate-y-1/2`
- Appearance: `text-muted pointer-events-none` `aria-hidden="true"`
- Size: 10×10 for `sm`, 12×12 for `md`

### Implementation notes

- Always renders as `<select>` — no polymorphism
- `value` and `onChange` make it fully controlled
- `onChange` extracts `e.target.value` internally, exposes `(value: string) => void`
- Options are rendered as `<option>` children from the `options` array
- Default: `size="md"`, `labelVisible={false}`
- Wrap in a `<div>` with `relative` for chevron positioning (same wrapper pattern as SearchField)

### Stories

| Story | What it shows |
|---|---|
| `Default` | Select with 3 options, md size |
| `Small` | `size="sm"` variant |
| `WithVisibleLabel` | `labelVisible={true}` |
| `Disabled` | Disabled state |
| `ManyOptions` | 10+ options to verify scroll behaviour |
| `DarkMode` | On dark background |

---

## Step 2 — Popover (`src/design/Popover/Popover.tsx`)

A generic popover panel that appears anchored to a trigger element. Extracts the open/close logic
currently hand-rolled in `GearPopover` into a reusable component.

### API

```ts
type PopoverAlign = "start" | "end";
type PopoverSide = "bottom" | "top";

export type PopoverProps = {
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: PopoverAlign;
  side?: PopoverSide;
  className?: string;
  children?: ReactNode;
};
```

### Anatomy

```
┌─ Wrapper (relative) ──────────────────────────┐
│ [trigger element]                               │
│                                                  │
│ ┌─ Panel (absolute, anchored) ──────────────┐  │
│ │ [children content]                         │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Panel classes

```
absolute z-30 min-w-48 border border-edge rounded-md bg-surface
```

**Alignment classes (static map):**

| Align | Classes |
|---|---|
| `start` | `left-0` |
| `end` | `right-0` |

**Side classes (static map):**

| Side | Classes |
|---|---|
| `bottom` | `top-full mt-1` |
| `top` | `bottom-full mb-1` |

### Behaviour

- **Click outside to close:** `mousedown` listener on `document` that checks if the event target
  is outside the wrapper ref, then calls `onOpenChange(false)`. Identical to GearPopover's
  existing pattern.
- **Escape to close:** `keydown` listener on `document` for `Escape` key, calls
  `onOpenChange(false)`. Only active when `open` is `true`.
- Both listeners are added in `useEffect` and cleaned up on unmount or when `open` changes to
  `false`.

### Implementation notes

- **Controlled only** — `open` and `onOpenChange` are required. The caller owns the state. This
  avoids internal state duplication and keeps the component predictable.
- The `trigger` is rendered directly inside the wrapper div — it is the caller's responsibility to
  provide an interactive element (typically a `Button`). Popover does not wrap it in another button.
- The panel renders conditionally (`open && <div>...`) — no hidden DOM.
- No focus trapping — the panel content is part of the natural tab order. Focus trapping would be
  appropriate for a modal dialog but is overkill for a simple popover menu.
- No portal rendering — the panel is positioned relative to the wrapper via CSS `absolute`. This
  is sufficient for the app's current layouts and avoids the complexity of portals.
- Defaults: `align="end"`, `side="bottom"`.

### Stories

| Story | What it shows |
|---|---|
| `Default` | Button trigger with a simple list panel, bottom-end aligned |
| `AlignStart` | `align="start"` |
| `SideTop` | `side="top"` — panel appears above trigger |
| `WithActions` | Panel containing Button components — verifies click-through works |
| `ControlledToggle` | Interactive toggle with local `useState` |
| `DarkMode` | On dark background |

---

## Step 3 — Textarea (`src/design/Textarea/Textarea.tsx`)

A styled textarea for multi-line text input. Designed primarily for markdown content editing but
generic enough for any multi-line input.

### API

```ts
type TextareaSize = "sm" | "md";

export type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
  rows?: number;
  size?: TextareaSize;
  mono?: boolean;
  className?: string;
};
```

### Class mappings

**Base classes:**
```
w-full rounded-md border border-edge-2 bg-surface text-paper resize-none
placeholder:text-muted
focus:outline-2 focus:outline-accent focus:border-transparent
```

Use `resize-none` by default — markdown editors typically manage their own sizing. The textarea
fills its container width.

**Size classes:**

| Size | Classes |
|---|---|
| `sm` | `px-3 py-2 text-xs` |
| `md` | `px-4 py-3 text-sm` |

**Mono:** When `mono={true}`, add `font-mono`. This is the expected mode for markdown editing.

**Disabled state:** `text-muted pointer-events-none cursor-default` (same as other components).

**Label:** same sr-only/visible pattern as SearchField and Select. `useId()` for stable id.

### Implementation notes

- Always renders as `<textarea>` — no polymorphism
- `onChange` extracts `e.target.value` internally, exposes `(value: string) => void`
- `rows` defaults to `8` — enough for a meaningful editing area
- Default: `size="md"`, `mono={false}`, `labelVisible={false}`
- For full-height editor usage (like EditorPane), the caller sets `className="flex-1"` on the
  textarea and wraps it in a flex column container. The component itself does not assume layout.
- The `rows` prop is passed directly to the `<textarea>` element

### Stories

| Story | What it shows |
|---|---|
| `Default` | Empty textarea, md size, 8 rows |
| `WithContent` | Pre-filled with sample markdown text |
| `Mono` | `mono={true}` — monospace font for code/markdown |
| `Small` | `size="sm"` variant |
| `WithVisibleLabel` | `labelVisible={true}` |
| `Disabled` | Disabled state |
| `FullHeight` | Inside a fixed-height container with `className="flex-1"` |
| `DarkMode` | On dark background |

---

## Step 4 — Barrel export update (`src/design/index.ts`)

Add exports for all three new components:

```ts
export { Select } from "./Select/Select";
export type { SelectProps } from "./Select/Select";

export { Popover } from "./Popover/Popover";
export type { PopoverProps } from "./Popover/Popover";

export { Textarea } from "./Textarea/Textarea";
export type { TextareaProps } from "./Textarea/Textarea";
```

---

## Step 5 — Storybook story conventions

Same conventions as Plan 09:

- Import from `@storybook/react-vite`
- Title prefix: `Design/Select`, `Design/Popover`, `Design/Textarea`
- Dark mode stories via `document.documentElement.classList.add("dark")` decorator
- No imports from `src/atoms/`, `src/lib/`, or `jotai` — pure presentational
- Interactive stories use local `useState` for controlled state

---

## Step 6 — Quality checks

After all components are written:

```sh
npm run types
npm run lint
npm run style
npm run build
npm run build-storybook
```

Common issues to catch:
- `useId()` requires React 18+ import — already available in this project
- `appearance-none` on `<select>` may need vendor prefixes — Tailwind handles this
- `aria-label` missing on icon-only elements — ESLint jsx-a11y rule
- Popover listeners not cleaned up — verify `useEffect` cleanup functions

---

## Summary

| Component | File | Storybook title |
|---|---|---|
| Select | `src/design/Select/Select.tsx` | `Design/Select` |
| Popover | `src/design/Popover/Popover.tsx` | `Design/Popover` |
| Textarea | `src/design/Textarea/Textarea.tsx` | `Design/Textarea` |
| Barrel | `src/design/index.ts` | — |

## What is NOT in scope

- Replacing `GearPopover` with the new `Popover` component — that is integration work for a
  separate plan
- Replacing the raw `<select>` in `ReferencePanel` — integration is separate
- Replacing the raw `<textarea>` in `EditorPane` — integration is separate
- Custom dropdown rendering for Select (no listbox/combobox) — native `<select>` is correct here
- Focus trapping in Popover — not needed for non-modal overlays
- Portal rendering for Popover — absolute positioning is sufficient
- Auto-resize / auto-grow behaviour for Textarea — callers handle sizing via layout
