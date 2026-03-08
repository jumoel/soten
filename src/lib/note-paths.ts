import { REPO_DIR } from "./constants";

export function timestampToPath(timestamp: string): string {
  return `${REPO_DIR}/${timestamp}.md`;
}

export function pathToTimestamp(path: string): string | null {
  const filename = path.split("/").pop();
  if (!filename?.endsWith(".md")) return null;
  const stem = filename.slice(0, -3);
  return /^\d+$/.test(stem) ? stem : null;
}
