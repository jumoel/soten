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
