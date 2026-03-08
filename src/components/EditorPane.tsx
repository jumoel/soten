import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./Button";
import { Text } from "./ds/Text";
import { minimizeDraft, updateDraftContent } from "../atoms/globals";
import { saveDraft, discardDraft } from "../lib/draft-operations";
import { scheduleAutosave } from "../lib/autosave";
import { t } from "../i18n";
import type { Draft } from "../atoms/drafts";

function extractDisplayTitle(content: string): string {
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return "New note\u2026";
}

type EditorPaneProps = {
  draft: Draft;
};

export function EditorPane({ draft }: EditorPaneProps) {
  const [content, setContent] = useState(draft.content);
  const navigate = useNavigate();
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
    void navigate({ to: "/", search: (prev) => ({ ...prev, draft: undefined }) });
  };

  const handleMinimize = () => {
    minimizeDraft(draft.timestamp);
    void navigate({ to: "/", search: (prev) => ({ ...prev, draft: undefined }) });
  };

  const handleDiscard = async () => {
    if (!window.confirm(t("draft.discardConfirm"))) return;
    await discardDraft(draft.timestamp, draft.isNew);
    void navigate({ to: "/", search: (prev) => ({ ...prev, draft: undefined }) });
  };

  const title = extractDisplayTitle(content);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-11 border-b border-edge bg-surface">
        <Text variant="body" as="span" className="flex-1 truncate font-medium">
          {title}
        </Text>
        <Button variant="ghost" size="sm" onClick={handleMinimize} aria-label={t("draft.minimize")}>
          ↓
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleSave()}>
          {t("draft.save")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleDiscard()}>
          {t("draft.discard")}
        </Button>
      </div>

      <textarea
        className="flex-1 w-full p-4 bg-surface font-mono text-sm text-paper resize-none focus:outline-none"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("draft.placeholder")}
      />
    </div>
  );
}
