# Phase 3: Editor + Auto-save + Offline

The core writing experience plus offline support. Parallelizable with Phase 2 after Phase 1 completes.

Parent plan: [14-frontend-redesign-overview.md](./14-frontend-redesign-overview.md)
Depends on: [16-state-foundation-auth.md](./16-state-foundation-auth.md)

---

## New Atoms (this phase)

- `state/editor.ts` - draft content, dirty flag, last saved content (for change detection), last saved timestamp
- `state/sync.ts` - sync state enum (idle, syncing, error, offline), online/offline flag (from `navigator.onLine` + events), last sync timestamp

---

## New Compositions (this phase, each with Storybook stories)

- `BacklinkCard` - condensed note reference with title + snippet. Click handler passed as prop (behavior varies by breakpoint in later phases; here it navigates).
- `SplitPane` - two children with a draggable horizontal gutter. Vertical gutter variant added in Phase 4.

---

## Editor View

Hash routing: `#/path/to/note.md` opens an existing note. `#/?draft=timestamp` opens a new draft.

- TopBar: back arrow (left), note title (center), publish Button + sync status Badge (right)
- Textarea primitive (monospace mode) for editing
- Title extracted from YAML frontmatter `title:` field or first `#` heading, shown in TopBar

### Mobile (<768px)
- Full-screen editor
- Backlinks collapsed into an expandable row at the bottom ("Backlinks (3)")
- Tapping a backlink navigates to that note (pushes onto back stack)

### Tablet (768px+)
- Editor at ~65% viewport height
- Backlinks visible below (~35%) using SplitPane with draggable horizontal divider
- BacklinkCards displayed in the bottom section

---

## Auto-save

- On content change, debounce 2 seconds, then call `worker.autosaveDraft()`
- `editor.ts` atoms track dirty flag and last saved content for change detection (avoid redundant saves)
- Sync status in TopBar: Spinner while working, Badge "local" if unsynced, nothing when idle

---

## Publish

- Publish Button (primary) in TopBar
- Calls `worker.publishDraft()` - commits to main, pushes to remote
- On success: dirty flag cleared, sync status updates
- On failure: Alert with error message

---

## Draft Lifecycle

- **Create:** FAB/button from browser view navigates to `#/?draft=timestamp`. Editor creates the draft via worker.
- **Discard:** IconButton in TopBar opens Dialog for confirmation. On confirm: `worker.discardDraft()`, navigate to browser.
- **Auto-save before navigation:** If draft has unsaved changes when user clicks back, auto-save fires immediately (no data loss).

---

## Backlinks

Discovered by querying the search index for notes containing `[[current-note-name]]` (see overview for mechanism). Displayed as BacklinkCards. At this phase, clicking a backlink navigates to that note. Phase 4 changes this to open in reference stack/overlay on tablet+.

---

## Offline Support

- Listen to `navigator.onLine` and `online`/`offline` events, tracked in `state/sync.ts`
- Status indicator in TopBar: "offline" Badge when disconnected
- Auto-save works offline (writes to local IndexedDB, queued for push)
- On reconnect: push pending changes, then pull
- On app focus (`visibilitychange`): pull to check for remote changes
- Periodic pull every 5 minutes while foregrounded and online
- Guard against concurrent syncs with a flag in `state/sync.ts`

---

## Expand `applyRepoState`

Extend the minimal `applyRepoState` from Phase 1 to handle:
- Autosave results (update draft status)
- Publish results (remove draft branch, update note list)
- Discard results (remove draft branch)
- Sync results (updated filenames, refreshed FS cache)
- Search index refresh after file changes

---

## Done When

- Editor opens for existing notes and new drafts
- Auto-save works: content changes trigger debounced save to worker
- Publish commits to main and pushes
- Draft discard works with Dialog confirmation
- Sync status indicator reflects current state (working, local, idle, offline)
- Offline mode works: saves locally, syncs on reconnect
- Backlinks appear below editor (collapsed mobile, SplitPane tablet+)
- Back navigation works (TopBar arrow + browser back)
- Full round trip: create note -> edit -> auto-save -> publish -> see in browser
- Storybook stories for BacklinkCard and SplitPane
- All UI composed from design system primitives
