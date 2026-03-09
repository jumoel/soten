# Design Guidelines

Guidelines for building UI in this project. Follow these precisely when creating or modifying components.

## Stack

- **Tailwind CSS v4** with `@tailwindcss/typography` plugin
- **Class-based dark mode** via `html.dark` (use `dark:` variant)
- Custom colour tokens defined in `src/index.css` under `@theme`

## Principles

1. **Information density over whitespace.** Show more content per viewport. Tight padding, compact line-height, minimal chrome. The user came to read and write — don't bury content under spacing.
2. **Readable despite density.** Density without legibility is clutter. Use clear type hierarchy, sufficient contrast, and consistent rhythm to keep dense layouts scannable.
3. **Accessibility is non-negotiable.** Every interactive element needs a visible focus state, a minimum 4.5:1 contrast ratio for text, and appropriate ARIA attributes. Use semantic HTML elements (`button`, `nav`, `main`, `aside`, `dialog`) — not `div` with `onClick`.
4. **Colour carries meaning, not decoration.** The palette is deliberately constrained. Colour signals state (error, accent/action) — never use it ornamentally.
5. **Motion is functional or absent.** Only animate to communicate state changes (loading, enter/exit). No decorative transitions, no hover animations on text, no parallax. Transitions should be ≤200ms and use `ease-out`.

## Colour Tokens

All colours are defined as CSS custom properties in `src/index.css` and have automatic dark mode overrides. **Never use raw hex values or Tailwind's default palette** (no `gray-500`, `blue-600`, etc.). Use only these tokens:

### Surfaces

| Token               | Class          | Light                     | Dark (OLED)              | Use                                           |
| ------------------- | -------------- | ------------------------- | ------------------------ | --------------------------------------------- |
| `--color-base`      | `bg-base`      | `#f7f6f3` light warm gray | `#000000` true black     | Page background                               |
| `--color-surface`   | `bg-surface`   | `#fdfcfa` near-white      | `#111113` barely visible | Cards, panels, elevated surfaces              |
| `--color-surface-2` | `bg-surface-2` | `#efeeeb` soft gray       | `#1c1c1f` charcoal       | Hover states, secondary surfaces, inset areas |

Dark mode uses true black (`#000`) as the base for OLED — pixels turn fully off, saving battery and producing deep contrast. Elevated surfaces (`surface`, `surface-2`) are only a few stops above black so the hierarchy is subtle but real.

### Borders

| Token            | Class           | Light     | Dark      | Use                                            |
| ---------------- | --------------- | --------- | --------- | ---------------------------------------------- |
| `--color-edge`   | `border-edge`   | `#dddbd6` | `#2a2a2d` | Default borders, dividers, card outlines       |
| `--color-edge-2` | `border-edge-2` | `#cbc9c4` | `#3a3a3d` | Stronger borders — input fields, active states |

### Text

| Token               | Class            | Light              | Dark                 | Use                                                |
| ------------------- | ---------------- | ------------------ | -------------------- | -------------------------------------------------- |
| `--color-paper`     | `text-paper`     | `#2c2a28` espresso | `#e8e4dc` warm white | Primary text — headings, body, labels              |
| `--color-paper-dim` | `text-paper-dim` | `#5c5955` stone    | `#a09c94` warm gray  | Secondary text — descriptions, less prominent body |
| `--color-muted`     | `text-muted`     | `#757068` ash      | `#858178` warm dim   | Tertiary text — timestamps, metadata, placeholders |

All three text stops maintain ≥4.5:1 contrast against `base` and `surface` in both modes. Warm undertones throughout — no cold grays.

### Accent — deep teal

| Token                  | Class                                       | Light                 | Dark                  | Use                                       |
| ---------------------- | ------------------------------------------- | --------------------- | --------------------- | ----------------------------------------- |
| `--color-accent`       | `bg-accent`, `text-accent`, `border-accent` | `#1a7a75` deep teal   | `#3aada7` bright teal | Primary actions, links, active indicators |
| `--color-accent-hover` | `hover:bg-accent-hover`                     | `#15605c` darker teal | `#2e9490` mid teal    | Hover state for accent elements           |

The accent shifts lighter in dark mode so it reads clearly against true black. For **primary buttons**, use `text-white` in light mode and `dark:text-black` in dark mode to maintain contrast against the accent background.

### Error

| Token                   | Class               | Light     | Dark      | Use                              |
| ----------------------- | ------------------- | --------- | --------- | -------------------------------- |
| `--color-error-surface` | `bg-error-surface`  | `#fef5f3` | `#1e0c0a` | Error container background       |
| `--color-error-edge`    | `border-error-edge` | `#f0ccc4` | `#5a2020` | Error container border           |
| `--color-error-text`    | `text-error-text`   | `#b04030` | `#f87171` | Error headings and labels        |
| `--color-error-detail`  | `text-error-detail` | `#d05040` | `#fca5a5` | Error descriptions, stack traces |

## Typography

### Scale

Use a constrained type scale. These are the only sizes you should reach for:

| Size | Class       | Use                                                |
| ---- | ----------- | -------------------------------------------------- |
| 12px | `text-xs`   | Metadata, timestamps, labels, tertiary info        |
| 14px | `text-sm`   | Body text, form inputs, descriptions, most UI text |
| 16px | `text-base` | Emphasized body, subheadings in dense contexts     |
| 18px | `text-lg`   | Section headings                                   |
| 24px | `text-2xl`  | Page titles (use sparingly — one per view)         |

`text-sm` (14px) is the default. Reach for `text-base` or above only when you have a clear hierarchy reason.

### Weight

| Weight | Class           | Use                                                          |
| ------ | --------------- | ------------------------------------------------------------ |
| 400    | `font-normal`   | Body text, descriptions                                      |
| 500    | `font-medium`   | Interactive labels, secondary headings, emphasis within body |
| 600    | `font-semibold` | Primary headings, form labels, buttons                       |

Never use `font-bold` (700) or above — the warm palette reads heavy with bold weights.

### Line height

- Body text: `leading-snug` (1.375) — denser than default while staying readable
- Headings: `leading-tight` (1.25)
- Metadata/labels: `leading-none` (1) or `leading-tight` (1.25)

### Letter spacing

- Uppercase metadata: `tracking-widest` (0.1em) — required to keep uppercase text legible at small sizes
- Headings: `tracking-tight` (-0.025em) — tightens large text for a modern feel
- Body: default tracking

## Spacing

### Padding

Dense by default. These are the standard internal padding values:

| Context       | Padding                              | Example                        |
| ------------- | ------------------------------------ | ------------------------------ |
| Cards, panels | `px-4 py-3`                          | Content cards in lists         |
| Compact cards | `px-3 py-2`                          | Toolbar items, tight list rows |
| Buttons       | `px-3 py-1.5` (sm), `px-4 py-2` (md) | Action buttons                 |
| Page margins  | `px-4` mobile, `px-6` desktop        | Outer page container           |

### Gaps

| Context                        | Gap                |
| ------------------------------ | ------------------ |
| Between items in a list        | `gap-2` or `gap-3` |
| Between sections               | `gap-4` or `gap-6` |
| Inside a card between elements | `gap-1` or `gap-2` |
| Toolbar items                  | `gap-2`            |

When in doubt, use the smaller value. Add space only when elements are visually colliding.

## Components

### Cards / Surfaces

```
bg-surface border border-edge rounded-md
```

- Use `rounded-md` (6px) — not `rounded-lg` or `rounded-xl`. Subtle rounding only.
- For interactive cards, add: `hover:bg-surface-2 transition-colors duration-150 cursor-pointer`
- For visual weight / grouping, a left accent border works well: `border-l-[3px] border-l-edge-2`
- No shadows. Borders provide all the elevation needed.

### Buttons

Three visual tiers:

**Primary** — for the single most important action on screen:

```
bg-accent text-white dark:text-black font-medium rounded-md px-4 py-2
hover:bg-accent-hover
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

**Secondary** — for supporting actions:

```
bg-surface border border-edge text-paper font-medium rounded-md px-3 py-1.5
hover:bg-surface-2
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

**Ghost** — for de-emphasized actions (toolbars, inline actions):

```
text-paper-dim font-medium rounded-md px-2 py-1
hover:bg-surface-2
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

All buttons must have `focus-visible` styles. Never rely on browser defaults.

### Inputs

```
bg-surface border border-edge-2 rounded-md px-3 py-2 text-sm text-paper
placeholder:text-muted
focus:outline-2 focus:outline-accent focus:border-transparent
```

Use `border-edge-2` (not `border-edge`) for inputs — the slightly stronger border provides affordance that this is an interactive field.

### Dividers

```
border-t border-edge
```

Prefer hairline dividers over spacing to separate items in lists. A 1px line is cheaper than 16px of whitespace.

### Metadata / Labels

Uppercase labels for categories, dates, and section headers:

```
text-xs font-semibold uppercase tracking-widest text-muted
```

This creates a clear visual break from body content without adding weight.

## Layout Patterns

### Stacking

Vertical layouts use flex column with tight gaps:

```html
<div class="flex flex-col gap-2">
  <!-- items -->
</div>
```

### Responsive grids

For card grids, use CSS grid with auto-fill:

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
  <!-- cards -->
</div>
```

### Toolbars / action bars

Horizontal bar pinned to top or bottom of a section:

```html
<div class="flex items-center gap-2 px-4 py-2 border-b border-edge">
  <!-- toolbar content -->
</div>
```

### Page containers

Center content with a max width:

```html
<div class="mx-auto max-w-4xl px-4 sm:px-6">
  <!-- page content -->
</div>
```

## Focus & Keyboard

- Use `focus-visible:` (not `focus:`) for outline styles on buttons and links — this avoids outlines on mouse clicks while keeping them for keyboard navigation.
- `focus:` is correct for inputs (always show focus).
- Outline style: `outline-2 outline-offset-2 outline-accent`
- All interactive elements must be reachable via Tab and activatable via Enter/Space.
- Use `tabindex="-1"` to remove non-interactive elements from tab order. Never put `tabindex="0"` on a `div` — use a `button` or `a` instead.

## Dark Mode

- Dark mode is applied via `html.dark` class — the `dark:` variant handles it automatically.
- All colour tokens in `src/index.css` have dark overrides. If you only use token classes (`bg-base`, `text-paper`, `border-edge`, etc.) dark mode works for free. **This is the primary reason to never use raw Tailwind palette colours.**
- Test both modes. If you add a colour that isn't from the token set, it will break in dark mode.

## Anti-Patterns

Do not:

- Use Tailwind's default colour palette (`gray-*`, `blue-*`, `red-*`, etc.) — use the project tokens
- Add `shadow-*` classes — borders handle elevation
- Use `rounded-lg`, `rounded-xl`, `rounded-full` on containers — `rounded-md` is the standard
- Add decorative gradients, glows, or background patterns
- Use `animate-*` for anything other than loading spinners or enter/exit transitions
- Create "pill" buttons with `rounded-full` — use `rounded-md`
- Add `opacity-*` to create disabled states — use `text-muted` for dimmed text and `pointer-events-none cursor-default` for disabled interactivity
- Nest interactive elements (button inside button, link inside link)
- Use `<div onClick>` when `<button>` is appropriate
