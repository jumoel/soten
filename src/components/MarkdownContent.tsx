export function MarkdownContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-paper"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
