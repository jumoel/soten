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
