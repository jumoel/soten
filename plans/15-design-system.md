# Phase 0: Design System

Build the foundation primitives needed by Phases 1-3. Compositions are built in the phases that need them, not here. No feature logic, no state, no worker calls. Pure presentational components with props.

Parent plan: [14-frontend-redesign-overview.md](./14-frontend-redesign-overview.md)

---

## Setup

- Set up Storybook with Vite builder (v8+, CSF3 format) and the project's Tailwind config so stories render with the real design tokens
- Add `npm run storybook` script to `package.json`
- Delete the entire current `src/design/` directory - the old primitives are not carried forward
- New components live in `src/ds/`

---

## Principle

The design system is the only place where HTML elements and Tailwind classes appear. Feature components compose primitives exclusively. Primitives are added on demand as phases need them - this phase builds only what Phases 1-3 require.

---

## Primitives to Build (each with Storybook stories)

### Layout

- `Box` - polymorphic container. Surface, border, padding, rounding presets. The `<div>` replacement.
- `Stack` - flex column or row with gap presets. The primary layout tool.
- `Grid` - CSS grid with responsive column presets.
- `Divider` - hairline `border-edge` separator, horizontal or vertical.
- `Spacer` - flex spacer that pushes siblings apart within a Stack.

### Typography

- `Text` - polymorphic text element. Variants: h1, h2, h3, body, body-dim, meta, label. Infers semantic element from variant.

### Interactive

- `Button` - three tiers (primary, secondary, ghost). Icon support, loading state, icon-only mode.
- `IconButton` - ghost button optimized for icon-only use (consistent hit target, aria-label required).
- `Link` - polymorphic anchor/button. Variants: default, muted, nav. External link handling.

### Form

- `Input` - text input with label, placeholder, optional icon.
- `Textarea` - multiline input. Monospace option for the editor.
- `SearchField` - input specialized for search: leading icon, clear button.
- `Toggle` - on/off switch for settings.

### Feedback

- `Alert` - info/warning/error banner with icon and content.
- `Badge` - small label for status, counts, or tags.
- `Spinner` - loading indicator, inline or block.

### Overlay

- `Dialog` - modal with backdrop, focus trap, escape to close. Replaces `window.confirm()`.

### Data Display

- `Card` - surface with consistent padding, optional header/footer slots, interactive variant with hover state.

### Icons

- `Icon` - SVG icon from lucide-react. Named set, consistent sizing.

---

## Deferred to Later Phases

These are built in the phase that needs them:

- `NoteCard`, `CalendarGrid`, `MarkdownContent`, `TopBar`, `FAB` - Phase 2
- `BacklinkCard` - Phase 3
- `SplitPane` - Phase 3 (horizontal), extended in Phase 4 (vertical)
- `ReferenceCard`, `Overlay` (slide-in panel), `NoteCardCondensed` - Phase 4
- `Skeleton` - added when needed (likely Phase 2 for loading states)
- `Select`, `Checkbox`, `DataTable`, `Popover` - added when a consumer needs them

---

## Storybook Stories

Every primitive gets stories covering:
- All variants and sizes
- States: default, hover, active, disabled, loading
- Light and dark themes
- Accessibility: keyboard navigation, focus states, ARIA attributes

---

## Done When

- Every primitive listed above exists with full Storybook coverage
- `npm run storybook` runs and renders all stories with real design tokens
- Old `src/design/` directory is deleted
- All primitives have proper ARIA attributes (Dialog focus trap, IconButton aria-label, etc.)
- Each subsequent phase adds Storybook stories for any new compositions it creates
