# Frontend Redesign - Overview

Complete frontend rewrite. Implementation split across plans 15-20. This document covers shared design philosophy, responsive layout strategy, feature specs, and what gets reused vs rewritten.

## Design Philosophy

**Local-first note-taking.** The browser is the primary runtime, GitHub is a sync target. Edits are instant, persistence is local, sync is eventually-consistent background work.

**Progressive complexity.** Mobile is a notepad - open, write, leave. Desktop is a research workbench - write with multiple reference notes visible. The same features exist at every breakpoint, but the UI reveals more as screen space allows.

**Information density over whitespace.** Follow the existing DESIGN.md principles. Tight layouts, hairline dividers, content-forward.

**Components all the way down.** Page-level code should read as composition of design system primitives - no raw HTML tags or Tailwind classes in feature components. If you're writing `<div className="...">` in a feature component, a primitive is missing. Primitives are built on demand as phases need them, not all upfront.

---

## Responsive Layout

Four breakpoints, each adding a column.

### Mobile (<768px) - Notepad

Single full-screen view at a time, stack-based navigation.

**Browser view (home):**
- Search bar at top
- Collapsible pinned notes section
- Note cards in a single-column list (title if present, date, 2-3 lines of content preview)
- Sort controls
- FAB to create new note

**Editor view:**
- Full-screen textarea
- Back arrow in top bar returns to browser
- Publish button in top bar
- Auto-save is silent, no UI beyond a subtle status indicator
- Backlinks collapsed into an expandable row at the bottom
- Tapping a backlink or wikilink navigates to that note (pushes onto back stack)

No split pane. No reference panel. No command palette.

### Tablet (768px - 1199px) - Browse + Write

Still one column at a time, but the editing view gains structure.

**Browser view:** Same as mobile but with a two-column card grid.

**Editor view:**
- Full width, ~65% viewport height
- Backlinks visible below the editor (~35%), with a draggable divider
- Reference overlay: a button slides in a right-edge panel. Contains a search bar at top and a reference card stack below. Swipe or tap outside to dismiss.
- Tapping a backlink opens it in the reference overlay instead of navigating away

### Desktop (1200px - 1919px) - Research Mode

Two persistent columns when editing.

**Browser view:** Full-screen, separate from editor. Calendar timeline at top, card grid below. 3-4 column grid depending on width.

**Editor view (two columns):**
- **Left column:** editor (~65% height) + backlinks (~35% height), draggable horizontal divider
- **Right column:** search bar at top + reference card stack below
- Draggable vertical gutter between columns
- Cmd+K focuses the reference search bar

### Ultra-wide (1920px+) - Three-Column Workspace

Three persistent columns. The browser no longer requires leaving the editor.

- **Left column (~250-350px):** Calendar timeline panel. Selecting dates filters condensed note cards underneath. Always visible.
- **Center column (flexible):** Editor (~65% height) + backlinks (~35% height)
- **Right column (~300-400px):** Search bar + reference card stack
- Both vertical gutters draggable
- Clicking a note in the left column opens it in the center editor

---

## Calendar Timeline Panel

Replaces traditional note lists for navigation. Daily notes and untitled notes are time-oriented.

**Structure:**
- Month selector with prev/next arrows at top
- Calendar grid showing days of the month
- Day indicators encode note density: no dot = no notes, single dot = 1 note, hollow dot = 2-3, filled dot = 4+
- Below the calendar: condensed note cards filtered by the current selection

**Interaction:**
- Default (no day selected): shows the current month's notes, newest first
- Click a day: filters to that day's notes
- Click the selected day again: deselects, back to full month
- Prev/next arrows or swipe to change month

**Search + calendar interaction:**
- Search filters the card list AND dims non-matching days in the calendar
- Only days containing matches keep their dots

**Where it appears:**
- Ultra-wide: persistent left column
- Desktop and below: at the top of the full-screen browser view, above the card grid

---

## Note Cards

Cards must identify notes at a glance, especially untitled daily notes.

**Card contents:**
- Title (bold) if present, otherwise "Untitled"
- Date (timestamp format: date or date+time)
- 2-3 lines of rendered content preview
- Pin indicator
- Draft indicator if unpublished changes exist

**Card sizing:**
- Full-width on mobile (single column)
- Responsive grid on larger screens (2-4 columns)
- Condensed variant for the ultra-wide left column: single-column, just title/date/one-line preview

---

## Reference Stack

The right column in editing mode. Used for accumulating research material while writing.

**Structure:**
- Search bar at top (independent search context from the browser search)
- Below: either search results or pinned reference cards
- Each search result has a + button to pin it into the stack without clearing the search
- Clear search to see just pinned reference cards

**Reference cards can be:**
- Collapsed: just title and date, one line
- Excerpt: first ~10 lines of rendered content (default when added)
- Expanded: full rendered note, scrollable within its card
- Dismissed: x button removes from stack

**How notes enter the stack:**
- Click + on a search result in the reference column
- Click a wikilink in rendered content (desktop: adds to stack; tablet: opens in overlay; mobile: navigates)
- Click a backlink card (same breakpoint behavior as wikilinks)
- Cmd+K focuses reference search bar (desktop only)

**Persistence:** The stack persists for the editing session. Navigating to the browser and back doesn't clear it. Switching to a different note does.

---

## Backlinks

Shown below the editor at every breakpoint (collapsed on mobile, visible on tablet+).

Discovered by querying the search index for notes containing `[[current-note-name]]`. No separate backlink index needed - the existing MiniSearch index handles this.

Displayed as condensed cards (title + snippet). Click behavior varies by breakpoint (see Reference Stack section above).

---

## Wikilinks

**Remark plugin (built in Phase 2):** Extends the existing markdown pipeline. `[[note-name]]` and `[[note-name|display label]]` rendered as styled links. Target resolved against the note list by title or filename match (case-insensitive). Unresolved links styled distinctly.

**In the editor:** Not syntax-highlighted (plain textarea). Wikilinks are functional only in rendered output.

---

## Editor

Plain textarea. Monospace font, comfortable line-height, themed to match the app's color tokens.

- Auto-save: debounced at 2 seconds of inactivity, saves to a draft branch
- Manual publish: button in the top bar, commits to main and pushes
- Title extraction: from YAML frontmatter `title:` field or first `#` heading
- Draft indicator in the top bar when unpublished changes exist

---

## Navigation

### Routing

Hash-based, no library.

- `#/` - browser view (home)
- `#/path/to/note.md` - editor view
- `#/settings` - settings overlay/page

Query parameters (parsed alongside the hash route):
- `?q=search+term` - pre-fills browser search
- `?draft=timestamp` - opens a specific draft in the editor

### Navigation patterns

- **Mobile:** Stack-based. Browser -> Note -> Linked Note. Back button/gesture works naturally.
- **Tablet:** Same stack, but reference overlay provides a way to peek at notes without navigating.
- **Desktop/Ultra-wide:** Reference pane means most navigation happens without leaving the editor. Wikilinks and backlinks open in the reference stack. Only "Back" returns to the browser.

### Command Palette (Desktop only)

Cmd+K focuses the reference search bar. Not a separate modal.

---

## Search

Full-text search across all note content using the existing MiniSearch in the worker.

- Fuzzy matching, prefix search, field boosting (title 3x, tags 2x, body 1x)
- Worker returns results with relevance scores (not just paths) for best-match sorting
- Index built on repo load, updated incrementally on note save
- Results sortable by relevance or date
- Pinned notes that match float to the top
- Two independent search contexts: browser search and reference stack search. Shared `useNoteSearch()` hook with separate atom instances.

---

## Offline & Sync

**Local-first:** All data lives in IndexedDB (LightningFS). The app works fully offline.

**Sync triggers:**
- Push on publish (if online)
- Pull on app focus (visibilitychange)
- Pull on reconnect (online event)
- Periodic pull every 5 minutes while foregrounded

**Conflict resolution:**
- Desktop: show remote version in a ReferenceCard in the reference stack
- Tablet: show remote version in the reference overlay
- Mobile: show inline Alert with option to view remote version (navigates to a read-only diff view)
- User resolves by editing the local version and publishing. No automatic merging.

**Status indicator:** Shows syncing, local (unsynced changes), offline, or idle.

**Asset caching:** Service worker (PWA via vite-plugin-pwa) precaches app shell for instant offline loading.

---

## Settings

Minimal. Accessed via gear icon in the top bar. Full-screen overlay on mobile, panel on desktop.

- Theme toggle (light / dark / system)
- Repository switching (for users with multiple repos enabled in GitHub)
- Logout (clears all local state)
- Wipe local data option

Repo switching is an escape hatch, not a primary workflow. Auth flow goes straight from login to the single repo (auto-selected if only one available).

---

## State Management

Jotai atoms organized by domain. Each domain's atoms are created in the phase that needs them, not all upfront.

- `state/auth.ts` - token, auth state, user info (Phase 1)
- `state/repo.ts` - repo config, default branch (Phase 1)
- `state/notes.ts` - note list, active note, pinned notes, per-note draft status (Phase 2)
- `state/editor.ts` - draft content, dirty flag, last saved timestamp (Phase 3)
- `state/search.ts` - shared search hook, browser query, reference query, results with scores (Phase 2)
- `state/sync.ts` - sync state enum, online/offline, last sync timestamp (Phase 3)
- `state/ui.ts` - theme mode, split ratios, reference stack state (Phase 1 for theme, rest as needed)

Write atoms handle side effects directly. No central dispatch system or event enum.

---

## Git / Filesystem Layer

All git and filesystem operations run in a dedicated Web Worker with a typed message-passing protocol. Main thread never touches isomorphic-git or LightningFS directly.

- Worker maintains an internal promise queue for serialization
- Main thread proxy wraps postMessage/onmessage into async calls
- Single LightningFS instance (one repo)
- Draft branches per note for auto-save isolation
- No-checkout commits for auto-save (tree/blob APIs)
- Worker returns state snapshots that the main thread reconciles into atoms
- Worker search returns relevance scores alongside paths

---

## Reuse

These layers are kept as-is from the current codebase:

- **Worker** (`src/worker/`) - protocol, client, all git/fs/search operations
- **CORS proxy + OAuth callback** (`functions/`)
- **Markdown pipeline** (`src/markdown.ts`) - extended with wikilink plugin in Phase 2
- **GitHub auth helpers** (`src/lib/github.ts`)
- **Filesystem layer** (`src/lib/fs.ts`)
- **Vite config** (proxy setup, build config)
- **Design tokens** (`src/index.css` color definitions)

Everything else is rewritten: components, atoms, routing, app shell.

---

## Breakpoint Summary

|                          | Mobile      | Tablet         | Desktop          | Ultra-wide        |
| ------------------------ | ----------- | -------------- | ---------------- | ----------------- |
| Columns                  | 1           | 1              | 2                | 3                 |
| Browser                  | Full-screen | Full-screen    | Full-screen      | Persistent left   |
| Editor                   | Full-screen | Full, ~65% h   | Left col, ~65% h | Center col, ~65% h |
| Backlinks                | Collapsed   | Below editor   | Below editor     | Below editor      |
| Reference stack          | None        | Right overlay  | Persistent right | Persistent right  |
| Search while editing     | No          | In overlay     | In right column  | Right col + left col |
| Wikilink click           | Navigates   | Opens overlay  | Opens in stack   | Opens in stack    |
| Calendar timeline        | Browser top | Browser top    | Browser top      | Persistent left   |
| Cmd+K                    | No          | No             | Yes              | Yes               |

---

## Phase Index

- **Plan 15** - Phase 0: Design System (primitives only, compositions built in later phases)
- **Plan 16** - Phase 1: State Foundation + Auth Shell
- **Plan 17** - Phase 2: Browser View (parallelizable with Phase 3 after Phase 1)
- **Plan 18** - Phase 3: Editor + Auto-save + Offline (parallelizable with Phase 2)
- **Plan 19** - Phase 4: Reference Stack + Split Pane + Conflict Resolution
- **Plan 20** - Phase 5: Ultra-wide Layout + PWA
