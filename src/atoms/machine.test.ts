import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/github", () => ({
  fetchUserRepos: vi.fn(),
}));

vi.mock("../lib/git", () => ({
  clone: vi.fn(),
  pull: vi.fn(),
  isInitialized: vi.fn(),
}));

vi.mock("../lib/fs", () => ({
  wipeFs: vi.fn(),
  readRepoFiles: vi.fn(),
  readFile: vi.fn(),
}));

import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readFile, readRepoFiles, wipeFs } from "../lib/fs";
import { send } from "./machine";
import { store, machineAtom, userAtom, selectedRepoAtom } from "./store";
import type { AppMachine } from "./store";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

beforeEach(() => {
  store.set(machineAtom, { phase: "initializing" });
  store.set(userAtom, null);
  store.set(selectedRepoAtom, null);
  localStorage.clear();
  vi.clearAllMocks();
});

function machine(): AppMachine {
  return store.get(machineAtom);
}

describe("AUTHENTICATE", () => {
  it("auto-clones single repo and reaches ready", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue(["/soten/a.md"]);
    vi.mocked(readFile).mockResolvedValue({ type: "text", content: "# Hello" });

    await send({ type: "AUTHENTICATE", user: mockUser });

    const m = machine();
    expect(m.phase).toBe("ready");
    if (m.phase !== "ready") return;
    expect(m.user).toEqual(mockUser);
    expect(m.repos).toEqual(["acme/notes"]);
    expect(m.selectedRepo).toEqual({ owner: "acme", repo: "notes" });
    expect(m.files).toEqual({ "/soten/a.md": { type: "text", content: "# Hello" } });
    expect(git.clone).toHaveBeenCalledWith("https://github.com/acme/notes.git", mockUser);
  });

  it("shows selectingRepo when multiple repos returned", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes", "acme/wiki"]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    const m = machine();
    expect(m.phase).toBe("selectingRepo");
    if (m.phase !== "selectingRepo") return;
    expect(m.repos).toEqual(["acme/notes", "acme/wiki"]);
    expect(m.user).toEqual(mockUser);
  });

  it("goes to error when fetchUserRepos returns null", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(null);

    await send({ type: "AUTHENTICATE", user: mockUser });

    expect(machine().phase).toBe("error");
  });

  it("goes to error when fetchUserRepos returns empty array", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue([]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    expect(machine().phase).toBe("error");
  });

  it("uses cached repo when valid", async () => {
    store.set(selectedRepoAtom, { owner: "acme", repo: "notes" });
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes", "acme/wiki"]);
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue([]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    expect(machine().phase).toBe("ready");
    expect(git.clone).toHaveBeenCalledWith("https://github.com/acme/notes.git", mockUser);
  });

  it("filters out files that fail to read", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue(["/soten/a.md", "/soten/bad.md"]);
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      if (path === "/soten/a.md") return { type: "text", content: "# A" };
      return null;
    });

    await send({ type: "AUTHENTICATE", user: mockUser });

    const m = machine();
    if (m.phase !== "ready") throw new Error("expected ready");
    expect(m.files).toEqual({ "/soten/a.md": { type: "text", content: "# A" } });
  });
});

describe("LOGOUT", () => {
  it("resets to unauthenticated and wipes fs", async () => {
    store.set(machineAtom, {
      phase: "ready",
      user: mockUser,
      repos: ["acme/notes"],
      selectedRepo: { owner: "acme", repo: "notes" },
      filenames: [],
      files: {},
    });

    await send({ type: "LOGOUT" });

    expect(machine()).toEqual({ phase: "unauthenticated", authError: null });
    expect(store.get(userAtom)).toBeNull();
    expect(store.get(selectedRepoAtom)).toBeNull();
    expect(wipeFs).toHaveBeenCalled();
  });
});

describe("SELECT_REPO", () => {
  it("clones selected repo and reaches ready from selectingRepo", async () => {
    store.set(machineAtom, {
      phase: "selectingRepo",
      user: mockUser,
      repos: ["acme/notes", "acme/wiki"],
    });
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue(["/soten/readme.md"]);
    vi.mocked(readFile).mockResolvedValue({ type: "text", content: "# Readme" });

    await send({ type: "SELECT_REPO", owner: "acme", repo: "notes" });

    const m = machine();
    expect(m.phase).toBe("ready");
    if (m.phase !== "ready") return;
    expect(m.selectedRepo).toEqual({ owner: "acme", repo: "notes" });
    expect(m.files).toEqual({ "/soten/readme.md": { type: "text", content: "# Readme" } });
  });

  it("wipes fs before cloning", async () => {
    store.set(machineAtom, {
      phase: "selectingRepo",
      user: mockUser,
      repos: ["acme/notes"],
    });
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue([]);

    const callOrder: string[] = [];
    vi.mocked(wipeFs).mockImplementation(() => {
      callOrder.push("wipeFs");
    });
    vi.mocked(git.clone).mockImplementation(async () => {
      callOrder.push("clone");
    });

    await send({ type: "SELECT_REPO", owner: "acme", repo: "notes" });

    expect(callOrder.indexOf("wipeFs")).toBeLessThan(callOrder.indexOf("clone"));
  });
});

describe("SWITCH_REPO", () => {
  it("goes to selectingRepo from ready", async () => {
    store.set(machineAtom, {
      phase: "ready",
      user: mockUser,
      repos: ["acme/notes", "acme/wiki"],
      selectedRepo: { owner: "acme", repo: "notes" },
      filenames: [],
      files: {},
    });

    await send({ type: "SWITCH_REPO" });

    const m = machine();
    expect(m.phase).toBe("selectingRepo");
    if (m.phase !== "selectingRepo") return;
    expect(m.repos).toEqual(["acme/notes", "acme/wiki"]);
  });
});

describe("RETRY", () => {
  it("re-enters authenticate flow from error", async () => {
    store.set(machineAtom, { phase: "error", message: "Failed", user: mockUser });
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue([]);

    await send({ type: "RETRY" });

    expect(machine().phase).toBe("ready");
  });

  it("wipes fs before retrying", async () => {
    store.set(machineAtom, { phase: "error", message: "Failed", user: mockUser });
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue([]);

    await send({ type: "RETRY" });

    expect(wipeFs).toHaveBeenCalled();
  });
});

describe("error recovery", () => {
  it("falls back to wipe + clone when pull fails", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(git.isInitialized).mockResolvedValue(true);
    vi.mocked(git.pull).mockRejectedValue(new Error("corrupt"));
    vi.mocked(git.clone).mockResolvedValue(undefined);
    vi.mocked(readRepoFiles).mockResolvedValue([]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    expect(git.pull).toHaveBeenCalled();
    expect(wipeFs).toHaveBeenCalled();
    expect(git.clone).toHaveBeenCalled();
    expect(machine().phase).toBe("ready");
  });

  it("goes to error when clone fails", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(git.clone).mockRejectedValue(new Error("network failure"));

    await send({ type: "AUTHENTICATE", user: mockUser });

    const m = machine();
    expect(m.phase).toBe("error");
    if (m.phase !== "error") return;
    expect(m.message).toBe("network failure");
  });
});
