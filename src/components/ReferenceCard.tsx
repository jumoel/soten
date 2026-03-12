import { useEffect, useState } from "react";
import { IconButton, Text } from "../ds";
import { t } from "../i18n";
import { renderMarkdown } from "../markdown";

export type ReferenceMode = "collapsed" | "excerpt" | "expanded";

export type ReferenceCardProps = {
  title: string;
  date: string | null;
  content: string;
  mode: ReferenceMode;
  onChangeMode: (mode: ReferenceMode) => void;
  onDismiss: () => void;
};

function useRenderedMarkdown(content: string) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    renderMarkdown(content).then((result) => {
      if (!cancelled) setHtml(result.html);
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  return html;
}

function excerptContent(content: string, lines: number): string {
  const allLines = content.split("\n");
  let start = 0;
  if (allLines[0]?.startsWith("---")) {
    const end = allLines.indexOf("---", 1);
    if (end > 0) start = end + 1;
  }
  return allLines.slice(start, start + lines).join("\n");
}

export function ReferenceCard({
  title,
  date,
  content,
  mode,
  onChangeMode,
  onDismiss,
}: ReferenceCardProps) {
  const displayContent = mode === "excerpt" ? excerptContent(content, 10) : content;
  const html = useRenderedMarkdown(mode === "collapsed" ? "" : displayContent);

  return (
    <div className="bg-surface border border-edge rounded-md overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-edge">
        <button
          type="button"
          onClick={() =>
            onChangeMode(
              mode === "collapsed" ? "excerpt" : mode === "excerpt" ? "expanded" : "collapsed",
            )
          }
          className="flex-1 min-w-0 text-left flex items-center gap-2"
          aria-label={t("reference.toggleMode")}
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
        <div className="flex items-center gap-0.5 shrink-0">
          {mode !== "expanded" && (
            <IconButton
              icon="maximize"
              size="sm"
              aria-label={t("reference.expand")}
              onClick={() => onChangeMode("expanded")}
            />
          )}
          {mode !== "collapsed" && (
            <IconButton
              icon="minimize"
              size="sm"
              aria-label={t("reference.collapse")}
              onClick={() => onChangeMode("collapsed")}
            />
          )}
          <IconButton
            icon="close"
            size="sm"
            aria-label={t("reference.dismiss")}
            onClick={onDismiss}
          />
        </div>
      </div>
      {mode !== "collapsed" && (
        <div
          className={[
            "px-3 py-2 prose prose-sm max-w-none text-paper",
            mode === "expanded" ? "max-h-96 overflow-auto" : "max-h-48 overflow-hidden",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
