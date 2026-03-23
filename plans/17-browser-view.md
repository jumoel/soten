# Phase 2: Browser View

The home screen at all breakpoints. Parallelizable with Phase 3 after Phase 1 completes.

Parent plan: [14-frontend-redesign-overview.md](./14-frontend-redesign-overview.md)
Depends on: [16-state-foundation-auth.md](./16-state-foundation-auth.md)

---

## New Atoms (this phase)

- `state/notes.ts` - note list (derived from worker filenames), pinned notes (localStorage-backed), per-note draft status (worker returns this as part of repo state)
- `state/search.ts` - shared `useNoteSearch()` hook supporting multiple independent search contexts (browser search and later reference search use separate atom instances). Worker `search()` must return relevance scores alongside paths for best-match sorting.

---

## New Compositions (this phase, each with Storybook stories)

- `TopBar` - three-slot header (left, center, right). Sticky option. Built from Stack + Box.
- `NoteCard` - Card + Text + Badge. Shows title, date, content preview, pin/draft indicators.
- `CalendarGrid` - month grid with day cells. Density dots. Selection state. Props accept note-count-per-day map and optional set of active (search-matching) days.
- `MarkdownContent` - sanitized HTML rendering container with typography styles. Calls the markdown pipeline (`processMarkdown()`) for rendered content.
- `FAB` - floating action button, positioned bottom-right on mobile.

---

## Wikilink Remark Plugin

Extend the existing markdown pipeline (`src/markdown.ts`) with a remark plugin for `[[wikilinks]]`. See overview plan for spec (title/filename resolution, display labels, unresolved link styling). This is needed here because NoteCard content previews and MarkdownContent render wikilinks.

---

## Browser Layout

- TopBar: app name/logo (left), sync status placeholder (center), settings gear IconButton (right)
- CalendarGrid below TopBar
- SearchField + sort Select below calendar
- Pinned notes section (collapsible)
- NoteCard grid below
- FAB for new note creation (mobile); Button in TopBar (desktop)

Responsive card grid: 1 column mobile, 2 tablet, 3-4 desktop.

Hash routing: `#/` renders this view. `?q=search+term` pre-fills the SearchField.

---

## Calendar Timeline

Wire CalendarGrid to note data (see overview for full interaction spec):
- Compute note counts per day from note list
- Day dots encode density
- Month navigation
- Click day to filter, click again to deselect
- Search dims non-matching days

---

## Search

Wire SearchField to the worker's MiniSearch via `useNoteSearch()` hook:
- Debounced query -> worker `search()` -> results with scores
- Note list filters to matches
- Sort: newest, oldest, best-match (uses relevance scores from worker)
- Pinned notes that match float to the top regardless of sort

---

## Pinned Notes

- Pinned section at top of card list, collapsible (default expanded)
- Pin/unpin via IconButton on each NoteCard
- Stored in localStorage (does not sync across devices - acceptable for this feature)

---

## New Note Creation

- FAB on mobile triggers new draft creation, navigates to `#/?draft=timestamp`
- Button in TopBar on desktop does the same
- The editor (Phase 3) handles the `?draft=` route parameter

---

## Settings View

Hash routing: `#/settings`. Full-screen on mobile, overlay on desktop.

- Theme toggle (Toggle primitive)
- Repo switch: show current repo, button to choose different one
- Logout: clears token, user, local state
- Wipe local data: clears IndexedDB

---

## Done When

- Browser view renders at all breakpoints with responsive NoteCard grid
- CalendarGrid shows note density and filters cards on day click
- Search filters notes and dims non-matching calendar days
- Sort controls work (newest, oldest, best-match with relevance scores)
- Pinned notes work (pin, unpin, persist to localStorage, collapsible section)
- New note button exists (FAB on mobile, TopBar button on desktop) - navigates to draft route
- Wikilink remark plugin renders `[[links]]` in note card previews
- Settings accessible with theme, repo switch, logout, wipe
- Storybook stories exist for all new compositions (TopBar, NoteCard, CalendarGrid, MarkdownContent, FAB)
- All UI composed from design system primitives
