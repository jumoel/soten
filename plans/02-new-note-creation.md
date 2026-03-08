# Phase 2: New Note Creation

Add the ability to create new notes. Notes are backed by git draft branches from the moment the
editor opens, with automatic debounced commits and explicit save/discard actions.

## Goals

- New note editor in a two-pane layout (editor + reference panel)
- Resizable split between editor and reference panel
- Minimizable to a bottom tray, preserving the draft
- Multiple drafts can be open simultaneously (each minimized in the tray)
- All changes persisted to a git branch — nothing is ever lost
- Explicit save squash-merges to main; discard deletes the branch

## Filename and Branch Naming

When the user clicks `+`, a timestamp is generated immediately: `Date.now()`. This timestamp is:

- The future filename: `<timestamp>.md`
- The branch name: `draft/<timestamp>`
- The `?draft=<timestamp>` URL param

The timestamp is fixed for the lifetime of the draft. It does not change on save.

## Editor Layout

### Desktop (≥1200px)

Two-pane split: editor left, reference panel right. The reference panel (from Phase 1) is
reused unchanged — sticky search, pinned notes, results list.

Implemented with CSS grid on `AppShell`:

```
grid-template-rows: auto 1fr auto
grid-template-columns: <editorWidth>fr 4px 1fr
```

Row 1 = top bar (spans all columns). Row 2 = editor | handle | reference. Row 3 = draft tray
(spans all columns).

The 4px column is the `ResizeHandle`. Dragging updates a ratio stored in localStorage.

### Mobile / Narrow screens (<1200px)

Editor opens full-screen. The reference panel is not visible while the editor is open. The
minimize button returns to the reference panel.

### Responsive detection

Use a `useMediaQuery("(min-width: 1200px)")` hook (new file: `src/lib/use-media-query.ts`):

```ts
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const mql = typeof window !== "undefined" ? window.matchMedia(query) : null;
  return useSyncExternalStore(
    (cb) => {
      mql?.addEventListener("change", cb);
      return () => mql?.removeEventListener("change", cb);
    },
    () => mql?.matches ?? false,
    () => false,
  );
}
```

## State: Draft Model

### Types

New file: `src/atoms/drafts.ts`

```ts
import { atom } from "jotai";

export type Draft = {
  timestamp: string;     // e.g. "1709123456789"
  content: string;       // raw markdown being edited
  isNew: boolean;        // true = no file on main with this name
  minimized: boolean;
};

/** All open drafts, including minimized ones. */
export const draftsAtom = atom<Draft[]>([]);

/**
 * Timestamp of the draft currently visible in the editor pane.
 * Derived: the first non-minimized draft, or null.
 */
export const activeDraftAtom = atom<Draft | null>((get) => {
  return get(draftsAtom).find((d) => !d.minimized) ?? null;
});
```

### Actions

Helper functions in `src/atoms/drafts.ts` that mutate `draftsAtom` via the Jotai store:

```ts
import { store } from "./store";

export function openNewDraft(): string {
  const timestamp = String(Date.now());
  store.set(draftsAtom, (prev) => [
    // minimize any currently active draft
    ...prev.map((d) => (d.minimized ? d : { ...d, minimized: true })),
    { timestamp, content: "", isNew: true, minimized: false },
  ]);
  return timestamp;
}

export function restoreDraft(timestamp: string): void {
  store.set(draftsAtom, (prev) =>
    prev.map((d) => ({
      ...d,
      minimized: d.timestamp === timestamp ? false : d.minimized || d.timestamp !== timestamp,
    })),
  );
  // actually: minimize ALL other non-minimized, un-minimize this one
  store.set(draftsAtom, (prev) =>
    prev.map((d) => ({
      ...d,
      minimized: d.timestamp !== timestamp,
    })),
  );
}

export function minimizeDraft(timestamp: string): void {
  store.set(draftsAtom, (prev) =>
    prev.map((d) => (d.timestamp === timestamp ? { ...d, minimized: true } : d)),
  );
}

export function updateDraftContent(timestamp: string, content: string): void {
  store.set(draftsAtom, (prev) =>
    prev.map((d) => (d.timestamp === timestamp ? { ...d, content } : d)),
  );
}

export function removeDraft(timestamp: string): void {
  store.set(draftsAtom, (prev) => prev.filter((d) => d.timestamp !== timestamp));
}
```

### Re-exports

`src/atoms/globals.ts` adds:

```ts
export {
  draftsAtom,
  activeDraftAtom,
  openNewDraft,
  restoreDraft,
  minimizeDraft,
  updateDraftContent,
  removeDraft,
} from "./drafts";
export type { Draft } from "./drafts";
```

## URL State

### Router update

The `RootSearchParams` from Phase 1 gains a `draft` field:

```ts
type RootSearchParams = {
  q?: string;
  note?: string;
  draft?: string;  // timestamp of the active (non-minimized) draft
};
```

`validateSearch` updated:

```ts
validateSearch: (search: Record<string, unknown>): RootSearchParams => ({
  q: typeof search.q === "string" ? search.q : undefined,
  note: typeof search.note === "string" ? search.note : undefined,
  draft: typeof search.draft === "string" ? search.draft : undefined,
}),
```

The URL `?draft=<timestamp>` tracks which draft is currently active in the editor pane.
Minimized drafts are not reflected in the URL — only the visible editor.

When the active draft changes (open, restore, minimize), `navigate({ search: ... })` is called
to update the URL.

## Git Operations

All new git operations run in the web worker and are exposed via `RepoWorkerClient`.

### New worker protocol messages

Added to `src/worker/protocol.ts`:

```ts
export type WorkerRequest =
  // ...existing...
  | { id: number; type: "createBranch"; name: string }
  | { id: number; type: "checkoutBranch"; name: string }
  | { id: number; type: "commitFile"; filepath: string; content: string; message: string }
  | { id: number; type: "squashMergeToMain"; branch: string; message: string }
  | { id: number; type: "deleteBranch"; name: string }
  | { id: number; type: "listDraftBranches" }
  | { id: number; type: "readFileFromBranch"; branch: string; filepath: string };
```

### Worker implementation

New functions in `src/worker/repo.worker.ts`:

```ts
async function createBranch(name: string): Promise<void> {
  const { git } = await getGit();
  await git.branch({ fs, dir: REPO_DIR, ref: name });
}

async function checkoutBranch(name: string): Promise<void> {
  const { git } = await getGit();
  await git.checkout({ fs, dir: REPO_DIR, ref: name });
}

async function commitFile(
  filepath: string,
  content: string,
  message: string,
): Promise<void> {
  const { git } = await getGit();
  const enc = new TextEncoder();
  const fullpath = `${REPO_DIR}/${filepath}`;

  // ensure parent directory
  const dir = fullpath.slice(0, fullpath.lastIndexOf("/"));
  if (dir) await mkdirp(dir);

  await pfs.writeFile(fullpath, enc.encode(content));
  await git.add({ fs, dir: REPO_DIR, filepath });
  await git.commit({
    fs,
    dir: REPO_DIR,
    message,
    author: { name: "soten", email: "soten@local" },
  });
}

async function squashMergeToMain(branch: string, message: string): Promise<void> {
  const { git } = await getGit();

  // Get the tree from the tip of the draft branch
  const branchCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
  const { commit } = await git.readCommit({ fs, dir: REPO_DIR, oid: branchCommit });
  const tree = commit.tree;

  // Check out main
  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });

  // Create a single commit on main with the draft branch's tree
  const mainHead = await git.resolveRef({ fs, dir: REPO_DIR, ref: "HEAD" });
  const oid = await git.commit({
    fs,
    dir: REPO_DIR,
    message,
    tree,
    parent: [mainHead],
    author: { name: "soten", email: "soten@local" },
  });

  // Point main to the new commit
  await git.writeRef({ fs, dir: REPO_DIR, ref: "refs/heads/main", value: oid, force: true });
  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });

  // Delete the draft branch
  await git.deleteBranch({ fs, dir: REPO_DIR, ref: branch });
}

async function deleteBranch(name: string): Promise<void> {
  const { git } = await getGit();
  // Ensure we're on main before deleting
  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });
  await git.deleteBranch({ fs, dir: REPO_DIR, ref: name });
}

async function listDraftBranches(): Promise<Array<{ timestamp: string; content: string }>> {
  const { git } = await getGit();
  const branches = await git.listBranches({ fs, dir: REPO_DIR });
  const drafts: Array<{ timestamp: string; content: string }> = [];

  for (const branch of branches) {
    if (!branch.startsWith("draft/")) continue;
    const timestamp = branch.slice("draft/".length);

    // Read the file from this branch's tree
    try {
      const content = await readFileFromBranch(branch, `${timestamp}.md`);
      drafts.push({ timestamp, content: content ?? "" });
    } catch {
      drafts.push({ timestamp, content: "" });
    }
  }

  return drafts;
}

async function readFileFromBranch(
  branch: string,
  filepath: string,
): Promise<string | null> {
  const { git } = await getGit();
  try {
    const commitOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
    const { blob } = await git.readBlob({
      fs,
      dir: REPO_DIR,
      oid: commitOid,
      filepath,
    });
    return new TextDecoder().decode(blob);
  } catch {
    return null;
  }
}
```

Message handler additions in the `switch` block:

```ts
case "createBranch":
  await createBranch(msg.name);
  break;
case "checkoutBranch":
  await checkoutBranch(msg.name);
  break;
case "commitFile":
  await commitFile(msg.filepath, msg.content, msg.message);
  break;
case "squashMergeToMain":
  await squashMergeToMain(msg.branch, msg.message);
  break;
case "deleteBranch":
  await deleteBranch(msg.name);
  break;
case "listDraftBranches":
  result = await listDraftBranches();
  break;
case "readFileFromBranch":
  result = await readFileFromBranch(msg.branch, msg.filepath);
  break;
```

### Client methods

Added to `src/worker/client.ts` (`RepoWorkerClient`):

```ts
createBranch(name: string): Promise<void> {
  return this.call({ type: "createBranch", name }) as Promise<void>;
}

checkoutBranch(name: string): Promise<void> {
  return this.call({ type: "checkoutBranch", name }) as Promise<void>;
}

commitFile(filepath: string, content: string, message: string): Promise<void> {
  return this.call({ type: "commitFile", filepath, content, message }) as Promise<void>;
}

squashMergeToMain(branch: string, message: string): Promise<void> {
  return this.call({ type: "squashMergeToMain", branch, message }) as Promise<void>;
}

deleteBranch(name: string): Promise<void> {
  return this.call({ type: "deleteBranch", name }) as Promise<void>;
}

listDraftBranches(): Promise<Array<{ timestamp: string; content: string }>> {
  return this.call({ type: "listDraftBranches" }) as Promise<Array<{ timestamp: string; content: string }>>;
}

readFileFromBranch(branch: string, filepath: string): Promise<string | null> {
  return this.call({ type: "readFileFromBranch", branch, filepath }) as Promise<string | null>;
}
```

## Autosave

New file: `src/lib/autosave.ts`

```ts
import { getRepoWorker } from "../worker/client";
import { store } from "../atoms/store";
import { draftsAtom } from "../atoms/drafts";

const DEBOUNCE_MS = 2000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSaved = new Map<string, string>(); // timestamp → last saved content

export function scheduleAutosave(timestamp: string): void {
  const existing = timers.get(timestamp);
  if (existing) clearTimeout(existing);

  timers.set(
    timestamp,
    setTimeout(() => {
      timers.delete(timestamp);
      autosave(timestamp);
    }, DEBOUNCE_MS),
  );
}

async function autosave(timestamp: string): Promise<void> {
  const draft = store.get(draftsAtom).find((d) => d.timestamp === timestamp);
  if (!draft) return;
  if (draft.content === lastSaved.get(timestamp)) return; // no changes

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  try {
    await worker.checkoutBranch(branch);
    await worker.commitFile(filepath, draft.content, "draft: autosave");
    lastSaved.set(timestamp, draft.content);
    // Phase 5 adds: push branch if online
  } catch (e) {
    console.debug("autosave failed", e);
  }
}

export function cancelAutosave(timestamp: string): void {
  const existing = timers.get(timestamp);
  if (existing) clearTimeout(existing);
  timers.delete(timestamp);
  lastSaved.delete(timestamp);
}
```

## Save Flow

New file: `src/lib/draft-operations.ts`

```ts
import { getRepoWorker } from "../worker/client";
import { store, machineAtom, noteListAtom } from "../atoms/store";
import { removeDraft } from "../atoms/drafts";
import { cancelAutosave } from "./autosave";
import { refreshFs } from "./fs";
import { updateSearchIndex } from "../atoms/search";

function extractTitle(content: string): string | null {
  // Check frontmatter title:
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();

  // Check first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  return null;
}

export async function saveDraft(timestamp: string, content: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  // Final commit to the branch
  await worker.checkoutBranch(branch);
  await worker.commitFile(filepath, content, "draft: autosave");

  // Build commit message
  const title = extractTitle(content);
  const prefix = isNew ? "add" : "update";
  const message = title ? `${prefix}: ${title}` : `${prefix} note ${timestamp}`;

  // Squash merge to main (also deletes the branch)
  await worker.squashMergeToMain(branch, message);

  // Update app state
  const machine = store.get(machineAtom);
  if (machine.phase === "ready") {
    const oldFilenames = machine.filenames;
    const filenames = await worker.readRepoFiles();
    refreshFs();
    store.set(machineAtom, { ...machine, filenames });
    updateSearchIndex(oldFilenames, filenames, store.get(noteListAtom));
  }

  removeDraft(timestamp);
  // Phase 5 adds: push main if online
}

export async function discardDraft(timestamp: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;

  try {
    await worker.deleteBranch(branch);
  } catch {
    // Branch may not exist yet if no autosave happened
  }

  if (isNew) {
    // Clean up the file from the working directory if it was written
    try {
      const { pfs } = await import("../lib/fs");
      const { REPO_DIR } = await import("../lib/constants");
      await pfs.unlink(`${REPO_DIR}/${timestamp}.md`);
    } catch {
      // File may not exist
    }
  } else {
    // Restore the file from main
    await worker.checkoutBranch("main");
    refreshFs();
  }

  removeDraft(timestamp);
  // Phase 5 adds: delete remote branch if online
}
```

## Minimize / Restore

### Minimize

The editor toolbar has a minimize button. Clicking it calls `minimizeDraft(timestamp)` and
navigates to remove `?draft` from the URL.

### Restore

Clicking a tray entry calls `restoreDraft(timestamp)` and navigates to add `?draft=<timestamp>`
to the URL.

### Draft tray

On desktop, minimized drafts show as a thin bar at the bottom of the screen. On mobile, same.

## Components

### `EditorPane`

New file: `src/components/EditorPane.tsx`

```tsx
type EditorPaneProps = {
  draft: Draft;
};

export function EditorPane({ draft }: EditorPaneProps) {
  const [content, setContent] = useState(draft.content);
  const navigate = useNavigate();

  // Sync when switching to a different draft (e.g. restoring from tray, or recovery).
  // Uses a ref to track which draft we're editing, so we only reset on draft switch.
  const prevTimestamp = useRef(draft.timestamp);
  useEffect(() => {
    if (draft.timestamp !== prevTimestamp.current) {
      setContent(draft.content);
      prevTimestamp.current = draft.timestamp;
    }
  }, [draft.timestamp, draft.content]);

  const handleChange = (value: string) => {
    setContent(value);
    updateDraftContent(draft.timestamp, value);
    scheduleAutosave(draft.timestamp);
  };

  const handleSave = async () => {
    await saveDraft(draft.timestamp, content, draft.isNew);
    navigate({ search: (prev) => ({ ...prev, draft: undefined }) });
  };

  const handleMinimize = () => {
    minimizeDraft(draft.timestamp);
    navigate({ search: (prev) => ({ ...prev, draft: undefined }) });
  };

  const handleDiscard = async () => {
    if (!window.confirm(t("draft.discardConfirm"))) return;
    await discardDraft(draft.timestamp, draft.isNew);
    navigate({ search: (prev) => ({ ...prev, draft: undefined }) });
  };

  const title = extractDisplayTitle(content);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-edge bg-surface">
        <Text variant="body" as="span" className="flex-1 truncate font-medium">
          {title}
        </Text>
        <Button variant="ghost" size="sm" onClick={handleMinimize} aria-label={t("draft.minimize")}>
          ↓
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSave}>
          {t("draft.save")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDiscard}>
          {t("draft.discard")}
        </Button>
      </div>

      {/* Editor */}
      <textarea
        className="flex-1 w-full p-4 bg-surface font-mono text-sm text-paper resize-none
                   focus:outline-none"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("draft.placeholder")}
      />
    </div>
  );
}

function extractDisplayTitle(content: string): string {
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return "New note\u2026";
}
```

### `DraftTray`

New file: `src/components/DraftTray.tsx`

```tsx
export function DraftTray() {
  const drafts = useAtomValue(draftsAtom);
  const minimized = drafts.filter((d) => d.minimized);
  const navigate = useNavigate();

  if (minimized.length === 0) return null;

  return (
    <div className="border-t border-edge bg-surface">
      {minimized.map((draft) => (
        <DraftTrayEntry
          key={draft.timestamp}
          draft={draft}
          onRestore={() => {
            restoreDraft(draft.timestamp);
            navigate({ search: (prev) => ({ ...prev, draft: draft.timestamp }) });
          }}
          onDiscard={async () => {
            if (!window.confirm(t("draft.discardConfirm"))) return;
            await discardDraft(draft.timestamp, draft.isNew);
          }}
        />
      ))}
    </div>
  );
}
```

### `DraftTrayEntry`

```tsx
type DraftTrayEntryProps = {
  draft: Draft;
  onRestore: () => void;
  onDiscard: () => void;
};

function DraftTrayEntry({ draft, onRestore, onDiscard }: DraftTrayEntryProps) {
  const title = extractDisplayTitle(draft.content);

  return (
    <div className="flex items-center px-4 py-1.5 gap-2 text-sm">
      <span className="text-muted">✏</span>
      <button className="flex-1 text-left truncate text-paper" onClick={onRestore}>
        {title}
      </button>
      <Button variant="ghost" size="sm" onClick={onRestore} aria-label="Restore">
        ↑
      </Button>
      <Button variant="ghost" size="sm" onClick={onDiscard} aria-label="Discard">
        ×
      </Button>
    </div>
  );
}
```

### `ResizeHandle`

New file: `src/components/ResizeHandle.tsx`

```tsx
type ResizeHandleProps = {
  onDrag: (deltaX: number) => void;
};

export function ResizeHandle({ onDrag }: ResizeHandleProps) {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const handleMove = (ev: PointerEvent) => {
      onDrag(ev.clientX - startX);
    };
    const handleUp = () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className="w-1 cursor-col-resize bg-edge hover:bg-accent/40 transition-colors"
      onPointerDown={handlePointerDown}
    />
  );
}
```

## `AppShell` — updated for two-pane layout

`src/components/ds/AppShell.tsx` becomes the layout orchestrator:

```tsx
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-screen h-screen flex flex-col antialiased bg-base">
      {children}
    </div>
  );
}
```

The actual two-pane split is managed in `app.tsx` (or a new `AppLayout` component) because
it depends on `activeDraftAtom` and `useMediaQuery`, which are React hooks.

### Updated `app.tsx` ready-state rendering

```tsx
{(machine.phase === "ready" || machine.phase === "selectingRepo") && (
  <ReadyLayout />
)}
```

New `ReadyLayout` component (inline in `app.tsx` or separate file):

```tsx
function ReadyLayout() {
  const activeDraft = useAtomValue(activeDraftAtom);
  const isWide = useMediaQuery("(min-width: 1200px)");
  const [splitRatio, setSplitRatio] = useLocalStorage("editorSplit", 0.5);

  if (!activeDraft) {
    // Single pane: reference panel fills the space
    return (
      <>
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
        <DraftTray />
      </>
    );
  }

  if (!isWide) {
    // Mobile/narrow: full-screen editor
    return (
      <>
        <div className="flex-1 overflow-hidden">
          <EditorPane draft={activeDraft} />
        </div>
        <DraftTray />
      </>
    );
  }

  // Desktop two-pane: editor + reference
  return (
    <>
      <div
        className="flex-1 overflow-hidden grid"
        style={{
          gridTemplateColumns: `${splitRatio}fr 4px ${1 - splitRatio}fr`,
        }}
      >
        <EditorPane draft={activeDraft} />
        <ResizeHandle onDrag={(delta) => { /* update splitRatio */ }} />
        <div className="overflow-hidden">
          <Outlet />
        </div>
      </div>
      <DraftTray />
    </>
  );
}
```

### `useLocalStorage` hook

New file: `src/lib/use-local-storage.ts`

```ts
import { useState, useCallback } from "react";

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (v: T) => {
      setValue(v);
      localStorage.setItem(key, JSON.stringify(v));
    },
    [key],
  );

  return [value, set];
}
```

## Wiring: TopBar `+` button

Phase 1 left `handleNewNote` as a no-op. Now wire it:

```tsx
// In TopBar.tsx
const navigate = useNavigate();

const handleNewNote = async () => {
  const timestamp = openNewDraft();
  const worker = getRepoWorker();
  await worker.createBranch(`draft/${timestamp}`);
  await worker.checkoutBranch(`draft/${timestamp}`);
  navigate({ search: (prev) => ({ ...prev, draft: timestamp }) });
};
```

## i18n additions

```ts
"draft.save": "Save",
"draft.discard": "Discard",
"draft.minimize": "Minimize",
"draft.discardConfirm": "Discard this draft? This cannot be undone.",
"draft.placeholder": "Start writing\u2026",
"note.new": "New note",
```

(`note.new` was added in Phase 1 for the aria-label.)

## File change summary

| File | Action |
|---|---|
| `src/atoms/drafts.ts` | New — Draft type, atoms, action functions |
| `src/atoms/globals.ts` | Add draft re-exports |
| `src/lib/autosave.ts` | New — debounced autosave logic |
| `src/lib/draft-operations.ts` | New — save and discard flows |
| `src/lib/use-media-query.ts` | New — responsive breakpoint hook |
| `src/lib/use-local-storage.ts` | New — localStorage-backed state hook |
| `src/lib/note-paths.ts` | Unchanged from Phase 1 |
| `src/worker/protocol.ts` | Add 7 new message types |
| `src/worker/repo.worker.ts` | Add 7 handler functions |
| `src/worker/client.ts` | Add 7 client methods |
| `src/components/EditorPane.tsx` | New |
| `src/components/DraftTray.tsx` | New (includes DraftTrayEntry) |
| `src/components/ResizeHandle.tsx` | New |
| `src/components/TopBar.tsx` | Wire `handleNewNote` |
| `src/app.tsx` | Add `ReadyLayout` with two-pane logic |
| `src/router.tsx` | Add `draft` to `RootSearchParams` |
| `src/i18n/en.ts` | Add draft keys |
| `src/i18n/da.ts` | Add draft keys |

## What does not change

- Reference panel from Phase 1 (`ReferencePanel`, `NoteRow`, `NoteExpanded`, etc.)
- Search atoms and search index
- Auth and machine state phases
- Clone/pull worker operations
