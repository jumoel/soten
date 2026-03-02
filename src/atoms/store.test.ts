import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./init.run", () => ({}));
vi.mock("../lib/fs", () => ({
  fs: {},
  readFile: vi.fn(),
  readRepoFiles: vi.fn(),
  wipeFs: vi.fn(),
}));

import { store } from "./store";
import { machineStateAtom, type AppMachineState, type Files } from "./machine";
import { noteListAtom } from "./globals";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

function makeReadyState(
  filenames: string[],
  files: Files,
): Extract<AppMachineState, { name: "ready" }> {
  return {
    name: "ready",
    user: mockUser,
    repo: { owner: "test", repo: "notes" },
    repos: ["test/notes"],
    filenames,
    files,
  };
}

beforeEach(() => {
  store.set(machineStateAtom, makeReadyState([], {}));
});

function setNote(relativePath: string, content: string | null) {
  const path = "/soten/" + relativePath;
  const files: Files = content ? { [path]: { type: "text", content } } : {};
  store.set(machineStateAtom, makeReadyState([path], files));
}

function getTitle() {
  return store.get(noteListAtom)[0].title;
}

describe("noteListAtom titles", () => {
  it("uses h1 from content when present", () => {
    setNote("anything.md", "# My Title");

    expect(getTitle()).toBe("My Title");
  });

  it("formats YYYY-MM-DD date filenames", () => {
    setNote("2024-01-15.md", null);

    expect(getTitle()).toBe("Day: January 15, 2024");
  });

  it("falls back to filename stem for non-timestamp names", () => {
    setNote("random-note.md", null);

    expect(getTitle()).toBe("Unnamed note \u00B7 random-note");
  });

  describe("timestamp filenames", () => {
    it("parses unix timestamp in seconds (10 digits)", () => {
      setNote("1704067200.md", null);

      expect(getTitle()).toBe("Unnamed note \u00B7 January 1, 2024 at 12:00 AM");
    });

    it("parses unix timestamp in milliseconds (13 digits)", () => {
      setNote("1704067200000.md", null);

      expect(getTitle()).toBe("Unnamed note \u00B7 January 1, 2024 at 12:00 AM");
    });

    it("parses compact datetime YYYYMMDDHHmmss (14 digits)", () => {
      setNote("20240115143000.md", null);

      expect(getTitle()).toBe("Unnamed note \u00B7 January 15, 2024 at 2:30 PM");
    });

    it("parses compact datetime YYYYMMDDHHmm (12 digits)", () => {
      setNote("202401151430.md", null);

      expect(getTitle()).toBe("Unnamed note \u00B7 January 15, 2024 at 2:30 PM");
    });

    it("rejects timestamps outside 2000-2100 range", () => {
      setNote("0000000001.md", null);

      expect(getTitle()).toBe("Unnamed note \u00B7 0000000001");
    });

    it("does not treat short digit strings as timestamps", () => {
      setNote("12345.md", null);

      expect(getTitle()).toBe("Unnamed note \u00B7 12345");
    });

    it("prefers h1 over timestamp parsing", () => {
      setNote("1704067200.md", "# Real Title");

      expect(getTitle()).toBe("Real Title");
    });
  });

  it("skips uploads/ files", () => {
    const path = "/soten/uploads/image.png";
    store.set(machineStateAtom, makeReadyState([path], {}));

    expect(store.get(noteListAtom)).toEqual([]);
  });

  it("uses relativePath as title for non-md files", () => {
    const path = "/soten/data.json";
    store.set(machineStateAtom, makeReadyState([path], {}));

    expect(store.get(noteListAtom)[0].title).toBe("data.json");
  });
});
