import { Badge, Button, Text } from "../ds";
import { t } from "../i18n";

export type NoteCardProps = {
  title: string;
  date: string | null;
  previewHtml: string;
  isPinned: boolean;
  isDraft: boolean;
  hasConflict?: boolean;
  highlight?: boolean;
  onPin: () => void;
  onOpen: () => void;
};

export function NoteCard({
  title,
  date,
  previewHtml,
  isPinned,
  isDraft,
  hasConflict,
  highlight,
  onPin,
  onOpen,
}: NoteCardProps) {
  return (
    <div
      className={`w-full text-left bg-surface border rounded-md hover:bg-surface-2 transition-colors duration-150 cursor-pointer ${highlight ? "border-accent" : "border-edge"}`}
    >
      <div className="flex items-start">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 text-left px-3 py-2 flex flex-col gap-1"
          aria-label={t("note.open", { title })}
        >
          {(date || hasConflict || isDraft) && (
            <div className="flex items-center gap-2 min-w-0">
              {date && (
                <Text
                  variant="meta"
                  as="time"
                  className="text-xs normal-case tracking-normal flex-1"
                >
                  {date}
                </Text>
              )}
              {(hasConflict || isDraft) && (
                <div className="flex items-center gap-1 shrink-0">
                  {hasConflict && <Badge variant="error">{t("note.conflict")}</Badge>}
                  {isDraft && <Badge variant="warning">{t("note.draft")}</Badge>}
                </div>
              )}
            </div>
          )}
          {previewHtml && (
            <div
              className="prose prose-sm max-w-none text-paper line-clamp-12 mt-0.5"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </button>
        <div className="shrink-0 pt-1.5 pr-1.5">
          <Button
            variant="ghost"
            active={isPinned}
            size="sm"
            icon="pin"
            onClick={onPin}
            aria-label={isPinned ? t("note.unpin") : t("note.pin")}
          >
            {t("note.pin")}
          </Button>
        </div>
      </div>
    </div>
  );
}
