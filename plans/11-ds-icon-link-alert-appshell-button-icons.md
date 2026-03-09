# Plan 11: Icon, Link, Alert, AppShell, and Button Icon Support

## Overview

Add five components/enhancements to the `src/design/` design system. All follow the existing
conventions: `ComponentName/ComponentName.tsx` + `ComponentName.stories.tsx`, barrel-exported from
`src/design/index.ts`, Storybook stories under `Design/`, token-only colours, semantic HTML.

No icon library — inline SVGs for zero bundle overhead and full control.

---

## Implementation Order

1. **Icon** — no deps, needed by Alert, Button, and Link
2. **Link** — needs Icon (external link indicator)
3. **Alert** — needs Icon + new CSS tokens
4. **Button enhancement** — needs Icon
5. **AppShell** — independent, can be done in parallel with 3/4

---

## Step 1 — Icon (`src/design/Icon/Icon.tsx`)

A single component that renders named inline SVG icons at consistent sizes.

### API

```ts
type IconName =
  | "github"
  | "edit"
  | "save"
  | "trash"
  | "close"
  | "plus"
  | "check"
  | "spinner"
  | "external-link"
  | "chevron-left"
  | "chevron-down"
  | "chevron-up"
  | "search"
  | "info"
  | "warning"
  | "error";

type IconSize = "4" | "5" | "6";

type IconProps = {
  name: IconName;
  size?: IconSize; // default "5" → h-5 w-5
  spin?: boolean; // for spinner — adds animate-spin
  className?: string;
  "aria-hidden"?: boolean; // default true
};
```

### Implementation notes

- All icons use `viewBox="0 0 24 24"`, `stroke="currentColor"`, `fill="none"`,
  `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"` (line icon style)
- Exception: `github` uses a fill path
- Size via static class map: `{ "4": "h-4 w-4", "5": "h-5 w-5", "6": "h-6 w-6" }`
- `spin` adds `animate-spin` with `style={{ animationDuration: "0.8s" }}` (matches existing
  `ds/Icon.tsx` pattern)
- `aria-hidden="true"` by default — icons are decorative; when used alone the parent must
  provide `aria-label`
- Icon SVGs are stored in a `Record<IconName, JSX.Element>` map inside the file
- Wrapper is `<span>` with `inline-flex items-center justify-center` + size class

### Icon set

| Name            | Description                   | SVG source style         |
| --------------- | ----------------------------- | ------------------------ |
| `github`        | GitHub logo                   | Filled path              |
| `edit`          | Pencil / edit                 | Stroke                   |
| `save`          | Floppy disk or download arrow | Stroke                   |
| `trash`         | Trash can                     | Stroke                   |
| `close`         | X mark                        | Stroke                   |
| `plus`          | Plus sign                     | Stroke                   |
| `check`         | Checkmark                     | Stroke                   |
| `spinner`       | Circular arc (partial circle) | Stroke, used with `spin` |
| `external-link` | Arrow pointing out of box     | Stroke                   |
| `chevron-left`  | Left chevron                  | Stroke                   |
| `chevron-down`  | Down chevron                  | Stroke                   |
| `chevron-up`    | Up chevron                    | Stroke                   |
| `search`        | Magnifying glass              | Stroke                   |
| `info`          | Circle with "i"               | Stroke                   |
| `warning`       | Triangle with "!"             | Stroke                   |
| `error`         | Circle with "x"               | Stroke                   |

### Stories

| Story      | What it shows                            |
| ---------- | ---------------------------------------- |
| `AllIcons` | Grid of all icons with their names below |
| `Sizes`    | Same icon at size 4, 5, 6                |
| `Spinner`  | Spinner icon with `spin={true}`          |
| `DarkMode` | All icons on dark background             |

---

## Step 2 — Link (`src/design/Link/Link.tsx`)

A unified link component for both internal (TanStack Router) and external navigation.

### API

```ts
type LinkVariant = "default" | "muted" | "nav";

type LinkProps = {
  href: string;
  variant?: LinkVariant; // default "default"
  external?: boolean; // auto-detected if not set
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};
```

### Auto-detection

If `external` is not explicitly set, detect from `href`:

- Starts with `http://` or `https://` → external
- Everything else → internal

### Variant classes

All variants share: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`

| Variant   | Classes                                               |
| --------- | ----------------------------------------------------- |
| `default` | `text-accent hover:underline`                         |
| `muted`   | `text-paper-dim hover:underline`                      |
| `nav`     | `text-paper font-medium no-underline hover:underline` |

### Rendering

- **Internal:** `<Link to={href}>` from `@tanstack/react-router`
- **External:** `<a href={href} target="_blank" rel="noopener noreferrer">` with an
  `<Icon name="external-link" size="4" />` appended after children (inline, `ml-0.5`)

### Implementation notes

- The external icon is always shown for external links — it communicates "this leaves the app"
- `onClick` is passed through to both internal and external elements
- No `ref` forwarding needed initially

### Stories

| Story           | What it shows                                                                      |
| --------------- | ---------------------------------------------------------------------------------- |
| `Internal`      | Internal link with each variant                                                    |
| `External`      | External link showing the trailing icon                                            |
| `AutoDetection` | Side by side: `href="/notes"` (internal) vs `href="https://github.com"` (external) |
| `DarkMode`      | All variants on dark background                                                    |

---

## Step 3 — Alert (`src/design/Alert/Alert.tsx`)

Info, warning, and error alert boxes with leading icons.

### New colour tokens

Add to `src/index.css` under `@theme` and `html.dark`:

**Info** (teal-tinted, derived from accent):

| Token                  | Light                      | Dark                       |
| ---------------------- | -------------------------- | -------------------------- |
| `--color-info-surface` | `#f0faf9`                  | `#0a1514`                  |
| `--color-info-edge`    | `#b0d8d5`                  | `#1a4a47`                  |
| `--color-info-text`    | `#1a7a75` (same as accent) | `#3aada7` (same as accent) |

**Warning** (warm amber):

| Token                     | Light     | Dark      |
| ------------------------- | --------- | --------- |
| `--color-warning-surface` | `#fefce8` | `#1a1400` |
| `--color-warning-edge`    | `#e5d5a0` | `#5a4a10` |
| `--color-warning-text`    | `#92700c` | `#fbbf24` |

**Error** tokens already exist (`error-surface`, `error-edge`, `error-text`).

### API

```ts
type AlertVariant = "info" | "warning" | "error";

type AlertProps = {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};
```

### Layout

```
┌─ icon ─ [title] ───────────────────┐
│         body text (children)        │
└─────────────────────────────────────┘
```

- Container: `rounded-md border px-4 py-3` + variant surface/edge classes
- Icon: variant-specific (`info` → `info`, `warning` → `warning`, `error` → `error`),
  `size="5"`, variant text colour, `shrink-0 mt-0.5`
- Title: `font-medium` in variant text colour
- Body: `text-sm` in `text-paper` (not the variant colour — body text stays readable)
- Layout: outer `flex gap-3`, right side is `flex flex-col gap-1`
- If no `title`, icon and children sit in a single `flex items-start gap-3` row

### Variant class map

| Variant   | Surface              | Border                | Icon/title text     |
| --------- | -------------------- | --------------------- | ------------------- |
| `info`    | `bg-info-surface`    | `border-info-edge`    | `text-info-text`    |
| `warning` | `bg-warning-surface` | `border-warning-edge` | `text-warning-text` |
| `error`   | `bg-error-surface`   | `border-error-edge`   | `text-error-text`   |

### Implementation notes

- Uses `role="alert"` for error variant, `role="status"` for info/warning
- Icon name matches variant name (`"info"`, `"warning"`, `"error"`)
- No dismiss button (alerts are informational, not toast notifications)

### Stories

| Story          | What it shows                   |
| -------------- | ------------------------------- |
| `AllVariants`  | Info, warning, error stacked    |
| `WithTitle`    | Each variant with a title       |
| `WithoutTitle` | Each variant with body only     |
| `LongContent`  | Multi-line body text            |
| `DarkMode`     | All variants on dark background |

---

## Step 4 — Button Enhancement (`src/design/Button/Button.tsx`)

Add icon support to the existing Button component.

### New props

```ts
// Add to existing ButtonProps:
icon?: IconName;          // leading icon
iconRight?: IconName;     // trailing icon (e.g. external-link)
iconOnly?: boolean;       // icon-only mode — square padding, requires aria-label
loading?: boolean;        // replaces icon with spinner, disables button
```

### Behaviour

- `icon` renders `<Icon name={icon} size="4" />` before `children`
- `iconRight` renders `<Icon name={iconRight} size="4" />` after `children`
- `iconOnly` changes padding to square: `p-1.5` (md), `p-1` (sm); requires `aria-label`
- `loading` sets `disabled=true` and replaces the leading icon with
  `<Icon name="spinner" size="4" spin />`; if no `icon` was set, spinner is still prepended
- The existing `flex items-center gap-1.5` in `baseClasses` handles alignment

### Size classes update

Add `iconOnly` entries to the size class map:

```ts
const sizeClasses: Record<
  ButtonVariant,
  Record<ButtonSize, Record<"normal" | "iconOnly", string>>
> = {
  primary: {
    md: { normal: "px-3 py-1.5", iconOnly: "p-1.5" },
    sm: { normal: "px-2 py-1 text-sm", iconOnly: "p-1 text-sm" },
  },
  // ... same pattern for secondary and ghost
};
```

### Implementation notes

- `IconName` type is imported from Icon component
- When `loading` is true and `iconOnly` is true, only the spinner shows
- `children` is still rendered when `loading` is true (unless `iconOnly`) — the spinner
  replaces the icon, not the label
- No changes to existing variant or disabled styling

### Stories (additions)

| Story              | What it shows                                                      |
| ------------------ | ------------------------------------------------------------------ |
| `WithLeadingIcon`  | Each variant with a leading icon                                   |
| `WithTrailingIcon` | Secondary button with trailing external-link icon                  |
| `IconOnly`         | Ghost icon-only buttons (edit, trash, close) in a toolbar-like row |
| `Loading`          | Primary and secondary in loading state                             |
| `LoadingIconOnly`  | Icon-only button in loading state                                  |

---

## Step 5 — AppShell (`src/design/AppShell/AppShell.tsx`)

A full-viewport layout shell with slots for topbar, sidebar, main content, and footer.

### API

```ts
type AppShellProps = {
  topBar?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode; // main content
  className?: string;
};
```

### Layout

```
┌─── topBar ──────────────────────────┐
├──────────┬──────────────────────────┤
│ sidebar  │    main content          │
│ (opt)    │    (flex-1, scrollable)  │
│          │                          │
├──────────┴──────────────────────────┤
│ footer (optional)                   │
└─────────────────────────────────────┘
```

### Implementation

```tsx
export function AppShell({ topBar, sidebar, footer, children, className }: AppShellProps) {
  return (
    <div
      className={["w-screen h-screen flex flex-col bg-base antialiased", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {topBar}
      <div className="flex flex-1 min-h-0">
        {sidebar && (
          <aside className="w-64 shrink-0 border-r border-edge bg-surface overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      {footer}
    </div>
  );
}
```

### Implementation notes

- `min-h-0` on the flex row prevents content from overflowing the viewport
- Sidebar width `w-64` (256px) is fixed — no resize handle (out of scope)
- `<main>` is the scrollable content area; `<aside>` scrolls independently
- `topBar` and `footer` do not scroll — they sit outside the flex row
- Semantic: `<main>` for content, `<aside>` for sidebar
- If no `sidebar`, the main area fills the full width
- If no `topBar` or `footer`, those slots are simply not rendered

### Stories

| Story              | What it shows                                 |
| ------------------ | --------------------------------------------- |
| `Basic`            | TopBar + main content only                    |
| `WithSidebar`      | TopBar + sidebar + main content               |
| `WithFooter`       | TopBar + main content + footer                |
| `FullLayout`       | All slots populated                           |
| `ScrollingContent` | Long main content to verify only main scrolls |
| `DarkMode`         | Full layout on dark background                |

---

## Step 6 — Barrel export update (`src/design/index.ts`)

Add new exports:

```ts
export { Icon } from "./Icon/Icon";
export type { IconProps, IconName } from "./Icon/Icon";

export { Link } from "./Link/Link";
export type { LinkProps } from "./Link/Link";

export { Alert } from "./Alert/Alert";
export type { AlertProps } from "./Alert/Alert";

export { AppShell } from "./AppShell/AppShell";
export type { AppShellProps } from "./AppShell/AppShell";
```

Button is already exported — no change needed for the enhancement.

---

## Step 7 — CSS token additions (`src/index.css`)

Add under `@theme`:

```css
/* Info */
--color-info-surface: #f0faf9;
--color-info-edge: #b0d8d5;
--color-info-text: #1a7a75;

/* Warning */
--color-warning-surface: #fefce8;
--color-warning-edge: #e5d5a0;
--color-warning-text: #92700c;
```

Add under `html.dark`:

```css
--color-info-surface: #0a1514;
--color-info-edge: #1a4a47;
--color-info-text: #3aada7;

--color-warning-surface: #1a1400;
--color-warning-edge: #5a4a10;
--color-warning-text: #fbbf24;
```

---

## Step 8 — Quality checks

After all components are written:

```sh
npm run types
npm run lint
npm run style
npm run build
npm run build-storybook
```

---

## What is NOT in scope

- Replacing existing `src/components/ds/` components — the old DS remains as-is
- Wiring new components into app pages — integration is separate work
- Responsive sidebar (collapsible/drawer on mobile) — future enhancement
- Toast/snackbar notifications — Alert is for inline, persistent messages
- Icon library dependency — inline SVGs only
