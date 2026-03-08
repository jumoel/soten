import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/github", () => ({
  fetchUserRepos: vi.fn(),
}));

vi.mock("../worker/client", () => {
  const mockWorker = {
    clone: vi.fn(),
    pull: vi.fn(),
    isInitialized: vi.fn(),
    readRepoFiles: vi.fn(),
    hasRemote: vi.fn().mockResolvedValue(true),
    buildSearchIndex: vi.fn(),
    updateSearchIndex: vi.fn(),
    search: vi.fn(),
    clearSearchIndex: vi.fn(),
    listDraftBranches: vi.fn().mockResolvedValue([]),
  };
  return { getRepoWorker: () => mockWorker };
});

vi.mock("../lib/fs", () => ({
  readFile: vi.fn(),
  refreshFs: vi.fn(),
}));

import { fetchUserRepos } from "../lib/github";
import { getRepoWorker } from "../worker/client";
import { refreshFs } from "../lib/fs";
import { send } from "./machine";
import { store, machineAtom, userAtom, selectedRepoAtom } from "./store";
import type { AppMachine } from "./store";

const worker = getRepoWorker();

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
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.readRepoFiles).mockResolvedValue(["/soten/a.md"]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    const m = machine();
    expect(m.phase).toBe("ready");
    if (m.phase !== "ready") return;
    expect(m.user).toEqual(mockUser);
    expect(m.repos).toEqual(["acme/notes"]);
    expect(m.selectedRepo).toEqual({ owner: "acme", repo: "notes" });
    expect(m.filenames).toEqual(["/soten/a.md"]);
    expect(worker.clone).toHaveBeenCalledWith("https://github.com/acme/notes.git", mockUser);
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
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.readRepoFiles).mockResolvedValue([]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    expect(machine().phase).toBe("ready");
    expect(worker.clone).toHaveBeenCalledWith("https://github.com/acme/notes.git", mockUser);
  });
});

describe("LOGOUT", () => {
  it("resets to unauthenticated and refreshes fs", async () => {
    store.set(machineAtom, {
      phase: "ready",
      user: mockUser,
      repos: ["acme/notes"],
      selectedRepo: { owner: "acme", repo: "notes" },
      filenames: [],
      hasRemote: true,
    });

    await send({ type: "LOGOUT" });

    expect(machine()).toEqual({ phase: "unauthenticated", authError: null });
    expect(store.get(userAtom)).toBeNull();
    expect(store.get(selectedRepoAtom)).toBeNull();
    expect(refreshFs).toHaveBeenCalled();
  });
});

describe("SELECT_REPO", () => {
  it("clones selected repo and reaches ready from selectingRepo", async () => {
    store.set(machineAtom, {
      phase: "selectingRepo",
      user: mockUser,
      repos: ["acme/notes", "acme/wiki"],
    });
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.readRepoFiles).mockResolvedValue(["/soten/readme.md"]);

    await send({ type: "SELECT_REPO", owner: "acme", repo: "notes" });

    const m = machine();
    expect(m.phase).toBe("ready");
    if (m.phase !== "ready") return;
    expect(m.selectedRepo).toEqual({ owner: "acme", repo: "notes" });
    expect(m.filenames).toEqual(["/soten/readme.md"]);
  });

  it("refreshes fs before cloning", async () => {
    store.set(machineAtom, {
      phase: "selectingRepo",
      user: mockUser,
      repos: ["acme/notes"],
    });
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.readRepoFiles).mockResolvedValue([]);

    const callOrder: string[] = [];
    vi.mocked(refreshFs).mockImplementation(() => {
      callOrder.push("refreshFs");
    });
    vi.mocked(worker.clone).mockImplementation(async () => {
      callOrder.push("clone");
    });

    await send({ type: "SELECT_REPO", owner: "acme", repo: "notes" });

    expect(callOrder.indexOf("refreshFs")).toBeLessThan(callOrder.indexOf("clone"));
  });
});

describe("RETRY", () => {
  it("re-enters authenticate flow from error", async () => {
    store.set(machineAtom, { phase: "error", message: "Failed", user: mockUser });
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.readRepoFiles).mockResolvedValue([]);

    await send({ type: "RETRY" });

    expect(machine().phase).toBe("ready");
  });

  it("refreshes fs before retrying", async () => {
    store.set(machineAtom, { phase: "error", message: "Failed", user: mockUser });
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.readRepoFiles).mockResolvedValue([]);

    await send({ type: "RETRY" });

    expect(refreshFs).toHaveBeenCalled();
  });
});

describe("error recovery", () => {
  it("falls back to clone when pull fails", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(worker.isInitialized).mockResolvedValue(true);
    vi.mocked(worker.pull).mockRejectedValue(new Error("corrupt"));
    vi.mocked(worker.clone).mockResolvedValue(undefined);
    vi.mocked(worker.readRepoFiles).mockResolvedValue([]);

    await send({ type: "AUTHENTICATE", user: mockUser });

    expect(worker.pull).toHaveBeenCalled();
    expect(refreshFs).toHaveBeenCalled();
    expect(worker.clone).toHaveBeenCalled();
    expect(machine().phase).toBe("ready");
  });

  it("goes to error when clone fails", async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);
    vi.mocked(worker.isInitialized).mockResolvedValue(false);
    vi.mocked(worker.clone).mockRejectedValue(new Error("network failure"));

    await send({ type: "AUTHENTICATE", user: mockUser });

    const m = machine();
    expect(m.phase).toBe("error");
    if (m.phase !== "error") return;
    expect(m.message).toBe("network failure");
  });
});
