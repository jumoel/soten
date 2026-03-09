# Phase 3: Existing Note Editing

Extend the editor introduced in Phase 2 to support editing existing notes. The git branching,
autosave, save, and discard mechanics are identical to new note creation.

## Goals

- Notes have a view mode and an edit mode
- Entering edit mode creates a `draft/<timestamp>` branch
- Leaving edit mode via save squash-merges to main
- Leaving edit mode via discard reverts the file to its main state and deletes the branch
- The editor layout is identical to Phase 2 (two-pane on desktop, full-screen on mobile)

## Edit / View Distinction

In the reference panel, expanded notes (Phase 1's `NoteExpanded` component) already accept an
`onEdit?: () => void` prop. Phase 3 wires this prop.

### Where the "Edit" button appears

The `NoteExpanded` component (Phase 1) renders an "Edit" button alongside the "Pin" button when
`onEdit` is provided. The button is always shown when a note is expanded — in both the results
list and the pinned zone.

### What clicking "Edit" does

1. Reads the file content from LightningFS (current main state) via `readFile(path)`
2. Derives the timestamp from the filename: `pathToTimestamp(path)` (from `src/lib/note-paths.ts`)
3. Opens a draft with `isNew: false` via the `openExistingDraft` helper

### Helper: `openExistingDraft`

Add to `src/atoms/drafts.ts`:

```ts
export function openExistingDraft(timestamp: string, content: string): void {
  store.set(draftsAtom, (prev) => [
    ...prev.map((d) => ({ ...d, minimized: true })),
    { timestamp, content, isNew: false, minimized: false },
  ]);
}
```

Re-export from `globals.ts`.

### `handleEdit` in `ReferencePanel.tsx`

```ts
const handleEdit = async (path: string) => {
  const timestamp = pathToTimestamp(path);
  if (!timestamp) return;

  // Check if a draft already exists for this timestamp (e.g. recovered from a branch)
  const existing = store.get(draftsAtom).find((d) => d.timestamp === timestamp);
  if (existing) {
    restoreDraft(timestamp);
    navigate({ search: (prev) => ({ ...prev, draft: timestamp }) });
    return;
  }

  // Read current content from the filesystem
  const file = await readFile(path);
  if (!file || file.type !== "text") return;

  // Create git branch and open draft
  const worker = getRepoWorker();
  await worker.createBranch(`draft/${timestamp}`);
  await worker.checkoutBranch(`draft/${timestamp}`);

  openExistingDraft(timestamp, file.content);
  navigate({ search: (prev) => ({ ...prev, draft: timestamp }) });
};
```

## Branch Naming

For existing notes, the branch name is derived from the filename stem:
`draft/<timestamp>` where `<timestamp>` is the numeric portion of the `.md` filename.

Since all filenames are timestamp-based, this is always `draft/<timestamp>`. A new note and an
edit of the same file share the same branch name — which is correct, since a saved new note
becomes an existing note.

## Autosave

Identical to Phase 2. `scheduleAutosave(timestamp)` is called from the `EditorPane` component's
`handleChange` callback. The autosave module doesn't need to know whether the draft is new or
existing.

## Save

The `saveDraft` function from `src/lib/draft-operations.ts` (Phase 2) already handles both
cases via the `isNew` flag:

- `isNew: true` → commit message prefix `"add"`
- `isNew: false` → commit message prefix `"update"`

After squash merge, `machineAtom` filenames are refreshed and the search index is updated.
This handles the case where an existing note's content changed (the search index entry for that
path is updated).

### Atom invalidation

After saving an existing note edit, the cached `renderedNoteAtom(path)` and `fileAtom(path)`
need to be invalidated so the note re-renders with the new content.

Jotai's `atomFamily` returns the same atom for the same key, and `fileAtom` is an async atom
that reads from LightningFS. After `refreshFs()` (called by `saveDraft`), reading the atom
again will get the new content. However, Jotai won't automatically re-read the atom unless a
dependency changes.

The solution is to force invalidation by calling `refreshFs()` (already in `saveDraft`) which
calls `fs.init(FILE_SYSTEM_NAME)`, and then triggering a `machineAtom` update (also already
done). Since `fileAtom` reads from the filesystem and components that use it are in the
component tree that re-renders when `machineAtom` changes, this should be sufficient.

If stale cached values persist, a more explicit invalidation can be done:

```ts
// In saveDraft, after refreshFs():
store.set(fileAtom(timestampToPath(timestamp)), undefined); // force re-fetch
```

But try without this first — the existing `refreshFs()` + `machineAtom` update flow should
trigger re-reads.

## Discard

The `discardDraft` function from `src/lib/draft-operations.ts` (Phase 2) already handles
both cases:

- `isNew: true` → delete the file from LightningFS
- `isNew: false` → checkout main to restore the file, call `refreshFs()`

## Components Changed

### `ReferencePanel` — wire `onEdit`

The `ReferencePanel` component passes `onEdit` to `NoteExpanded`:

```tsx
<NoteExpanded
  path={note.path}
  onPin={() => handlePin(note.path)}
  onEdit={() => handleEdit(note.path)}
/>
```

And similarly in `PinnedNote` when the pinned note is expanded:

```tsx
<NoteExpanded
  path={note.path}
  onPin={() => {}} // already pinned
  onEdit={() => handleEdit(note.path)}
/>
```

### `NoteExpanded` — unchanged

Phase 1 already defined the `onEdit?: () => void` prop. No component changes needed.

### `EditorPane` — unchanged

The `EditorPane` from Phase 2 works for both new and existing notes. It receives a `Draft`
object and doesn't care about `isNew` (that's handled by `saveDraft` and `discardDraft`).

## URL State

Identical to Phase 2. `?draft=<timestamp>` is set when editing. The timestamp happens to be
the same as the existing note's filename stem, which means `?note=<timestamp>&draft=<timestamp>`
is valid (the note is expanded in the reference panel while its edit is open in the editor).

## File change summary

| File                                | Action                                           |
| ----------------------------------- | ------------------------------------------------ |
| `src/atoms/drafts.ts`               | Add `openExistingDraft` function                 |
| `src/atoms/globals.ts`              | Re-export `openExistingDraft`                    |
| `src/components/ReferencePanel.tsx` | Wire `onEdit` to `NoteExpanded` and `PinnedNote` |

All other files from Phase 2 are unchanged. The `EditorPane`, `DraftTray`, autosave, save, and
discard flows work for existing notes without modification because the `Draft` type's `isNew`
flag was included from the start.

## What does not change

- All Phase 2 editor components (`EditorPane`, `DraftTray`, `ResizeHandle`)
- Worker git operations (all added in Phase 2)
- Reference panel display logic
- Autosave module
- Save and discard modules (they already handle `isNew: true` and `isNew: false`)
