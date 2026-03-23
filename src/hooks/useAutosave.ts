import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { applyRepoState } from "../state/repo";
import { store } from "../state/store";
import { isOnlineAtom } from "../state/sync";
import { getRepoWorker } from "../worker/client";

const AUTOSAVE_DELAY_MS = 2000;

export function workerContext() {
  return {
    online: store.get(isOnlineAtom),
  };
}

export function extractTitle(content: string): string {
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

export function useAutosave(route: Extract<Route, { view: "note" | "draft" }>) {
  const user = useAtomValue(userAtom);
  const content = useAtomValue(editorContentAtom);
  const setContent = useSetAtom(editorContentAtom);
  const setSavedContent = useSetAtom(editorSavedContentAtom);
  const setTimestamp = useSetAtom(editorTimestampAtom);
  const setSaving = useSetAtom(editorSavingAtom);
  const setLastSaved = useSetAtom(editorLastSavedAtom);
  const dirty = useAtomValue(editorDirtyAtom);
  const saving = useAtomValue(editorSavingAtom);

  const [loaded, setLoaded] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const timestamp = useMemo(() => {
    if (route.view === "draft") return route.timestamp;
    return route.draft ?? route.path.replace(/\.md$/, "");
  }, [route]);

  const isDraft = route.view === "draft" || (route.view === "note" && !!route.draft);
  const title = extractTitle(content);

  // Load initial content
  useEffect(() => {
    setTimestamp(timestamp);
    let cancelled = false;

    async function load() {
      if (isDraft) {
        // Drafts only exist in worker state
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
        // For published notes: read file immediately, then check for draft override
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
        // Check for draft override in background
        try {
          const worker = getRepoWorker();
          const state = await worker.getState();
          const draft = state.drafts.find((d) => d.timestamp === timestamp);
          if (draft && !cancelled) {
            setContent(draft.content);
            setSavedContent(draft.content);
          }
        } catch {
          // Draft check failed, keep file content
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      setTimestamp(null);
    };
  }, [timestamp, isDraft, route, setContent, setSavedContent, setTimestamp]);

  // Autosave
  const doAutosave = useCallback(
    async (text: string) => {
      if (!user) return;
      setSaving(true);
      try {
        const worker = getRepoWorker();
        const { online } = workerContext();
        const result = await worker.autosaveDraft(
          timestamp,
          text,
          { username: user.username, token: user.token },
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

  // Flush on unmount
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

  return {
    content,
    setContent,
    handleContentChange,
    dirty,
    saving,
    loaded,
    title,
    timestamp,
    isDraft,
    doAutosave,
  };
}
