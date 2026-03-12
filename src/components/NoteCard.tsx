import { Badge, IconButton, Text } from "../ds";

export type NoteCardProps = {
  title: string;
  date: string | null;
  preview: string;
  isPinned: boolean;
  isDraft: boolean;
  onPin: () => void;
  onOpen: () => void;
};

export function NoteCard({
  title,
  date,
  preview,
  isPinned,
  isDraft,
  onPin,
  onOpen,
}: NoteCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-surface border border-edge rounded-md hover:bg-surface-2 transition-colors duration-150 cursor-pointer"
    >
      <div className="px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <Text variant="h4" as="span" className="truncate flex-1 text-sm">
            {title}
          </Text>
          <div className="flex items-center gap-1 shrink-0">
            {isDraft && <Badge variant="warning">draft</Badge>}
            {isPinned && <Badge variant="accent">pinned</Badge>}
            <IconButton
              icon="pin"
              size="sm"
              aria-label={isPinned ? "Unpin note" : "Pin note"}
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              className={isPinned ? "text-accent" : ""}
            />
          </div>
        </div>
        {date && (
          <Text variant="meta" as="time" className="text-xs normal-case tracking-normal">
            {date}
          </Text>
        )}
        {preview && (
          <p className="text-xs text-paper-dim leading-snug line-clamp-2 mt-0.5">{preview}</p>
        )}
      </div>
    </button>
  );
}
