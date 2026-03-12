import { IconButton, Text } from "../ds";
import { t } from "../i18n";

export type NoteCardCondensedProps = {
  title: string;
  date: string | null;
  onOpen: () => void;
  onAdd?: () => void;
};

export function NoteCardCondensed({ title, date, onOpen, onAdd }: NoteCardCondensedProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2 transition-colors duration-150 group">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 text-left flex items-center gap-2"
        aria-label={t("note.open", { title })}
      >
        <Text variant="h4" as="span" className="text-sm truncate flex-1">
          {title}
        </Text>
        {date && (
          <Text variant="meta" as="time" className="text-xs shrink-0">
            {date}
          </Text>
        )}
      </button>
      {onAdd && (
        <IconButton
          icon="plus"
          size="sm"
          aria-label={t("reference.add", { title })}
          onClick={onAdd}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        />
      )}
    </div>
  );
}
