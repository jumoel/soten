export function ProseContent({ html, animate }: { html: string; animate?: boolean }) {
  const classes = ["prose prose-sm prose-gray", animate && "animate-fade-in"]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
}
