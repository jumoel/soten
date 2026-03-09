# Plan 09: Design System Components with Storybook

## Overview

Establish a design system in `src/design/` with eight foundational components and colocated
Storybook stories. All components adhere strictly to `DESIGN.md` — token-only colours, dense
spacing, semantic HTML, `focus-visible` keyboard support, and automatic dark mode.

Storybook is already configured (`@storybook/react-vite` v10) and picks up
`src/**/*.stories.@(ts|tsx)`. CSS tokens are available via `../src/index.css` imported in
`.storybook/preview.ts`.

---

## Directory Structure

```
src/design/
  Box/
    Box.tsx
    Box.stories.tsx
  Stack/
    Stack.tsx
    Stack.stories.tsx
  Grid/
    Grid.tsx
    Grid.stories.tsx
  Text/
    Text.tsx
    Text.stories.tsx
  Button/
    Button.tsx
    Button.stories.tsx
  SearchField/
    SearchField.tsx
    SearchField.stories.tsx
  TopBar/
    TopBar.tsx
    TopBar.stories.tsx
  MarkdownCard/
    MarkdownCard.tsx
    MarkdownCard.stories.tsx
  index.ts
```

---

## Step 1 — Box (`src/design/Box/Box.tsx`)

A polymorphic surface wrapper. Handles background, border, padding, and rounding — the building
block for all elevated surfaces.

### API

```ts
type BoxSurface = "none" | "base" | "surface" | "surface-2";
type BoxBorder = "none" | "edge" | "edge-2";
type BoxPadding = "none" | "compact" | "card" | "page";

type BoxProps<T extends ElementType = "div"> = {
  as?: T;
  surface?: BoxSurface;
  border?: BoxBorder;
  padding?: BoxPadding;
  rounded?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;
```

### Class mappings

| Prop value            | Classes                |
| --------------------- | ---------------------- |
| `surface="base"`      | `bg-base`              |
| `surface="surface"`   | `bg-surface`           |
| `surface="surface-2"` | `bg-surface-2`         |
| `border="edge"`       | `border border-edge`   |
| `border="edge-2"`     | `border border-edge-2` |
| `padding="compact"`   | `px-3 py-2`            |
| `padding="card"`      | `px-4 py-3`            |
| `padding="page"`      | `px-4 sm:px-6`         |
| `rounded={true}`      | `rounded-md`           |

Defaults: `surface="none"`, `border="none"`, `padding="none"`, `rounded={false}`.

### Implementation notes

- Polymorphic via `as` prop — default element is `div`
- `className` prop merges additional classes after the component's own
- No interactive behaviour on Box itself — that belongs to Button or Card

### Stories

| Story               | What it shows                                                 |
| ------------------- | ------------------------------------------------------------- |
| `Surface`           | All three surface values side by side on `bg-base` background |
| `Borders`           | `edge` vs `edge-2`                                            |
| `Padding`           | `compact`, `card`, `page` with visible content                |
| `Rounded`           | Rounded vs flat                                               |
| `AsSemanticElement` | `as="section"` and `as="aside"` to verify polymorphism        |
| `DarkMode`          | Same set on dark background — tokens must auto-invert         |

---

## Step 2 — Stack (`src/design/Stack/Stack.tsx`)

A flex-column container enforcing the project's vertical layout pattern.

### API

```ts
type StackGap = 1 | 2 | 3 | 4 | 6;
type StackAlign = "start" | "center" | "end" | "stretch";
type StackJustify = "start" | "center" | "end" | "between";

type StackProps<T extends ElementType = "div"> = {
  as?: T;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;
```

### Class mappings

Gap classes: `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6` (use Tailwind's static classes — no
dynamic string interpolation).

Align classes: `items-start`, `items-center`, `items-end`, `items-stretch`.

Justify classes: `justify-start`, `justify-center`, `justify-end`, `justify-between`.

Base: `flex flex-col`.

Defaults: `gap={2}`, `align="stretch"`, `justify="start"`.

### Implementation notes

- Use a static class lookup map (not template strings) so Tailwind's static class scanner
  detects all variants at build time:

  ```ts
  const gapClass: Record<StackGap, string> = {
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
  };
  ```

- `as` defaults to `div`; use `as="ul"` for lists, `as="nav"` for navigation, etc.

### Stories

| Story        | What it shows                                |
| ------------ | -------------------------------------------- |
| `DefaultGap` | Three placeholder items with default `gap-2` |
| `AllGaps`    | Gaps 1–6 in a row, labelled                  |
| `Alignment`  | `align` prop variants                        |
| `AsUl`       | `as="ul"` with `<li>` children               |

---

## Step 3 — Grid (`src/design/Grid/Grid.tsx`)

A responsive columnar grid. Collapses to single-column (same behaviour as Stack) at the narrowest
breakpoint (`sm`, <640px). At `md` and above, renders the requested column count.

### API

```ts
type GridCols = 1 | 2 | 3 | 4;
type GridGap = 2 | 3 | 4 | 6;

type GridProps = {
  cols?: GridCols;
  gap?: GridGap;
  className?: string;
  children?: ReactNode;
};
```

### Class mappings

At `sm` (default / narrowest), always `grid-cols-1`.

At `md` breakpoint, switch to the requested column count:

```ts
const mdColsClass: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};
```

Gap:

```ts
const gapClass: Record<GridGap, string> = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
};
```

Base: `grid grid-cols-1`.

Defaults: `cols={2}`, `gap={3}`.

### Implementation notes

- No `as` prop — Grid is always a `div` (CSS grid container). Semantics are on children.
- Children fill cells; no explicit item component needed.

### Stories

| Story            | What it shows                                                                   |
| ---------------- | ------------------------------------------------------------------------------- |
| `TwoColumns`     | Default `cols={2}` with six placeholder cells                                   |
| `ThreeColumns`   | `cols={3}`                                                                      |
| `FourColumns`    | `cols={4}`                                                                      |
| `NarrowViewport` | Use Storybook's viewport addon to show `cols={4}` collapsing to 1 col on mobile |
| `MixedContent`   | Grid with Box children of varying heights (verifies alignment)                  |

---

## Step 4 — Text (`src/design/Text/Text.tsx`)

A polymorphic text element mapping semantic variants to the design system type scale. Defaults the
rendered element to the semantically appropriate HTML tag.

### Variants

| Variant    | Default element | Classes                                                          |
| ---------- | --------------- | ---------------------------------------------------------------- |
| `h1`       | `h1`            | `text-2xl font-semibold leading-tight tracking-tight text-paper` |
| `h2`       | `h2`            | `text-lg font-semibold leading-tight tracking-tight text-paper`  |
| `h3`       | `h3`            | `text-base font-medium leading-tight text-paper`                 |
| `h4`       | `h4`            | `text-sm font-medium leading-tight text-paper`                   |
| `body`     | `p`             | `text-sm font-normal leading-snug text-paper`                    |
| `body-dim` | `p`             | `text-sm font-normal leading-snug text-paper-dim`                |
| `meta`     | `span`          | `text-xs font-semibold uppercase tracking-widest text-muted`     |
| `label`    | `span`          | `text-sm font-medium text-paper`                                 |

### API

```ts
type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "body-dim" | "meta" | "label";

type TextProps<T extends ElementType = "span"> = {
  variant?: TextVariant;
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;
```

Defaults: `variant="body"`, element inferred from variant (override with `as`).

### Implementation notes

- `as` overrides the default element without changing visual classes. Use `as="span"` when
  nesting body text inline, `as="label"` for form labels, etc.
- Use a lookup map for both default elements and class strings — no dynamic interpolation.
- Default variant is `"body"`.

### Stories

| Story             | What it shows                                              |
| ----------------- | ---------------------------------------------------------- |
| `AllVariants`     | All eight variants stacked, labelled with variant name     |
| `OverrideElement` | `variant="body"` with `as="span"` inline inside a sentence |
| `DarkMode`        | All variants on dark background — contrast must hold       |

---

## Step 5 — Button (`src/design/Button/Button.tsx`)

Three visual tiers following DESIGN.md exactly. Supports disabled state, two sizes, icon content,
and full keyboard/focus accessibility.

### API

```ts
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
};
```

### Class mappings

**Primary:**

```
bg-accent text-white dark:text-black font-medium rounded-md
hover:bg-accent-hover
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

Size: `px-4 py-2` (md), `px-3 py-1.5 text-sm` (sm).

**Secondary:**

```
bg-surface border border-edge text-paper font-medium rounded-md
hover:bg-surface-2
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

Size: `px-4 py-2` (md), `px-3 py-1.5 text-sm` (sm).

**Ghost:**

```
text-paper-dim font-medium rounded-md
hover:bg-surface-2
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

Size: `px-2 py-1` (md), `px-2 py-0.5 text-sm` (sm).

**Disabled state** (all variants): `text-muted pointer-events-none cursor-default` — remove
background/border-specific hover classes too. Do NOT use `opacity-*`.

### Implementation notes

- Always renders as `<button>` — no polymorphism needed
- `type` defaults to `"button"` (prevents accidental form submission)
- Icon-only buttons require `aria-label`
- `children` may include SVG icons — use `flex items-center gap-1.5` on the button for icon+label

### Stories

| Story           | What it shows                                                    |
| --------------- | ---------------------------------------------------------------- |
| `AllVariants`   | Primary, Secondary, Ghost at default (md) size                   |
| `Sizes`         | Each variant in sm and md                                        |
| `WithIcon`      | Ghost button with leading SVG icon                               |
| `Disabled`      | All variants in disabled state                                   |
| `KeyboardFocus` | Visual demonstration of `focus-visible` outline (no mouse hover) |
| `DarkMode`      | All on dark background — Primary must use `dark:text-black`      |

---

## Step 6 — SearchField (`src/design/SearchField/SearchField.tsx`)

A controlled search input with a leading magnifying-glass icon, clear button, and proper label
association.

### API

```ts
type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string; // always required — either visible or sr-only
  labelVisible?: boolean; // default false → label is sr-only
  id?: string; // auto-generated if not provided
  className?: string;
};
```

### Anatomy

```
[label (sr-only or visible)]
[🔍  input field                           [✕]]
```

- Outer wrapper: `relative flex flex-col gap-1`
- Label: `text-sm font-medium text-paper` when visible; `sr-only` when not
- Input: `bg-surface border border-edge-2 rounded-md pl-8 pr-8 py-2 text-sm text-paper
placeholder:text-muted focus:outline-2 focus:outline-accent focus:border-transparent w-full`
- Search icon: absolutely-positioned inside the input on the left (`left-2.5`), `text-muted`,
  `pointer-events-none`, `aria-hidden="true"`
- Clear button: absolutely-positioned on the right (`right-1.5`), renders only when
  `value.length > 0`, Ghost variant sizing (`p-1`), `aria-label="Clear search"`

### Implementation notes

- `id` prop defaults to a stable `useId()` value for label/input association
- Clear button calls `onChange("")` — caller owns the state
- The search icon is a simple inline SVG (no external icon library dependency)
- `type="search"` on the `<input>` for browser search-input affordances (clearing on Escape)

### Stories

| Story          | What it shows                                           |
| -------------- | ------------------------------------------------------- |
| `Empty`        | Default empty state                                     |
| `WithValue`    | Controlled with a pre-filled value — shows clear button |
| `VisibleLabel` | `labelVisible={true}`                                   |
| `FullWidth`    | Inside a container with `w-full`                        |
| `DarkMode`     | Input on dark background                                |

---

## Step 7 — TopBar (`src/design/TopBar/TopBar.tsx`)

A horizontal bar for page-level navigation and primary actions. Three named slots: left, center,
right.

### API

```ts
type TopBarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  sticky?: boolean; // default false
  as?: "header" | "nav" | "div";
  className?: string;
};
```

### Layout

```
[left slot]         [center slot]         [right slot]
```

- Outer element: semantic (`header` default, override with `as`)
- Base classes: `flex items-center gap-2 px-4 py-2 border-b border-edge bg-surface`
- Sticky: add `sticky top-0 z-10`
- Left slot: `flex items-center gap-2` — grows to fill remaining space (`flex-1`)
- Center slot: `flex items-center justify-center gap-2` — shrinks to content, centered absolutely
  or via flex
- Right slot: `flex items-center gap-2 justify-end` — grows to fill remaining space (`flex-1`)

Implementation for three-slot layout with true centering: use CSS grid with three columns
(`grid-cols-[1fr_auto_1fr]`) rather than flexbox, so the center slot is always visually centered
regardless of left/right slot widths:

```
grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2 border-b border-edge bg-surface
```

- Left slot: `flex items-center gap-2`
- Center slot: `flex items-center justify-center gap-2`
- Right slot: `flex items-center gap-2 justify-end`

### Implementation notes

- When a slot is empty, it still renders its div to preserve the grid structure
- `sticky` + `z-10` covers the content scrolling underneath (no shadow — borders only)
- Defaults: `as="header"`, `sticky={false}`

### Stories

| Story          | What it shows                                           |
| -------------- | ------------------------------------------------------- |
| `WithAllSlots` | App title left, search center, action buttons right     |
| `LeftOnly`     | Just a logo/title — center and right empty              |
| `RightOnly`    | Just action buttons                                     |
| `Sticky`       | In a tall scrollable container to show sticky behaviour |
| `DarkMode`     | On dark background                                      |

---

## Step 8 — MarkdownCard (`src/design/MarkdownCard/MarkdownCard.tsx`)

An expanding card that renders pre-rendered markdown HTML. The visual rendering of markdown
content is **identical** in both collapsed and expanded states — only the container changes
height. This is the critical constraint.

### Design constraint — identical rendering

Both states use the same prose wrapper:

```html
<div class="prose prose-sm dark:prose-invert">
  <!-- dangerouslySetInnerHTML -->
</div>
```

The **container** around this div differs:

- **Collapsed**: `max-h-32 overflow-hidden` — clips content at a fixed height
- **Expanded**: `max-h-[60vh] overflow-y-auto` — allows scroll for very long content

`max-h-32` (8rem = 128px) covers approximately 6–7 lines of body text at 14px / 1.375 line-height.
This approach works correctly with block-level markdown elements (`<p>`, `<h1>`, `<ul>`, etc.),
unlike `line-clamp` which targets inline text nodes.

Do NOT apply any heading-override classes (`[&_h1]:!text-sm`) — these would change the visual
rendering between states.

### API

```ts
type MarkdownCardProps = {
  html: string;
  collapsed?: boolean; // controlled; default true
  onToggle?: () => void; // called when card is clicked
  maxCollapsedHeight?: string; // default "8rem" (max-h-32)
  maxExpandedHeight?: string; // default "60vh"
  className?: string;
};
```

### Anatomy

```
┌─ Card (button role when onToggle provided) ─────────────────────┐
│ [prose content container — height-clipped or scrollable]        │
│                                                                  │
│ [expand/collapse indicator — subtle, bottom of card]            │
└──────────────────────────────────────────────────────────────────┘
```

### Expand/collapse indicator

When `onToggle` is provided:

- Collapsed: a hairline fade-out gradient at the bottom of the content container
  (`bg-gradient-to-t from-surface to-transparent h-6 -mt-6 relative`) plus a
  chevron-down icon below the card border — `text-muted text-xs flex items-center
justify-center gap-1 py-1`
- Expanded: chevron-up, no gradient

The gradient creates a natural fade rather than an abrupt clip, signalling that content
continues below.

### Card shell

The outer wrapper is a `<div>` with card classes (`bg-surface border border-edge rounded-md
px-4 py-3`). When `onToggle` is provided, the entire card is wrapped in a `<button>` with
`w-full text-left` — following DESIGN.md's rule to use `button` not `div onClick`. The button
gets `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`.

### Gradient implementation

```tsx
{
  collapsed && (
    <div
      className="h-6 -mt-6 relative pointer-events-none"
      style={{ background: "linear-gradient(to top, var(--color-surface), transparent)" }}
      aria-hidden="true"
    />
  );
}
```

Using CSS custom properties directly in `style` preserves dark mode correctness (tokens shift
automatically). Do not use Tailwind's `from-surface` gradient utility as it may not be available.

### Implementation notes

- `html` prop is trusted content from the app's own markdown pipeline — `dangerouslySetInnerHTML`
  is acceptable here (same pattern used elsewhere in the codebase)
- If `onToggle` is not provided, the card is non-interactive (no button wrapper, no indicator)
- `collapsed` defaults to `true`

### Stories

| Story           | What it shows                                                       |
| --------------- | ------------------------------------------------------------------- |
| `ShortContent`  | Content shorter than collapsed height — no indicator shown          |
| `LongCollapsed` | Long markdown with collapse clipping and gradient                   |
| `LongExpanded`  | Same content in expanded state — prose rendering visually identical |
| `Uncontrolled`  | Local `useState` toggle to demonstrate expand/collapse interaction  |
| `NoToggle`      | Display-only card (no `onToggle`)                                   |
| `DarkMode`      | Collapsed and expanded on dark background                           |

For stories that need HTML content, define a local `sampleHtml` constant with pre-rendered
markdown HTML (a mix of headings, paragraphs, and a list) — no markdown rendering dependency
needed in stories.

---

## Step 9 — Barrel export (`src/design/index.ts`)

Export all components from a single entry point:

```ts
export { Box } from "./Box/Box";
export type { BoxProps } from "./Box/Box";

export { Stack } from "./Stack/Stack";
export type { StackProps } from "./Stack/Stack";

export { Grid } from "./Grid/Grid";
export type { GridProps } from "./Grid/Grid";

export { Text } from "./Text/Text";
export type { TextProps } from "./Text/Text";

export { Button } from "./Button/Button";
export type { ButtonProps } from "./Button/Button";

export { SearchField } from "./SearchField/SearchField";
export type { SearchFieldProps } from "./SearchField/SearchField";

export { TopBar } from "./TopBar/TopBar";
export type { TopBarProps } from "./TopBar/TopBar";

export { MarkdownCard } from "./MarkdownCard/MarkdownCard";
export type { MarkdownCardProps } from "./MarkdownCard/MarkdownCard";
```

---

## Step 10 — Storybook story conventions

All stories follow these conventions:

### File header

```ts
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComponentName } from "./ComponentName";

const meta: Meta<typeof ComponentName> = {
  title: "Design/ComponentName",
  component: ComponentName,
};
export default meta;

type Story = StoryObj<typeof ComponentName>;
```

### Story title hierarchy

All components appear under `Design/` in the Storybook sidebar:

- `Design/Box`
- `Design/Stack`
- `Design/Grid`
- `Design/Text`
- `Design/Button`
- `Design/SearchField`
- `Design/TopBar`
- `Design/MarkdownCard`

### Dark mode stories

Dark mode stories apply `html.dark` via a decorator:

```ts
export const DarkMode: Story = {
  decorators: [
    (Story) => {
      document.documentElement.classList.add("dark");
      return <Story />;
    },
  ],
  // Remove dark class after story unmounts via a cleanup story
};
```

Alternatively, use Storybook's `backgrounds` parameter set to the dark value and manually add
the `dark` class — whichever approach is less invasive given the class-based dark mode setup.

### No external dependencies in stories

Stories must not import from `src/atoms/`, `src/lib/`, or `jotai`. Stories are pure presentational
demonstrations. For `MarkdownCard`, provide a hardcoded `sampleHtml` string.

---

## Step 11 — Quality checks

After all components are written:

```sh
npm run types
npm run lint
npm run style
npm run build
npm run build-storybook
```

Common issues to catch:

- Polymorphic `as` prop requiring correct generic constraint — TypeScript will flag mismatches
- Static class maps missing variants — Tailwind will purge un-referenced dynamic strings
- `aria-label` missing on icon-only buttons — ESLint jsx-a11y rule
- `dangerouslySetInnerHTML` used outside of `MarkdownCard` — grep to verify scope

---

## Summary

| Component    | File                                       | Storybook title       |
| ------------ | ------------------------------------------ | --------------------- |
| Box          | `src/design/Box/Box.tsx`                   | `Design/Box`          |
| Stack        | `src/design/Stack/Stack.tsx`               | `Design/Stack`        |
| Grid         | `src/design/Grid/Grid.tsx`                 | `Design/Grid`         |
| Text         | `src/design/Text/Text.tsx`                 | `Design/Text`         |
| Button       | `src/design/Button/Button.tsx`             | `Design/Button`       |
| SearchField  | `src/design/SearchField/SearchField.tsx`   | `Design/SearchField`  |
| TopBar       | `src/design/TopBar/TopBar.tsx`             | `Design/TopBar`       |
| MarkdownCard | `src/design/MarkdownCard/MarkdownCard.tsx` | `Design/MarkdownCard` |
| Barrel       | `src/design/index.ts`                      | —                     |

## What is NOT in scope

- Replacing existing components in `src/components/` — these new components stand alone
- Wiring `MarkdownCard` into the note list — integration is a separate plan
- Icon library — inline SVG only for the components that need icons (SearchField, MarkdownCard
  expand indicator)
- Animation/transitions on the MarkdownCard expand — height changes are instantaneous per
  DESIGN.md (motion is functional or absent; a height transition would be decorative here)
- Storybook dark mode toggle addon — manual class application in stories is sufficient
