import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/fs", () => ({
  wipeFs: vi.fn(),
  readRepoFiles: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("../lib/git", () => ({
  clone: vi.fn(),
  pull: vi.fn(),
  isInitialized: vi.fn(),
}));

vi.mock("../lib/github", () => ({
  fetchUserRepos: vi.fn(),
}));

vi.mock("./effects", () => ({
  runEffect: vi.fn(),
}));

import {
  transition,
  send,
  machineStateAtom,
  type AppMachineState,
  type TransitionContext,
} from "./machine";
import { store, cachedUserAtom, cachedRepoAtom } from "./store";
import { runEffect } from "./effects";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

const noCache: TransitionContext = { cachedRepo: null };

describe("transition", () => {
  describe("initializing", () => {
    const state: AppMachineState = { name: "initializing" };

    it("AUTHENTICATED → fetchingRepos", () => {
      const next = transition(state, { type: "AUTHENTICATED", user: mockUser }, noCache);
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("AUTH_ERROR → unauthenticated with error", () => {
      const next = transition(state, { type: "AUTH_ERROR", message: "bad_token" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: "bad_token" });
    });

    it("NO_AUTH → unauthenticated", () => {
      const next = transition(state, { type: "NO_AUTH" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SWITCH_REPO" }, noCache);
      expect(next).toBe(state);
    });
  });

  describe("unauthenticated", () => {
    const state: AppMachineState = { name: "unauthenticated", authError: null };

    it("AUTHENTICATED → fetchingRepos", () => {
      const next = transition(state, { type: "AUTHENTICATED", user: mockUser }, noCache);
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SWITCH_REPO" }, noCache);
      expect(next).toBe(state);
    });
  });

  describe("fetchingRepos", () => {
    const state: AppMachineState = { name: "fetchingRepos", user: mockUser };

    it("REPOS_LOADED with cached repo → loadingRepo", () => {
      const cachedRepo = { owner: "acme", repo: "notes" };
      const next = transition(
        state,
        { type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] },
        { cachedRepo },
      );
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo: cachedRepo,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("REPOS_LOADED with single repo → loadingRepo", () => {
      const next = transition(state, { type: "REPOS_LOADED", repos: ["acme/notes"] }, noCache);
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo: { owner: "acme", repo: "notes" },
        repos: ["acme/notes"],
      });
    });

    it("REPOS_LOADED with multiple repos and no cache → selectingRepo", () => {
      const next = transition(
        state,
        { type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] },
        noCache,
      );
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("REPOS_LOADED with stale cached repo → selectingRepo", () => {
      const next = transition(
        state,
        { type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] },
        { cachedRepo: { owner: "acme", repo: "old" } },
      );
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("FETCH_ERROR → error", () => {
      const next = transition(
        state,
        { type: "FETCH_ERROR", message: "Failed to fetch repos" },
        noCache,
      );
      expect(next).toEqual({ name: "error", user: mockUser, message: "Failed to fetch repos" });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("selectingRepo", () => {
    const state: AppMachineState = {
      name: "selectingRepo",
      user: mockUser,
      repos: ["acme/notes", "acme/wiki"],
    };

    it("SELECT_REPO → loadingRepo", () => {
      const repo = { owner: "acme", repo: "notes" };
      const next = transition(state, { type: "SELECT_REPO", repo }, noCache);
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("loadingRepo", () => {
    const state: AppMachineState = {
      name: "loadingRepo",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
    };

    it("REPO_READY → ready", () => {
      const files = { "/soten/a.md": { type: "text" as const, content: "# A" } };
      const next = transition(
        state,
        { type: "REPO_READY", filenames: ["/soten/a.md"], files },
        noCache,
      );
      expect(next).toEqual({
        name: "ready",
        user: mockUser,
        repo: { owner: "acme", repo: "notes" },
        repos: ["acme/notes"],
        filenames: ["/soten/a.md"],
        files,
      });
    });

    it("LOAD_ERROR → error", () => {
      const next = transition(state, { type: "LOAD_ERROR", message: "clone failed" }, noCache);
      expect(next).toEqual({ name: "error", user: mockUser, message: "clone failed" });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("ready", () => {
    const state: AppMachineState = {
      name: "ready",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
      filenames: ["/soten/a.md"],
      files: { "/soten/a.md": { type: "text", content: "# A" } },
    };

    it("SELECT_REPO → loadingRepo", () => {
      const repo = { owner: "acme", repo: "wiki" };
      const next = transition(state, { type: "SELECT_REPO", repo }, noCache);
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo,
        repos: ["acme/notes"],
      });
    });

    it("SWITCH_REPO → selectingRepo", () => {
      const next = transition(state, { type: "SWITCH_REPO" }, noCache);
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes"],
      });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("error", () => {
    const state: AppMachineState = {
      name: "error",
      user: mockUser,
      message: "something went wrong",
    };

    it("RETRY → fetchingRepos", () => {
      const next = transition(state, { type: "RETRY" }, noCache);
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SWITCH_REPO" }, noCache);
      expect(next).toBe(state);
    });
  });
});

describe("send", () => {
  beforeEach(() => {
    store.set(machineStateAtom, { name: "initializing" });
    store.set(cachedUserAtom, null);
    store.set(cachedRepoAtom, null);
    localStorage.clear();
    vi.mocked(runEffect).mockReset();
  });

  it("transitions state and calls runEffect", async () => {
    await send({ type: "AUTHENTICATED", user: mockUser });

    expect(store.get(machineStateAtom)).toEqual({ name: "fetchingRepos", user: mockUser });
    expect(runEffect).toHaveBeenCalledOnce();
  });

  it("does not call runEffect for invalid transitions", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await send({ type: "SWITCH_REPO" });

    expect(store.get(machineStateAtom)).toEqual({ name: "initializing" });
    expect(runEffect).not.toHaveBeenCalled();
  });

  it("syncs cachedUserAtom on auth", async () => {
    await send({ type: "AUTHENTICATED", user: mockUser });

    expect(store.get(cachedUserAtom)).toEqual(mockUser);
  });

  it("clears cache on logout", async () => {
    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });
    store.set(cachedUserAtom, mockUser);
    store.set(cachedRepoAtom, { owner: "acme", repo: "notes" });

    await send({ type: "LOGOUT" });

    expect(store.get(cachedUserAtom)).toBeNull();
    expect(store.get(cachedRepoAtom)).toBeNull();
  });

  it("passes cachedRepo from store as context to transition", async () => {
    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });
    store.set(cachedRepoAtom, { owner: "acme", repo: "notes" });

    await send({ type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] });

    const state = store.get(machineStateAtom);
    expect(state).toEqual({
      name: "loadingRepo",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes", "acme/wiki"],
    });
  });

  it("processes queued events sequentially", async () => {
    const order: string[] = [];

    vi.mocked(runEffect).mockImplementation(async (...args) => {
      order.push(`effect:${args[0].name}`);
      if (args[0].name === "fetchingRepos") {
        await args[3]({ type: "REPOS_LOADED", repos: ["acme/notes"] });
      }
    });

    await send({ type: "AUTHENTICATED", user: mockUser });

    expect(order).toEqual(["effect:fetchingRepos", "effect:loadingRepo"]);
    expect(store.get(machineStateAtom)).toEqual({
      name: "loadingRepo",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
    });
  });

  it("queued events see fresh state, not stale state", async () => {
    const statesSeenByEffect: string[] = [];

    vi.mocked(runEffect).mockImplementation(async (state) => {
      statesSeenByEffect.push(state.name);
    });

    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });

    const p1 = send({ type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] });
    const p2 = send({ type: "LOGOUT" });
    await p1;
    await p2;

    expect(statesSeenByEffect).toEqual(["selectingRepo", "unauthenticated"]);
    expect(store.get(machineStateAtom).name).toBe("unauthenticated");
  });

  it("recovers from thrown effect (draining resets)", async () => {
    vi.mocked(runEffect).mockRejectedValueOnce(new Error("effect exploded"));

    await expect(send({ type: "AUTHENTICATED", user: mockUser })).rejects.toThrow(
      "effect exploded",
    );

    vi.mocked(runEffect).mockReset();

    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });
    await send({ type: "LOGOUT" });

    expect(store.get(machineStateAtom)).toEqual({ name: "unauthenticated", authError: null });
  });
});
