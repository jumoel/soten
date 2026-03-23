import { atom } from "jotai";
import { store } from "../state/store";

export type Route =
  | { view: "home"; query?: string; calFrom?: string; calTo?: string; calMonth?: string }
  | {
      view: "note";
      path: string;
      draft?: string;
      query?: string;
      calFrom?: string;
      calTo?: string;
      calMonth?: string;
    }
  | {
      view: "draft";
      timestamp: string;
      query?: string;
      calFrom?: string;
      calTo?: string;
      calMonth?: string;
    }
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
  const calFrom = hashParams?.get("from") ?? undefined;
  const calTo = hashParams?.get("to") ?? undefined;
  const calMonth = hashParams?.get("month") ?? undefined;

  if (clean === "/" || clean === "" || !clean) {
    // Standalone draft route: #/?draft=TIMESTAMP
    if (draft) return { view: "draft", timestamp: draft, query, calFrom, calTo, calMonth };
    return { view: "home", query, calFrom, calTo, calMonth };
  }

  if (clean === "/settings") {
    return { view: "settings" };
  }

  const path = clean.startsWith("/") ? clean.slice(1) : clean;
  return { view: "note", path, draft, query, calFrom, calTo, calMonth };
}

export function buildHash(path?: string, params?: Record<string, string | undefined>): string {
  const base = path ? `#/${path}` : "#/";
  const entries = Object.entries(params ?? {}).filter(
    (kv): kv is [string, string] => kv[1] !== undefined && kv[1] !== "",
  );
  if (entries.length === 0) return base;
  const qs = new URLSearchParams(entries).toString();
  return `${base}?${qs}`;
}

export const routeAtom = atom<Route>(parseHash(window.location.hash));

export function initRouter(): void {
  window.addEventListener("hashchange", () => {
    store.set(routeAtom, parseHash(window.location.hash));
  });
}
