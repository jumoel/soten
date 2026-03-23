export function MarkdownContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-paper [&_[data-wikilink]]:text-accent [&_[data-wikilink]]:no-underline [&_[data-wikilink]:hover]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
