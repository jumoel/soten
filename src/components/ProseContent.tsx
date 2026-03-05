export function ProseContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={["prose prose-sm prose-gray", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
