import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Dialog, IconButton, Spinner, Text, Textarea } from "../ds";
import { extractTitle, useAutosave, workerContext } from "../hooks/useAutosave";
import { useRenderedMarkdown } from "../hooks/useRenderedMarkdown";
import { t } from "../i18n";
import { REPO_DIR } from "../lib/constants";
import { pfs } from "../lib/fs";
import { buildHash, type Route } from "../lib/router";
import { formatNoteDate } from "../lib/text";
import { userAtom } from "../state/auth";
import { backlinksIndexAtom } from "../state/backlinks";
import { editorContentAtom, editorDirtyAtom } from "../state/editor";
import type { NoteListEntry } from "../state/notes";
import { noteListAtom } from "../state/notes";
import { applyRepoState } from "../state/repo";
import { store } from "../state/store";
import { conflictsAtom, isOnlineAtom, syncStateAtom } from "../state/sync";
import { getRepoWorker } from "../worker/client";
import { MarkdownContent } from "./MarkdownContent";
import { MetaSection, NoteMetaPanel } from "./NoteMetaPanel";

function SyncIndicator() {
  const syncState = useAtomValue(syncStateAtom);
  const online = useAtomValue(isOnlineAtom);

  if (!online) {
    return <Badge variant="warning">{t("editor.offline")}</Badge>;
  }
  if (syncState === "error") {
    return <Badge variant="error">{t("editor.syncError")}</Badge>;
  }
  return null;
}

function useBacklinks(currentPath: string) {
  const index = useAtomValue(backlinksIndexAtom);
  const notes = useAtomValue(noteListAtom);

  return useMemo(() => {
    const filename = currentPath.split("/").pop() ?? "";
    const stem = filename.endsWith(".md") ? filename.slice(0, -3) : filename;
    const sourceStems = index.get(stem);
    if (!sourceStems || sourceStems.size === 0) return [];
    return notes.filter((n) => {
      const nStem = n.relativePath.endsWith(".md") ? n.relativePath.slice(0, -3) : n.relativePath;
      return sourceStems.has(nStem);
    });
  }, [currentPath, index, notes]);
}

function useBacklinkTitles(entries: NoteListEntry[]) {
  const [titles, setTitles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (entries.length === 0) {
      setTitles(new Map());
      return;
    }
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled(
        entries.map(async (entry) => {
          const content = await pfs.readFile(entry.path, { encoding: "utf8" });
          const title = extractTitle(content);
          return [entry.path, title] as const;
        }),
      );
      if (cancelled) return;
      const map = new Map<string, string>();
      for (const r of results) {
        if (r.status === "fulfilled" && r.value[1] !== t("editor.untitled")) {
          map.set(r.value[0], r.value[1]);
        }
      }
      setTitles(map);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [entries]);

  return titles;
}

type OpenNotePanelProps = {
  route: Extract<Route, { view: "note" | "draft" }>;
  urlParams?: Record<string, string | undefined>;
};

export function OpenNotePanel({ route, urlParams }: OpenNotePanelProps) {
  const user = useAtomValue(userAtom);
  const conflicts = useAtomValue(conflictsAtom);
  const { content, handleContentChange, saving, loaded, title, timestamp, isDraft, doAutosave } =
    useAutosave(route);

  const [editMode, setEditMode] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emptyNoteOpen, setEmptyNoteOpen] = useState(false);
  const hasAutoOpened = useRef(false);

  const editorId = "open-note-textarea";

  // New drafts start in edit mode (once per note)
  useEffect(() => {
    if (loaded && isDraft && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      setEditMode(true);
      requestAnimationFrame(() => {
        document.getElementById(editorId)?.focus();
      });
    }
  }, [loaded, isDraft]);

  // Reset edit mode when switching notes
  const prevTimestamp = useRef(timestamp);
  if (prevTimestamp.current !== timestamp) {
    prevTimestamp.current = timestamp;
    hasAutoOpened.current = false;
    setEditMode(false);
    setPublishError(null);
  }

  const currentPath = useMemo(() => {
    if (route.view === "note") return `${REPO_DIR}/${route.path}`;
    return `${REPO_DIR}/${timestamp}.md`;
  }, [route, timestamp]);

  const backlinks = useBacklinks(currentPath);
  const backlinkTitles = useBacklinkTitles(backlinks);

  const notes = useAtomValue(noteListAtom);
  const currentNote = useMemo(
    () => notes.find((n) => n.path === currentPath),
    [notes, currentPath],
  );
  const dateStr = useMemo(() => {
    if (currentNote?.date) return formatNoteDate(currentNote.date);
    // For new drafts not yet in noteList, parse timestamp from the filename
    const m = timestamp.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
    if (m) {
      const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)));
      if (!Number.isNaN(date.getTime())) return formatNoteDate(date);
    }
    return null;
  }, [currentNote, timestamp]);

  const currentConflict = useMemo(
    () => conflicts.find((c) => currentPath.endsWith(c.path)),
    [conflicts, currentPath],
  );

  const html = useRenderedMarkdown(editMode ? "" : content);

  // Close: navigate to home preserving search/calendar params
  const handleClose = useCallback(() => {
    window.location.hash = buildHash(undefined, urlParams);
  }, [urlParams]);

  // Escape key closes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        // Flush before closing
        const currentContent = store.get(editorContentAtom);
        const savedAtom = store.get(editorDirtyAtom);
        if (savedAtom) {
          doAutosave(currentContent);
        }
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, doAutosave]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    if (!user) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const worker = getRepoWorker();
      const { online } = workerContext();
      const currentContent = store.get(editorContentAtom);
      const commitTitle = extractTitle(currentContent);
      const message =
        commitTitle !== t("editor.untitled") ? `publish: ${commitTitle}` : "publish: new note";
      const result = await worker.publishDraft(
        timestamp,
        currentContent,
        message,
        { username: user.username, token: user.token },
        online,
      );
      await applyRepoState(result.state);
      setEditMode(false);
      window.location.hash = buildHash(`${timestamp}.md`, urlParams);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }, [user, timestamp, urlParams]);

  // Discard handler
  const handleDiscard = useCallback(async () => {
    if (!user) return;
    setDiscardOpen(false);
    try {
      const worker = getRepoWorker();
      const { online } = workerContext();
      const result = await worker.discardDraft(
        timestamp,
        { username: user.username, token: user.token },
        online,
      );
      await applyRepoState(result.state);
      window.location.hash = buildHash(undefined, urlParams);
    } catch (e) {
      console.debug("discard failed", e);
      window.location.hash = buildHash(undefined, urlParams);
    }
  }, [user, timestamp, urlParams]);

  // Delete published note handler
  const handleDelete = useCallback(async () => {
    if (!user) return;
    setDeleteOpen(false);
    try {
      const worker = getRepoWorker();
      const { online } = workerContext();
      const filepath = route.view === "note" ? route.path : `${timestamp}.md`;
      const result = await worker.deleteNote(
        filepath,
        `delete: ${title}`,
        { username: user.username, token: user.token },
        online,
      );
      await applyRepoState(result.state);
      window.location.hash = buildHash(undefined, urlParams);
    } catch (e) {
      console.debug("delete failed", e);
      window.location.hash = buildHash(undefined, urlParams);
    }
  }, [user, route, timestamp, title, urlParams]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label={t("loading")} size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border border-edge rounded-md overflow-hidden max-h-[60vh] min-h-48 overflow-y-auto relative">
        {/* Action buttons - floating */}
        <div className="absolute top-0 right-0 z-10 flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm rounded-bl-md">
          {dateStr && (
            <Text variant="meta" as="time" className="text-xs">
              {dateStr}
            </Text>
          )}
          <SyncIndicator />
          {currentConflict && <Badge variant="error">{t("note.conflict")}</Badge>}
          {(saving || publishing) && (
            <Text variant="meta" className="text-xs">
              {t("editor.saving")}
            </Text>
          )}
          {editMode ? (
            <Button
              variant="primary"
              size="sm"
              icon="check"
              onClick={() => {
                const currentContent = store.get(editorContentAtom);
                if (!currentContent.trim()) {
                  setEmptyNoteOpen(true);
                  return;
                }
                if (isDraft) {
                  handlePublish();
                } else {
                  setEditMode(false);
                }
              }}
              loading={publishing}
            >
              {t("openNote.save")}
            </Button>
          ) : (
            <IconButton
              icon="edit"
              size="sm"
              aria-label={t("openNote.edit")}
              onClick={() => setEditMode(true)}
            />
          )}
          <Button
            variant="secondary"
            size="sm"
            icon="trash"
            onClick={() => (isDraft ? setDiscardOpen(true) : setDeleteOpen(true))}
          >
            {isDraft ? t("openNote.discard") : t("openNote.delete")}
          </Button>
          <Button variant="secondary" size="sm" icon="close" onClick={handleClose}>
            {t("openNote.close")}
          </Button>
        </div>

        {publishError && (
          <div className="px-3 py-2">
            <Alert variant="error">{t("editor.publishFailed", { error: publishError })}</Alert>
          </div>
        )}

        {/* Content */}
        {editMode ? (
          <div className="p-3">
            <Textarea
              id={editorId}
              value={content}
              onChange={handleContentChange}
              placeholder={t("editor.placeholder")}
              label={title}
              mono
              rows={20}
              className="border-0 bg-transparent focus:outline-none resize-none"
            />
          </div>
        ) : (
          <div className="px-4 py-3">
            <MarkdownContent html={html} />
          </div>
        )}

        <NoteMetaPanel>
          <MetaSection title={t("editor.backlinks")} count={backlinks.length}>
            {backlinks.length > 0 ? (
              <div className="flex flex-col">
                {backlinks.map((bl) => {
                  const contentTitle = backlinkTitles.get(bl.path);
                  const blDate = formatNoteDate(bl.date);
                  return (
                    <a
                      key={bl.path}
                      href={buildHash(bl.relativePath, urlParams)}
                      className="flex items-center gap-2 px-3 py-2 border-t border-edge hover:bg-surface-2 transition-colors"
                    >
                      <Text variant="h4" as="span" className="text-sm">
                        {contentTitle ?? t("editor.untitled")}
                      </Text>
                      {blDate && (
                        <Text variant="meta" as="time" className="text-xs">
                          {blDate}
                        </Text>
                      )}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-2 border-t border-edge">
                <Text variant="body-dim" className="text-xs">
                  {t("editor.noBacklinks")}
                </Text>
              </div>
            )}
          </MetaSection>
        </NoteMetaPanel>
      </div>

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

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("openNote.delete")}>
        <div className="flex flex-col gap-4">
          <Text variant="body-dim" className="text-sm">
            {t("openNote.deleteConfirm")}
          </Text>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              {t("openNote.deleteCancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="trash"
              onClick={handleDelete}
              className="bg-error-surface text-error-text border-error-edge hover:bg-error-surface"
            >
              {t("openNote.deleteConfirmAction")}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={emptyNoteOpen}
        onClose={() => setEmptyNoteOpen(false)}
        title={t("openNote.emptyNoteTitle")}
      >
        <div className="flex flex-col gap-4">
          <Text variant="body-dim" className="text-sm">
            {isDraft ? t("openNote.emptyNoteSave") : t("openNote.emptyNoteDelete")}
          </Text>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEmptyNoteOpen(false);
              }}
            >
              {t("openNote.emptyNoteKeepEditing")}
            </Button>
            {isDraft ? (
              <Button
                variant="primary"
                size="sm"
                icon="check"
                onClick={() => {
                  setEmptyNoteOpen(false);
                  handlePublish();
                }}
              >
                {t("openNote.emptyNoteSaveAction")}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon="trash"
                onClick={() => {
                  setEmptyNoteOpen(false);
                  handleDelete();
                }}
                className="bg-error-surface text-error-text border-error-edge hover:bg-error-surface"
              >
                {t("openNote.deleteConfirmAction")}
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
