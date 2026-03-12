import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BacklinkCard } from "../components/BacklinkCard";
import { SplitPane } from "../components/SplitPane";
import { TopBar } from "../components/TopBar";
import { Alert, Badge, Button, Dialog, IconButton, Spinner, Text, Textarea } from "../ds";
import { t } from "../i18n";
import { REPO_DIR } from "../lib/constants";
import { pfs } from "../lib/fs";
import type { Route } from "../lib/router";
import { userAtom } from "../state/auth";
import {
  editorContentAtom,
  editorDirtyAtom,
  editorLastSavedAtom,
  editorSavedContentAtom,
  editorSavingAtom,
  editorTimestampAtom,
} from "../state/editor";
import { noteListAtom } from "../state/notes";
import { applyRepoState, hasRemoteAtom } from "../state/repo";
import { store } from "../state/store";
import { isOnlineAtom, syncStateAtom } from "../state/sync";
import { getRepoWorker } from "../worker/client";

const AUTOSAVE_DELAY_MS = 2000;

function extractTitle(content: string): string {
  // Try YAML frontmatter title: field
  if (content.startsWith("---\n") || content.startsWith("---\r\n")) {
    const endIdx = content.indexOf("\n---", 4);
    if (endIdx > 0) {
      const fm = content.slice(4, endIdx);
      const match = fm.match(/^title:\s*(.+)$/m);
      if (match?.[1]) return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  // Try first # heading
  const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();
  return t("editor.untitled");
}

// ---------------------------------------------------------------------------
// Backlinks
// ---------------------------------------------------------------------------

type BacklinkEntry = {
  path: string;
  relativePath: string;
  title: string;
  snippet: string;
};

function useBacklinks(currentTitle: string): BacklinkEntry[] {
  const notes = useAtomValue(noteListAtom);
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);

  useEffect(() => {
    if (!currentTitle || currentTitle === t("editor.untitled")) {
      setBacklinks([]);
      return;
    }

    let cancelled = false;
    const pattern = `[[${currentTitle}]]`;

    async function scan() {
      const results: BacklinkEntry[] = [];
      for (const note of notes) {
        try {
          const content = await pfs.readFile(note.path, { encoding: "utf8" });
          if (content.includes(pattern)) {
            const lines = content.split("\n");
            let start = 0;
            if (lines[0]?.startsWith("---")) {
              const end = lines.indexOf("---", 1);
              if (end > 0) start = end + 1;
            }
            const snippet = lines
              .slice(start)
              .filter((l: string) => l.trim().length > 0)
              .slice(0, 2)
              .join(" ")
              .slice(0, 150);
            results.push({
              path: note.path,
              relativePath: note.relativePath,
              title: note.title,
              snippet,
            });
          }
        } catch {
          // Skip unreadable files
        }
      }
      if (!cancelled) setBacklinks(results);
    }

    scan();
    return () => {
      cancelled = true;
    };
  }, [currentTitle, notes]);

  return backlinks;
}

// ---------------------------------------------------------------------------
// Sync status indicator
// ---------------------------------------------------------------------------

function SyncIndicator() {
  const syncState = useAtomValue(syncStateAtom);
  const saving = useAtomValue(editorSavingAtom);
  const dirty = useAtomValue(editorDirtyAtom);
  const online = useAtomValue(isOnlineAtom);

  if (saving) {
    return <Spinner size="sm" label={t("editor.saving")} />;
  }
  if (!online) {
    return <Badge variant="warning">{t("editor.offline")}</Badge>;
  }
  if (syncState === "error") {
    return <Badge variant="error">{t("editor.syncError")}</Badge>;
  }
  if (dirty) {
    return <Badge variant="default">{t("editor.unsaved")}</Badge>;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backlinks panel
// ---------------------------------------------------------------------------

function BacklinksPanel({ backlinks }: { backlinks: BacklinkEntry[] }) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <Text variant="meta" as="span" className="text-xs">
        {t("editor.backlinks")} ({backlinks.length})
      </Text>
      {backlinks.length === 0 ? (
        <Text variant="body-dim" className="text-xs">
          {t("editor.noBacklinks")}
        </Text>
      ) : (
        <div className="flex flex-col gap-1.5">
          {backlinks.map((bl) => (
            <BacklinkCard
              key={bl.path}
              title={bl.title}
              snippet={bl.snippet}
              onClick={() => {
                window.location.hash = `#/${bl.relativePath}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditorView
// ---------------------------------------------------------------------------

export function EditorView({ route }: { route: Extract<Route, { view: "note" | "draft" }> }) {
  const user = useAtomValue(userAtom);
  const content = useAtomValue(editorContentAtom);
  const setContent = useSetAtom(editorContentAtom);
  const setSavedContent = useSetAtom(editorSavedContentAtom);
  const setTimestamp = useSetAtom(editorTimestampAtom);
  const setSaving = useSetAtom(editorSavingAtom);
  const setLastSaved = useSetAtom(editorLastSavedAtom);
  const dirty = useAtomValue(editorDirtyAtom);

  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Determine the timestamp for this editor session
  const timestamp = useMemo(() => {
    if (route.view === "draft") return route.timestamp;
    return route.draft ?? route.path.replace(/\.md$/, "");
  }, [route]);

  const isDraft = route.view === "draft" || !!("draft" in route && route.draft);
  const title = extractTitle(content);
  const backlinks = useBacklinks(title);

  // Load initial content
  useEffect(() => {
    setTimestamp(timestamp);
    let cancelled = false;

    async function load() {
      if (isDraft) {
        // For drafts, try reading from the draft branch via worker
        try {
          const worker = getRepoWorker();
          const state = await worker.getState();
          const draft = state.drafts.find((d) => d.timestamp === timestamp);
          if (!cancelled) {
            const initial = draft?.content ?? "";
            setContent(initial);
            setSavedContent(initial);
            setLoaded(true);
          }
        } catch {
          if (!cancelled) {
            setContent("");
            setSavedContent("");
            setLoaded(true);
          }
        }
      } else {
        // For existing notes, read from filesystem
        const filePath =
          route.view === "note" ? `${REPO_DIR}/${route.path}` : `${REPO_DIR}/${timestamp}.md`;
        try {
          const text = await pfs.readFile(filePath, { encoding: "utf8" });
          if (!cancelled) {
            setContent(text);
            setSavedContent(text);
            setLoaded(true);
          }
        } catch {
          if (!cancelled) {
            setContent("");
            setSavedContent("");
            setLoaded(true);
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      setTimestamp(null);
    };
  }, [timestamp, isDraft, route, setContent, setSavedContent, setTimestamp]);

  // Autosave on content change (debounced)
  const doAutosave = useCallback(
    async (text: string) => {
      if (!user) return;
      setSaving(true);
      try {
        const worker = getRepoWorker();
        const hasRemote = store.get(hasRemoteAtom);
        const online = store.get(isOnlineAtom);
        const result = await worker.autosaveDraft(
          timestamp,
          text,
          { username: user.username, token: user.token },
          hasRemote,
          online,
        );
        await applyRepoState(result.state);
        setSavedContent(text);
        setLastSaved(Date.now());
      } catch (e) {
        console.debug("autosave failed", e);
      } finally {
        setSaving(false);
      }
    },
    [user, timestamp, setSaving, setSavedContent, setLastSaved],
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        doAutosave(value);
      }, AUTOSAVE_DELAY_MS);
    },
    [setContent, doAutosave],
  );

  // Flush autosave on unmount / navigation
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
      // Fire immediate save if dirty
      const currentContent = store.get(editorContentAtom);
      const savedContent = store.get(editorSavedContentAtom);
      if (currentContent !== savedContent) {
        doAutosave(currentContent);
      }
    };
  }, [doAutosave]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    if (!user) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const worker = getRepoWorker();
      const hasRemote = store.get(hasRemoteAtom);
      const online = store.get(isOnlineAtom);
      const currentContent = store.get(editorContentAtom);
      const commitTitle = extractTitle(currentContent);
      const message =
        commitTitle !== t("editor.untitled") ? `publish: ${commitTitle}` : "publish: new note";
      const result = await worker.publishDraft(
        timestamp,
        currentContent,
        message,
        { username: user.username, token: user.token },
        hasRemote,
        online,
      );
      await applyRepoState(result.state);
      setSavedContent(currentContent);
      setLastSaved(Date.now());
      // Navigate to the published note
      window.location.hash = `#/${timestamp}.md`;
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }, [user, timestamp, setSavedContent, setLastSaved]);

  // Discard handler
  const handleDiscard = useCallback(async () => {
    if (!user) return;
    setDiscardOpen(false);
    try {
      const worker = getRepoWorker();
      const hasRemote = store.get(hasRemoteAtom);
      const online = store.get(isOnlineAtom);
      const result = await worker.discardDraft(
        timestamp,
        { username: user.username, token: user.token },
        hasRemote,
        online,
      );
      await applyRepoState(result.state);
      window.location.hash = "#/";
    } catch (e) {
      console.debug("discard failed", e);
      window.location.hash = "#/";
    }
  }, [user, timestamp]);

  // Back handler - save before navigating
  const handleBack = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const currentContent = store.get(editorContentAtom);
    const savedContent = store.get(editorSavedContentAtom);
    if (currentContent !== savedContent) {
      doAutosave(currentContent);
    }
    window.location.hash = "#/";
  }, [doAutosave]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <Spinner label={t("loading")} size="lg" />
      </div>
    );
  }

  const editorArea = (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder={t("editor.placeholder")}
          label={title}
          rows={999}
          mono
          className="h-full min-h-full border-0 bg-transparent focus:outline-none resize-none"
        />
      </div>
    </div>
  );

  const backlinksPanel = <BacklinksPanel backlinks={backlinks} />;

  return (
    <div className="flex flex-col h-screen bg-base">
      <TopBar
        left={
          <IconButton
            icon="chevron-left"
            size="sm"
            aria-label={t("nav.back")}
            onClick={handleBack}
          />
        }
        center={
          <Text variant="h3" as="span" className="text-sm truncate max-w-48">
            {title}
          </Text>
        }
        right={
          <div className="flex items-center gap-2">
            <SyncIndicator />
            {isDraft && (
              <>
                <IconButton
                  icon="trash"
                  size="sm"
                  aria-label={t("editor.discardDraft")}
                  onClick={() => setDiscardOpen(true)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon="upload"
                  onClick={handlePublish}
                  loading={publishing}
                  disabled={!dirty && !content.trim()}
                >
                  {t("editor.publish")}
                </Button>
              </>
            )}
          </div>
        }
      />

      {publishError && (
        <div className="px-3 py-2">
          <Alert variant="error">{t("editor.publishFailed", { error: publishError })}</Alert>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {/* Mobile: stacked layout */}
        <div className="md:hidden flex flex-col h-full">
          <div className="flex-1 overflow-auto">{editorArea}</div>
          {backlinks.length > 0 && (
            <div className="border-t border-edge max-h-48 overflow-auto">{backlinksPanel}</div>
          )}
        </div>

        {/* Tablet+: split pane */}
        <div className="hidden md:flex flex-col h-full">
          <SplitPane top={editorArea} bottom={backlinksPanel} />
        </div>
      </main>

      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={t("editor.discardDraft")}
      >
        <div className="flex flex-col gap-4">
          <Text variant="body-dim" className="text-sm">
            {t("editor.discardConfirm")}
          </Text>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDiscardOpen(false)}>
              {t("editor.discardCancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="trash"
              onClick={handleDiscard}
              className="bg-error-surface text-error-text border-error-edge hover:bg-error-surface"
            >
              {t("editor.discardConfirmAction")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
