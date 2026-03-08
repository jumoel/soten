# Phase 1: Layout Redesign

Replace the current top-bar + route-based note list with a minimal top bar and a single reference
panel that serves as the primary content surface.

## Goals

- Eliminate the hamburger menu and full-width top bar
- Replace pagination and the card-based note list with a dense, scrollable reference panel
- Move search into the reference panel (sticky at top)
- Inline note expansion with pinning
- URL state via query params (composable, multiple states at once)

## Layout

The app shell becomes:

```
┌─────────────────────────────┐
│ soten          [+]     [⚙] │  ← top bar (~40px, always visible)
├─────────────────────────────┤
│ [Search...                ] │  ← sticky, never scrolls
│ ═══════════════════════════ │
│ 📌 Pinned note A   [↕] [×] │  ← pinned zone (collapsed by default)
│ 📌 Pinned note B   [↕] [×] │
│ ─────────────────────────── │  ← hairline divider
│ Dec 7  CouchDB ADR          │  ← results / browse list
│ Dec 7  Improve Handwriting  │    (all notes when search empty,
│ Dec 7  (expanded note)      │     filtered when search active)
│   full content…             │
│   [📌 pin]                  │
│ Dec 7  Other note           │
└─────────────────────────────┘
```

On desktop (≥1200px) with a draft open, the reference panel shifts to the right pane (see Phase 2).

## Top Bar

- Left: app wordmark ("soten") + SO/10 logo mark
- Centre-left: `+` new note button (always visible)
- Right: gear icon

The gear opens a small popover containing:
- Current repo name (mono text, read-only)
- Link to Settings page

Nothing else. "Future improvements" are not placeholders in the UI.

## Reference Panel

### Search

`position: sticky; top: 0` — always visible regardless of scroll position. Drives filtering
of the results list below. Wired to the existing `searchQueryAtom` / `searchResultsAtom`.

When search is empty, the results list shows all notes in reverse-chronological order (the full
`noteListAtom`). This replaces the current pagination model — all notes are rendered as rows since
the list is small text and already in memory.

### Pinned Notes

Pinned notes sit between the sticky search bar and the results list. Each is a collapsed row by
default (title + unpin button). Clicking a pinned note expands it to full content with its own
internal scrollbar. A collapse toggle button (↕) is shown on the expanded header.

- Collapsing/expanding is local UI state, not persisted
- Maximum one pinned note expanded at a time (expanding a second collapses the first)
- Hairline rule (`border-b border-gray-200`) separates the pinned zone from results

Pinned note state lives in a `pinnedNotesAtom` (array of paths, session-only, not persisted to
localStorage or URL).

### Results List

Dense rows: `MMM D, YYYY` date on the left (text-xs text-gray-400), title on the right
(text-sm text-gray-700 font-medium), truncated with ellipsis. Hairline dividers between rows.

Clicking a row expands it inline: the row grows to show the full rendered note content with a
scrollbar if needed. A "📌 Pin" button appears in the expanded note's header. Clicking pin adds
the note to the pinned zone and collapses it back in the list.

Only one note can be expanded inline at a time (expanding another collapses the current one).

## URL State

TanStack Router typed search params on the root route:

```ts
type SearchParams = {
  q?: string;     // active search query
  note?: string;  // timestamp of currently expanded note
}
```

Examples:
- `/?q=yoghurt` — search active
- `/?note=1702739869049` — note expanded
- `/?q=yoghurt&note=1702739869049` — both at once

The `note` param drives which row is pre-expanded on load. The `q` param pre-fills the search
input. These compose freely with the `draft` param added in Phase 2.

## Components Changed

| Component | Action |
|---|---|
| `TopBar` | Rewrite — remove search, hamburger; add `+` button and gear popover |
| `Menu` | Remove |
| `NoteList` | Remove |
| `NoteCard` | Remove |
| `NoteCardSkeleton` | Remove |
| `FrontPage` route | Replace with `ReferencePanel` |
| `NotePage` route (`/note/*`) | Remove — notes no longer have their own route |
| `AppShell` | Update to support top bar + panel layout |
| `pageSizeAtom` | Remove |

New components:
- `ReferencePanel` — the main content surface
- `NoteRow` — dense list row (date + title, hairline divider)
- `NoteExpanded` — inline expanded note (full rendered content + pin button)
- `PinnedNote` — pinned zone entry (collapsed/expanded states)
- `GearPopover` — gear icon + floating popover with repo name + settings link

## Settings

`/settings` route is unchanged. Gear popover links to it with `<Link to="/settings">`.

## What Does Not Change

- Auth flow, unauthenticated view, clone/pull machine phases
- `searchQueryAtom`, `searchResultsAtom`, `noteListAtom`, `renderedNoteAtom`
- The worker and all git operations
- `backgroundSync`
