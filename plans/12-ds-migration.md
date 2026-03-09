# Plan: Migrate from `ds/` to `design/`

Big-bang migration — replace all `components/ds/` usage with `design/` components, delete `ds/`.

## Constraints

- **No `className` prop on `design/` components.** Remove `className` from all design component type definitions. All styling must go through explicit props. If a prop doesn't exist for a needed style, accept the visual difference.
- **Do not modify existing `design/` component behaviour or add props** unless absolutely necessary for the migration to compile. Visual differences are acceptable.
- Use a **prebuilt icon library** (e.g. `lucide-react`) instead of the handrolled SVGs in `design/Icon`.

## Absolutely necessary `design/` changes

### 1. Remove `className` from all `design/` components

Remove the `className` prop from every component's type definition and implementation: Box, Stack, Grid, Text, Button, Link, Icon, Alert, AppShell, TopBar, MarkdownCard, SearchField, Select, Popover, Textarea. No escape hatches.

### 2. `Link` — make `href` optional

Currently `href: string` is required. Router links use `onClick` with no real `href`. Change to `href?: string`, rendering a `<button>` or similar when no href is given. Without this, routing links cannot work.

### 3. `Stack` — add horizontal direction

Currently vertical-only. Add `direction?: "vertical" | "horizontal"` (default `"vertical"`). Without this, every horizontal layout (Inline replacements, icon+text rows, toolbar groups) would require raw HTML with CSS classes, which defeats the purpose. When horizontal: `flex-row` with `items-center`.

### 4. `DataTable` — new component

Does not exist yet. See Phase 2.

### 5. Replace `design/Icon` with icon library

Replace the handrolled SVG `Icon` component with a thin wrapper around `lucide-react`. Update `IconName` to map to library icon names. All consumers (`Button`, `Alert`, `SearchField`, etc.) continue to work through the same `<Icon name="...">` API.

## Phase 1: Design system updates

### 1.1 Install icon library

- `npm install lucide-react`
- Replace `src/design/Icon/Icon.tsx` internals to render Lucide icons
- Map existing `IconName` values to Lucide equivalents (e.g. `"github"` → `Github`, `"edit"` → `Pencil`, `"save"` → `Save`, `"trash"` → `Trash2`, `"spinner"` → `Loader2`, etc.)
- Update `Icon.stories.tsx`

### 1.2 Remove `className` from all components

Strip `className` from every component's props type and JSX. The components' internal styling remains unchanged — only the external escape hatch is removed.

### 1.3 Make `Link.href` optional

- Change prop type to `href?: string`
- When `href` is absent, render as `<button>` with link styling
- Keep all existing variants and behaviour

### 1.4 Add `Stack` direction

- Add `direction?: "vertical" | "horizontal"` (default `"vertical"`)
- Horizontal applies `flex-row items-center`
- Update stories

## Phase 2: Build `DataTable` in `design/`

**Purpose:** Display structured key-value data (primarily YAML frontmatter).

**Markup:** `<dl>` (description list) — semantically correct for key-value pairs.

**Props:**

```ts
type DataTableEntry = {
  label: string;
  value: ReactNode;
};

type DataTableProps = {
  entries: DataTableEntry[];
  layout?: "horizontal" | "vertical";
};
```

No `className` prop.

**Rendering:**

- `layout="horizontal"` (default): CSS grid with two columns (`auto 1fr`). Labels as `<dt>` styled with `Text variant="meta"`. Values as `<dd>`.
- `layout="vertical"`: Label stacked above value.
- Returns `null` if `entries` is empty.

**Storybook stories:**

- Default (3-4 entries: title, date, author, tags)
- Horizontal vs vertical layout
- With ReactNode values (links, formatted dates)
- Empty state
- Single entry
- Long values wrapping

**Consumer usage (`FrontmatterTable.tsx`):**

```tsx
import { DataTable } from "../design";

const entries = Object.entries(data).map(([label, value]) => ({
  label,
  value: typeof value === "string" ? value : JSON.stringify(value),
}));

return <DataTable entries={entries} />;
```

## Phase 3: Migrate app components

All `ds/` imports are replaced with `design/` imports. Where a design component's prop API doesn't cover the exact visual need, the visual difference is accepted — no raw CSS workarounds.

### `src/app.tsx`

- `ds/AppShell` → `design/AppShell` with `topBar` slot prop
- Inner layout containers → `Box` with available props. Flex/overflow behaviour relies on AppShell's own layout structure.

### `src/components/TopBar.tsx`

- `ds/Toolbar` → `design/TopBar` with `left`/`right` slots
- `ds/NavLink` → `design/Link` with `onClick` (no href)
- `ds/Text` → `design/Text`
- Icon+text groups → `Stack direction="horizontal"` or `Button` with `icon` prop

### `src/components/AuthError.tsx`

- `ds/Text` + `ds/Box` → `design/Alert` with `variant="error"`

### `src/components/BackLink.tsx`

- `ds/NavLink` → `design/Link` with `onClick`

### `src/components/EditorPane.tsx`

- `ds/Text` → `design/Text`
- Error text (`text-red-600`) → `design/Alert` with `variant="error"` for the discard confirmation, or `Text` with the closest available variant
- Toolbar row → `design/TopBar` or `Stack direction="horizontal"`
- Raw `<textarea>` → `design/Textarea` with `mono`

### `src/components/FrontmatterTable.tsx`

- `ds/DataTable` → `design/DataTable` (new, Phase 2)

### `src/components/GearPopover.tsx`

- Replace custom popover with `design/Popover`
- `ds/NavLink` → `design/Link` with `onClick`
- `ds/Text` → `design/Text`
- `ds/DividedList` → `Stack` with gap (dividers lost — accepted visual difference)

### `src/components/GitHubAuthButton.tsx`

- `ds/Box` → `design/Box`
- `ds/Inline` → `design/Stack direction="horizontal"` with `justify="center"`
- `ds/Icon` → `design/Icon` with `name="github"`

### `src/components/LoadingSpinner.tsx`

- `ds/Box` + `ds/Inline` → `Stack` with `align="center"`
- `ds/Icon` → `design/Icon` with `name="spinner"` and `spin`

### `src/components/NoteRow.tsx`

- `ds/Card` → `design/Box` with `surface`/`border`/`padding` props (hover/accent lost)
- `ds/Text` → `design/Text`
- Prose preview → `design/MarkdownCard` with `collapsed`

### `src/components/NoteFullContent.tsx`

- `ProseContent` → `design/MarkdownCard`
- Scroll container → `Box` (max-height/overflow lost — accepted)

### `src/components/PinnedNote.tsx`

- `ds/Text` → `design/Text`
- Flex row → `Stack direction="horizontal"`
- Border → `Box` with `border="edge"`

### `src/components/PinnedZone.tsx`

- List reset → `Stack`

### `src/components/ReferencePanel.tsx`

- `ds/Text` → `design/Text`
- Grid → `design/Grid` with `cols={3}`
- Sort `<select>` → `design/Select`
- Sticky header → `TopBar` with `sticky`

### `src/components/RepoSelector.tsx`

- `ds/Card` → `design/Box` with `surface`/`border`/`padding` as button
- `ds/Stack` → `design/Stack`
- `ds/Text` → `design/Text`
- `ds/Box` → `design/Box`
- `ds/ExternalLink` → `design/Link` with `external`

### `src/components/SearchBar.tsx`

- `ds/TextInput` → `design/SearchField`

### `src/components/UnauthenticatedView.tsx`

- `ds/Text` → `design/Text`
- `ds/Box` → `design/Box`
- `ds/Center` → `Box` (centering lost — accepted, or use `Stack` with `align="center"`)

### `src/components/DraftTray.tsx`

- Flex layout → `Stack direction="horizontal"` + `Box` with `surface`/`border`
- Text truncation may be lost (accepted)

### `src/components/ResizeHandle.tsx`

- Keep as plain `<div>` — this is a drag affordance, not a design system concern. Raw HTML element with inline event handlers.

### `src/components/PageContainer.tsx`

- Delete — replaced by `design/AppShell`

## Phase 4: Delete and clean up

### Delete `src/components/ds/` entirely

All 19 files: AlertBox, AppShell, Box, Button, Card, Center, DataTable, DividedList, ExternalLink, Icon, Inline, NavLink, PageContainer, ProseContent, Skeleton, Stack, Text, TextInput, Toolbar

### Delete re-export wrappers

- `src/components/AlertBox.tsx`
- `src/components/Button.tsx`
- `src/components/ProseContent.tsx`
- `src/components/PageContainer.tsx`

## Phase 5: Verify

### Automated checks

- `npm run types`
- `npm run lint`
- `npm run style`
- `npm run build`

### Visual verification (Chrome DevTools)

Compare before/after for each view in both light and dark mode:

1. Unauthenticated view (login page)
2. Repo selector
3. Main reference panel (note list with cards)
4. Expanded note (full content view)
5. Editor pane
6. Gear popover / settings menu
7. Pinned notes zone
8. Draft tray
9. Search bar
10. Loading/spinner states

## Component mapping

| ds/ component   | Replacement           | Notes                                          |
| --------------- | --------------------- | ---------------------------------------------- |
| `AppShell`      | `design/AppShell`     | Slot props: `topBar`, `sidebar`, `footer`      |
| `Box`           | `design/Box`          | `surface`/`border`/`padding` presets only      |
| `Button`        | `design/Button`       | `icon`/`loading` props                         |
| `Card`          | `design/Box`          | `surface`/`border`/`padding` — no hover/accent |
| `Center`        | `design/Stack`        | `align="center"` or accepted loss              |
| `DataTable`     | `design/DataTable`    | New component (Phase 2)                        |
| `DividedList`   | `design/Stack`        | Dividers lost                                  |
| `ExternalLink`  | `design/Link`         | `external` prop                                |
| `Icon`          | `design/Icon`         | Backed by `lucide-react`                       |
| `Inline`        | `design/Stack`        | `direction="horizontal"`                       |
| `NavLink`       | `design/Link`         | `onClick` + optional `href`                    |
| `PageContainer` | `design/AppShell`     | Layout wrapper                                 |
| `ProseContent`  | `design/MarkdownCard` | `html` prop                                    |
| `Skeleton`      | _(delete)_            | Unused                                         |
| `Stack`         | `design/Stack`        | `gap` is number union                          |
| `Text`          | `design/Text`         | Mono/error variants not available              |
| `TextInput`     | `design/SearchField`  | Label required                                 |
| `Toolbar`       | `design/TopBar`       | 3-column grid                                  |

## Execution order

1. Remove `className` from all `design/` components (Phase 1.2)
2. Install `lucide-react`, replace `design/Icon` (Phase 1.1)
3. Make `Link.href` optional (Phase 1.3)
4. Add `Stack` direction (Phase 1.4)
5. Build `DataTable` in `design/` (Phase 2)
6. Migrate all app components (Phase 3)
7. Delete `ds/` and wrappers (Phase 4)
8. Run quality checks + visual verification (Phase 5)
9. Single commit

## Known visual discrepancies after migration

The following visual differences are expected and accepted. They stem from the design components' prop API not covering every styling need, and the deliberate absence of a `className` escape hatch. Each can be addressed later by adding props to design components if desired.

- **Card hover/interactive states**: `ds/Card` had `hoverable`/`interactive` props with hover transitions and a left accent border (`border-l-2 border-l-accent/60`). `design/Box` has no hover or accent props — cards will be static surfaces.
- **Card left accent border**: The teal left border on note cards is gone. Cards are plain bordered boxes.
- **Text mono styling**: `ds/Text` had `mono` and `monoStrong` variants (monospace font, specific sizing). `design/Text` has no mono variant — mono text (e.g. repo names, frontmatter values) will render in the default font.
- **Text error styling**: `ds/Text` had `error` and `errorDetail` variants (red tones). `design/Text` has no error variant — error messaging will use `Alert variant="error"` instead, which changes the visual presentation from inline red text to a boxed alert.
- **Text secondary/sectionLabel**: `ds/Text` had `secondary` (dimmed body) and `sectionLabel` (uppercase tracking). `design/Text` has `body-dim` and `label` which are close but may differ in exact sizing/weight.
- **NavLink brand/listItem variants**: `ds/NavLink` had `brand` (bold, larger, accent colour) and `listItem` (padded, full-width) variants. `design/Link` has `default`/`muted`/`nav` — branding and list-item styling will differ.
- **Button pagination variant**: `ds/Button` had a `pagination` variant. Not available — use `ghost` or `secondary`.
- **Toolbar vs TopBar layout**: `ds/Toolbar` was `flex justify-between`. `design/TopBar` is a 3-column grid — item alignment may shift.
- **DividedList dividers**: Divider lines between menu items in GearPopover will be lost. Stack with gap provides spacing but not visible separators.
- **Text centering**: `ds/Center` wrapped content in `text-center`. Without a `textAlign` prop on Box, centering on the unauthenticated view and auth button may be lost.
- **Scroll containers**: `NoteFullContent` had `max-h-[60vh] overflow-y-auto`. Box has no overflow/max-height props — expanded notes may not scroll within a bounded area.
- **Text truncation**: `DraftTray` items used `truncate` on text. `design/Text` has no truncation prop — long draft names may wrap instead of truncating.
- **ProseContent fade-in**: `ds/ProseContent` had an optional `animate-fade-in`. `design/MarkdownCard` may behave differently on mount.
- **PageContainer width**: `ds/PageContainer` was `max-w-xl mx-auto px-4 py-4`. `design/AppShell` structures layout differently — pre-auth views will have different content width and padding.
- **Skeleton**: Deleted (was unused). Loading states would need a new component if needed later.
- **ResizeHandle**: Stays as a raw `<div>` — it's a drag interaction primitive, not a design system concern.
