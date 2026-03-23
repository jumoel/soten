const prettyDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const prettyDateTime = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatNoteDate(date: Date | null): string | null {
  if (!date) return null;
  const hasTime =
    date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0;
  return hasTime ? prettyDateTime.format(date) : prettyDate.format(date);
}

/**
 * Returns the line index where the body starts, skipping YAML frontmatter.
 * If there is no frontmatter, returns 0.
 */
export function frontmatterEndLine(lines: string[]): number {
  if (lines[0]?.startsWith("---")) {
    const end = lines.indexOf("---", 1);
    if (end > 0) return end + 1;
  }
  return 0;
}
