import { Badge, IconButton, Text } from "../ds";
import { t } from "../i18n";

export type NoteCardProps = {
  title: string;
  date: string | null;
  preview: string;
  isPinned: boolean;
  isDraft: boolean;
  hasConflict?: boolean;
  onPin: () => void;
  onOpen: () => void;
};

export function NoteCard({
  title,
  date,
  preview,
  isPinned,
  isDraft,
  hasConflict,
  onPin,
  onOpen,
}: NoteCardProps) {
  return (
    <div className="w-full text-left bg-surface border border-edge rounded-md hover:bg-surface-2 transition-colors duration-150 cursor-pointer">
      <div className="flex items-start">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 text-left px-3 py-2 flex flex-col gap-1"
          aria-label={t("note.open", { title })}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Text variant="h4" as="span" className="truncate flex-1 text-sm">
              {title}
            </Text>
            {(hasConflict || isDraft) && (
              <div className="flex items-center gap-1 shrink-0">
                {hasConflict && <Badge variant="error">{t("note.conflict")}</Badge>}
                {isDraft && <Badge variant="warning">{t("note.draft")}</Badge>}
              </div>
            )}
          </div>
          {date && (
            <Text variant="meta" as="time" className="text-xs normal-case tracking-normal">
              {date}
            </Text>
          )}
          {preview && (
            <p className="text-xs text-paper-dim leading-snug line-clamp-2 mt-0.5">{preview}</p>
          )}
        </button>
        <div className="shrink-0 pt-1.5 pr-1.5">
          <IconButton
            icon="pin"
            size="sm"
            aria-label={isPinned ? t("note.unpin") : t("note.pin")}
            onClick={onPin}
            className={isPinned ? "text-accent" : ""}
          />
        </div>
      </div>
    </div>
  );
}
