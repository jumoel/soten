import { useMemo } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { Button } from "./Button";
import { ProseContent } from "./ProseContent";
import { FrontmatterTable } from "./FrontmatterTable";
import { LoadingSpinner } from "./LoadingSpinner";
import { renderedNoteAtom } from "../atoms/globals";
import { t } from "../i18n";

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M12 2l3 7h5l-4 4 1.5 7L12 17l-5.5 3L8 13 4 9h5z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

type NoteFullContentProps = {
  path: string;
  onPin: () => void;
  onEdit?: () => void;
};

export function NoteFullContent({ path, onPin, onEdit }: NoteFullContentProps) {
  const fullAtom = useMemo(() => loadable(renderedNoteAtom(path)), [path]);
  const [result] = useAtom(fullAtom);

  if (result.state === "loading") return <LoadingSpinner />;
  if (result.state !== "hasData" || !result.data) return null;

  return (
    <>
      <div className="flex gap-2 mt-2 mb-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          aria-label={t("note.pin")}
        >
          <PinIcon /> {t("note.pin")}
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={t("note.edit")}
          >
            <EditIcon /> {t("note.edit")}
          </Button>
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <FrontmatterTable data={result.data.frontmatter} />
        <ProseContent html={result.data.html} />
      </div>
    </>
  );
}
