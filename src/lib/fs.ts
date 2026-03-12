import LightningFS from "@isomorphic-git/lightning-fs";

export const FILE_SYSTEM_NAME = "fs";
export const fs = new LightningFS(FILE_SYSTEM_NAME, { defer: true });
export const pfs = fs.promises;

export function refreshFs() {
  fs.init(FILE_SYSTEM_NAME);
}

function isImage(path: string) {
  return [".jpg", ".png", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"].some((ext) =>
    path.endsWith(ext),
  );
}

function mimeFromFilename(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    case "ico":
      return "image/x-icon";
    default:
      // Fallback for unknown/other types
      return "application/octet-stream";
  }
}

function loadImage(path: string, rawContent: Uint8Array) {
  const type = mimeFromFilename(path);

  const arrayBuffer =
    rawContent.buffer instanceof ArrayBuffer ? rawContent.buffer : rawContent.slice().buffer;

  return new Blob([arrayBuffer], { type });
}

export async function readFile(path: string) {
  try {
    const type = isImage(path) ? ("image" as const) : ("text" as const);

    if (type === "image") {
      const rawContent = await pfs.readFile(path);
      const content = loadImage(path, rawContent);

      return { type, content };
    } else {
      const content = await pfs.readFile(path, { encoding: "utf8" });

      return { type, content };
    }
  } catch {
    return null;
  }
}
