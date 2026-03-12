import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BacklinkCard } from "../components/BacklinkCard";
import { Overlay } from "../components/Overlay";
import { ReferencePanel } from "../components/ReferencePanel";
import { SplitPane } from "../components/SplitPane";
import { TopBar } from "../components/TopBar";
import { Alert, Badge, Button, Dialog, IconButton, Spinner, Text, Textarea } from "../ds";
import { t } from "../i18n";
import { REPO_DIR } from "../lib/constants";
import { pfs } from "../lib/fs";
import type { Route } from "../lib/router";
import { frontmatterEndLine } from "../lib/text";
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
import { referenceStackAtom } from "../state/ui";
import { getRepoWorker } from "../worker/client";

const AUTOSAVE_DELAY_MS = 2000;

function workerContext() {
  return {
    hasRemote: store.get(hasRemoteAtom),
    online: store.get(isOnlineAtom),
  };
}

function extractTitle(content: string): string {
  if (content.startsWith("---\n") || content.startsWith("---\r\n")) {
    const endIdx = content.indexOf("\n---", 4);
    if (endIdx > 0) {
      const fm = content.slice(4, endIdx);
      const match = fm.match(/^title:\s*(.+)$/m);
      if (match?.[1]) return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
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
      const settled = await Promise.allSettled(
        notes.map(async (note) => {
          const content = await pfs.readFile(note.path, { encoding: "utf8" });
          if (!content.includes(pattern)) return null;
          const lines = content.split("\n");
          const start = frontmatterEndLine(lines);
          const snippet = lines
            .slice(start)
            .filter((l: string) => l.trim().length > 0)
            .slice(0, 2)
            .join(" ")
            .slice(0, 150);
          return {
            path: note.path,
            relativePath: note.relativePath,
            title: note.title,
            snippet,
          };
        }),
      );
      if (cancelled) return;
      const results: BacklinkEntry[] = [];
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) results.push(r.value);
      }
      setBacklinks(results);
    }

    scan();
    return () => {
      cancelled = true;
    };
  }, [currentTitle, notes]);

  return backlinks;
}

// ---------------------------------------------------------------------------
// Breakpoint hook
// ---------------------------------------------------------------------------

type Breakpoint = "mobile" | "tablet" | "desktop";

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === "undefined") return "mobile";
    if (window.innerWidth >= 1200) return "desktop";
    if (window.innerWidth >= 768) return "tablet";
    return "mobile";
  });

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1200px)");
    const tablet = window.matchMedia("(min-width: 768px)");

    function update() {
      if (desktop.matches) setBp("desktop");
      else if (tablet.matches) setBp("tablet");
      else setBp("mobile");
    }

    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return bp;
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

function BacklinksPanel({
  backlinks,
  onClickBacklink,
}: {
  backlinks: BacklinkEntry[];
  onClickBacklink: (bl: BacklinkEntry) => void;
}) {
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
              onClick={() => onClickBacklink(bl)}
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
  const setReferenceStack = useSetAtom(referenceStackAtom);

  const breakpoint = useBreakpoint();

  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refSearchRef = useRef<HTMLInputElement>(null);

  const timestamp = useMemo(() => {
    if (route.view === "draft") return route.timestamp;
    return route.draft ?? route.path.replace(/\.md$/, "");
  }, [route]);

  const isDraft = route.view === "draft" || (route.view === "note" && !!route.draft);
  const title = extractTitle(content);
  const backlinks = useBacklinks(title);

  const currentPath = useMemo(() => {
    if (route.view === "note") return `${REPO_DIR}/${route.path}`;
    return `${REPO_DIR}/${timestamp}.md`;
  }, [route, timestamp]);

  // Clear reference stack when switching notes
  const prevTimestamp = useRef(timestamp);
  useEffect(() => {
    if (prevTimestamp.current !== timestamp) {
      prevTimestamp.current = timestamp;
      setReferenceStack([]);
    }
  }, [setReferenceStack, timestamp]);

  // Cmd+K to focus reference search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (breakpoint === "desktop") {
          refSearchRef.current?.focus();
        } else if (breakpoint === "tablet") {
          setOverlayOpen(true);
          // Focus after overlay renders
          requestAnimationFrame(() => refSearchRef.current?.focus());
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [breakpoint]);

  // Load initial content
  useEffect(() => {
    setTimestamp(timestamp);
    let cancelled = false;

    async function load() {
      if (isDraft) {
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
        const { hasRemote, online } = workerContext();
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
      const { hasRemote, online } = workerContext();
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
      const { hasRemote, online } = workerContext();
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

  // Back handler
  const handleBack = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const currentContent = store.get(editorContentAtom);
    const savedContent = store.get(editorSavedContentAtom);
    if (currentContent !== savedContent) {
      doAutosave(currentContent);
    }
    window.location.hash = "#/";
  }, [doAutosave]);

  // Backlink click: breakpoint-aware
  const addToReferenceStack = useCallback(
    (path: string) => {
      setReferenceStack((prev) => {
        if (prev.some((e) => e.path === path)) return prev;
        return [...prev, { path, mode: "excerpt" as const }];
      });
    },
    [setReferenceStack],
  );

  const handleBacklinkClick = useCallback(
    (bl: BacklinkEntry) => {
      if (breakpoint === "mobile") {
        window.location.hash = `#/${bl.relativePath}`;
      } else {
        addToReferenceStack(bl.path);
        if (breakpoint === "tablet") setOverlayOpen(true);
      }
    },
    [breakpoint, addToReferenceStack],
  );

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <Spinner label={t("loading")} size="lg" />
      </div>
    );
  }

  const editorArea = (
    <div className="flex flex-col h-full p-3">
      <Textarea
        value={content}
        onChange={handleContentChange}
        placeholder={t("editor.placeholder")}
        label={title}
        mono
        className="flex-1 border-0 bg-transparent focus:outline-none resize-none"
      />
    </div>
  );

  const backlinksPanel = (
    <BacklinksPanel backlinks={backlinks} onClickBacklink={handleBacklinkClick} />
  );

  const referencePanel = <ReferencePanel currentPath={currentPath} searchRef={refSearchRef} />;

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
            {breakpoint === "tablet" && (
              <IconButton
                icon="panel-right"
                size="sm"
                aria-label={t("editor.openReferences")}
                onClick={() => setOverlayOpen(true)}
              />
            )}
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
        {breakpoint === "mobile" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">{editorArea}</div>
            {backlinks.length > 0 && (
              <div className="border-t border-edge max-h-48 overflow-auto">{backlinksPanel}</div>
            )}
          </div>
        )}

        {/* Tablet: editor + backlinks, overlay for references */}
        {breakpoint === "tablet" && (
          <>
            <div className="flex flex-col h-full">
              <SplitPane top={editorArea} bottom={backlinksPanel} />
            </div>
            <Overlay
              open={overlayOpen}
              onClose={() => setOverlayOpen(false)}
              title={t("editor.references")}
            >
              {referencePanel}
            </Overlay>
          </>
        )}

        {/* Desktop: two columns with vertical split */}
        {breakpoint === "desktop" && (
          <SplitPane
            direction="vertical"
            initialRatio={0.6}
            minSize={300}
            top={<SplitPane top={editorArea} bottom={backlinksPanel} />}
            bottom={referencePanel}
          />
        )}
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
