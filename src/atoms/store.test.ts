import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/fs", () => ({
  readFile: vi.fn(),
}));

import type { AppMachine } from "./store";
import { machineAtom, noteListAtom, store } from "./store";

const baseUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

const baseReady: Extract<AppMachine, { phase: "ready" }> = {
  phase: "ready",
  user: baseUser,
  repos: ["acme/notes"],
  selectedRepo: { owner: "acme", repo: "notes" },
  filenames: [],
  hasRemote: true,
};

beforeEach(() => {
  store.set(machineAtom, { phase: "initializing" });
});

function setNote(relativePath: string) {
  const path = `/soten/${relativePath}`;
  store.set(machineAtom, { ...baseReady, filenames: [path] });
}

function getTitle() {
  return store.get(noteListAtom)[0].title;
}

describe("noteListAtom titles", () => {
  it("formats YYYY-MM-DD date filenames", () => {
    setNote("2024-01-15.md");

    expect(getTitle()).toBe("Day: January 15, 2024");
  });

  it("falls back to filename stem for non-timestamp names", () => {
    setNote("random-note.md");

    expect(getTitle()).toBe("Unnamed note \u00B7 random-note");
  });

  describe("timestamp filenames", () => {
    it("parses unix timestamp in seconds (10 digits)", () => {
      setNote("1704067200.md");

      expect(getTitle()).toBe("12:00 AM");
    });

    it("parses unix timestamp in milliseconds (13 digits)", () => {
      setNote("1704067200000.md");

      expect(getTitle()).toBe("12:00 AM");
    });

    it("parses compact datetime YYYYMMDDHHmmss (14 digits)", () => {
      setNote("20240115143000.md");

      expect(getTitle()).toBe("2:30 PM");
    });

    it("parses compact datetime YYYYMMDDHHmm (12 digits)", () => {
      setNote("202401151430.md");

      expect(getTitle()).toBe("2:30 PM");
    });

    it("rejects timestamps outside 2000-2100 range", () => {
      setNote("0000000001.md");

      expect(getTitle()).toBe("Unnamed note \u00B7 0000000001");
    });

    it("does not treat short digit strings as timestamps", () => {
      setNote("12345.md");

      expect(getTitle()).toBe("Unnamed note \u00B7 12345");
    });
  });

  it("skips uploads/ files", () => {
    const path = "/soten/uploads/image.png";
    store.set(machineAtom, { ...baseReady, filenames: [path] });

    expect(store.get(noteListAtom)).toEqual([]);
  });

  it("uses relativePath as title for non-md files", () => {
    const path = "/soten/data.json";
    store.set(machineAtom, { ...baseReady, filenames: [path] });

    expect(store.get(noteListAtom)[0].title).toBe("data.json");
  });

  it("returns empty array when not in ready phase", () => {
    store.set(machineAtom, { phase: "initializing" });

    expect(store.get(noteListAtom)).toEqual([]);
  });
});
