# Build Log

Chronological record of significant changes. See CLAUDE.md for the log format.

---

### 2026-03-08 — Add local repo dev mode

Added a dev-only `?localRepo=<path>` URL parameter that loads a local git repository into the
app without GitHub authentication. Enables automated testing via Chrome DevTools MCP. Files are
served by a Vite plugin middleware (`/api/test-repo/*`) and written into LightningFS via a new
`populateFiles` worker message.

### 2026-03-08 — Add five-phase redesign plan

Added `plans/01` through `plans/05` covering the full redesign: layout overhaul, new note
creation with git-backed draft branches, existing note editing, draft recovery on reopen, and
sync indicators with auto-push.

### 2026-03-08 14:00 — Full app redesign: layout, drafts, editing, recovery, sync

Implemented all five redesign phases in one pass. The note list view was replaced with a full-height
split layout: a reference panel (search + note cards) on the left and an editor pane on the right
for wide viewports, collapsing to a single pane on narrow screens. Notes are now edited on git
draft branches and squash-merged to main on save. Drafts survive page reloads via branch recovery.
A git working spinner and auto-push on save complete the sync story.

![Multi-column card grid with rendered HTML previews](docs/build-log/2026-03-08-card-preview.png)

### 2026-03-08 — Fix: save works without a git remote

Added `hasRemote()` to the worker protocol so the app can detect whether the cloned repository
has a configured remote. The ready-phase machine state now carries this flag, and `pushIfOnline()`
returns early when it is false. The local-repo dev path hard-codes `hasRemote: false`. Saves to
`?localRepo=` repos now commit locally and never attempt a push that would error.

### 2026-03-08 — UX polish: titles, wikilinks, frontmatter, editor buttons, sort, empty states

Several UX improvements landing together. Timestamp-named notes now show just the time in the
card header (the date column already provides context). Notes with an H1 use that heading as
the card title and strip it from the preview body. Wikilinks (`[[target|label]]`) render as styled
spans rather than raw bracket text. YAML frontmatter no longer leaks into the rendered note view.
The editor toolbar gains visual hierarchy: Save is `secondary`, Discard is red, and confirming a
discard is now inline rather than a browser `confirm()` dialog. The gear menu is refactored to
use `DividedList` for consistent item styling. Empty note lists and empty search results now show
informative placeholder text. Notes sort newest-first by default with a sort control (Newest /
Oldest / Best match) in the panel header. The search input gains `id` and `name` attributes for
accessibility.

![Note cards showing H1 titles, time-only timestamps, stripped frontmatter, and sort control](docs/build-log/2026-03-08-ux-polish.png)

### 2026-03-08 — Restore vertical card layout

Reverted the note card layout to a vertical stack: full date/datetime at top in meta style,
H1 heading below (when present), preview text after. Date-only files show just the date;
timestamp files show the full datetime including time.

![Cards with vertical layout: meta date, heading, preview](docs/build-log/2026-03-08-card-layout-restored.png)

### 2026-03-09 — Card and expand redesign

Removed duplicate content and expand inconsistency. Card preview now shows the raw body (no H1 stripping); expanded state renders inline inside the card with Pin/Edit buttons, replacing the separate `NoteExpanded` component. `NoteFullContent` is a new shared component used by both `NoteRow` and `PinnedNote`.

![Expanded card inline with full content and action buttons](docs/build-log/2026-03-09-card-expand-redesign.png)

### 2026-03-09 — Design system migration: replace ds/ with design/

Migrated all components from the old `src/components/ds/` layer to the consolidated `src/design/`
system. The legacy `ds/` directory (19 files) and thin wrapper components (`AlertBox`, `Button`,
`ProseContent`, `PageContainer`, `BackLink`) were deleted. All handrolled SVG icons replaced with
lucide-react; GitHub icon kept as inline SVG since lucide removed brand icons. Design components
now reject `className` via TypeScript. All user-visible strings migrated to the i18n system.
`DataTable` and `Stack direction` support were added to the design system to cover gaps.

![App after design system migration](docs/build-log/2026-03-09-ds-migration.png)

### 2026-03-11 — Move domain logic into web worker as atomic operations

Moved all git domain operations (autosave, publish, discard, sync, clone) into the web worker
behind a serial promise queue. The main thread no longer touches git directly - it sends
high-level commands and receives complete state snapshots back. No-checkout commits via tree/blob
APIs eliminate working tree churn during autosave. Draft branch deletion is now pushed to the
remote on save, fixing the bug where edits on one device didn't appear on another. The old
primitive worker methods, `git-status.ts`, `push.ts`, and `draft-recovery.ts` were removed.

![App after worker domain ops refactoring](docs/build-log/2026-03-11-worker-domain-ops.png)
