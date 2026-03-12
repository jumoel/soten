import { atom } from "jotai";
import { store } from "../state/store";

export type Route =
  | { view: "home"; query?: string }
  | { view: "note"; path: string; draft?: string }
  | { view: "draft"; timestamp: string }
  | { view: "settings" };

export function parseHash(hash: string): Route {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;

  // Parse query params embedded in the hash fragment (e.g. #/foo.md?draft=123)
  const qIdx = raw.indexOf("?");
  const clean = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const hashParams = qIdx >= 0 ? new URLSearchParams(raw.slice(qIdx + 1)) : null;

  // Also check real query string for backwards compat
  const searchParams = new URLSearchParams(window.location.search);

  const query = hashParams?.get("q") ?? searchParams.get("q") ?? undefined;
  const draft = hashParams?.get("draft") ?? searchParams.get("draft") ?? undefined;

  if (clean === "/" || clean === "" || !clean) {
    // Standalone draft route: #/?draft=TIMESTAMP
    if (draft) return { view: "draft", timestamp: draft };
    return { view: "home", query };
  }

  if (clean === "/settings") {
    return { view: "settings" };
  }

  const path = clean.startsWith("/") ? clean.slice(1) : clean;
  return { view: "note", path, draft };
}

export const routeAtom = atom<Route>(parseHash(window.location.hash));

export function initRouter(): void {
  window.addEventListener("hashchange", () => {
    store.set(routeAtom, parseHash(window.location.hash));
  });
}
