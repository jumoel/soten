import { Icon, Text } from "../ds";
import { t } from "../i18n";

export type BacklinkCardProps = {
  title: string;
  snippet: string;
  onClick: () => void;
};

export function BacklinkCard({ title, snippet, onClick }: BacklinkCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface border border-edge rounded-md px-3 py-2 hover:bg-surface-2 transition-colors duration-150 cursor-pointer flex flex-col gap-1"
      aria-label={t("note.open", { title })}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon name="file-text" size="4" />
        <Text variant="h4" as="span" className="truncate flex-1 text-sm">
          {title}
        </Text>
      </div>
      {snippet && <p className="text-xs text-paper-dim leading-snug line-clamp-2">{snippet}</p>}
    </button>
  );
}
