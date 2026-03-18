import { useEffect, useState } from "react";
import { renderMarkdown } from "../markdown";

export function useRenderedMarkdown(content: string) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!content) {
      setHtml("");
      return;
    }
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
