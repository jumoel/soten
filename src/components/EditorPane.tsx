import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Draft } from "../atoms/drafts";
import { minimizeDraft, updateDraftContent } from "../atoms/globals";
import { Button, Stack, Text, TopBar } from "../design";
import { t } from "../i18n";
import { scheduleAutosave } from "../lib/autosave";
import { discardDraft, saveDraft } from "../lib/draft-operations";

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

  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const handleDiscard = useCallback(async () => {
    await discardDraft(draft.timestamp);
    void navigate({ to: "/", search: (prev) => ({ ...prev, draft: undefined }) });
  }, [draft.timestamp, navigate]);

  const title = extractDisplayTitle(content);

  const discardControls = confirmingDiscard ? (
    <>
      <Text variant="meta" as="span">
        {t("draft.discardAreYouSure")}
      </Text>
      <Button variant="ghost" size="sm" onClick={() => void handleDiscard()}>
        {t("draft.discardConfirmAction")}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmingDiscard(false)}>
        {t("draft.discardCancel")}
      </Button>
    </>
  ) : (
    <Button variant="ghost" size="sm" onClick={() => setConfirmingDiscard(true)}>
      {t("draft.discard")}
    </Button>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar
        as="div"
        left={
          <Text variant="body" as="span">
            {title}
          </Text>
        }
        right={
          <Stack direction="horizontal" gap={1}>
            <Button variant="ghost" size="sm" onClick={handleMinimize}>
              {t("draft.minimize")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void handleSave()}>
              {t("draft.save")}
            </Button>
            {discardControls}
          </Stack>
        }
      />
      <textarea
        className="flex-1 w-full p-4 bg-surface font-mono text-sm text-paper resize-none focus:outline-none"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("draft.placeholder")}
      />
    </div>
  );
}
