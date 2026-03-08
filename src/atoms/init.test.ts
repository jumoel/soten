import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/github", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("./machine", () => ({
  send: vi.fn(),
}));

vi.mock("../lib/fs", () => ({
  readFile: vi.fn(),
  refreshFs: vi.fn(),
}));

vi.mock("../worker/client", () => {
  const mockWorker = {
    clone: vi.fn(),
    pull: vi.fn(),
    isInitialized: vi.fn(),
    readRepoFiles: vi.fn(),
    buildSearchIndex: vi.fn(),
    updateSearchIndex: vi.fn(),
    search: vi.fn(),
    clearSearchIndex: vi.fn(),
    listDraftBranches: vi.fn().mockResolvedValue([]),
  };
  return { getRepoWorker: () => mockWorker };
});

import { fetchCurrentUser } from "../lib/github";
import { send } from "./machine";
import { store, machineAtom, userAtom } from "./store";
import { parseAuthError, parseOAuthHash, init } from "./init";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

beforeEach(() => {
  store.set(machineAtom, { phase: "initializing" });
  store.set(userAtom, null);
  localStorage.clear();
  window.location.hash = "";
  vi.clearAllMocks();
});

describe("parseAuthError", () => {
  it("returns error string from hash", () => {
    window.location.hash = "#auth_error=something%20went%20wrong";

    expect(parseAuthError()).toBe("something went wrong");
  });

  it("returns null when hash is empty", () => {
    window.location.hash = "";

    expect(parseAuthError()).toBeNull();
  });

  it("returns null when hash has no auth_error param", () => {
    window.location.hash = "#other=value";

    expect(parseAuthError()).toBeNull();
  });
});

describe("parseOAuthHash", () => {
  it("returns user object when all four params are present", () => {
    window.location.hash =
      "#access_token=tok_123&username=testuser&email=test%40example.com&app_install_id=inst_456";

    expect(parseOAuthHash()).toEqual({
      username: "testuser",
      token: "tok_123",
      installationId: "inst_456",
      email: "test@example.com",
    });
  });

  it("returns null when access_token is missing", () => {
    window.location.hash = "#username=testuser&email=test%40example.com&app_install_id=inst_456";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when username is missing", () => {
    window.location.hash = "#access_token=tok_123&email=test%40example.com&app_install_id=inst_456";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when email is missing", () => {
    window.location.hash = "#access_token=tok_123&username=testuser&app_install_id=inst_456";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when app_install_id is missing", () => {
    window.location.hash = "#access_token=tok_123&username=testuser&email=test%40example.com";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when hash is empty", () => {
    window.location.hash = "";

    expect(parseOAuthHash()).toBeNull();
  });
});

describe("init", () => {
  it("handles auth error in hash", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    window.location.hash = "#auth_error=bad_token";

    await init();

    expect(store.get(machineAtom)).toEqual({ phase: "unauthenticated", authError: "bad_token" });
    expect(replaceState).toHaveBeenCalledWith(null, "", window.location.pathname);
    expect(send).not.toHaveBeenCalled();
  });

  it("handles OAuth params in hash", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    window.location.hash =
      "#access_token=tok_123&username=testuser&email=test%40example.com&app_install_id=inst_456";

    await init();

    expect(send).toHaveBeenCalledWith({
      type: "AUTHENTICATE",
      user: {
        username: "testuser",
        token: "tok_123",
        installationId: "inst_456",
        email: "test@example.com",
      },
    });
    expect(replaceState).toHaveBeenCalledWith(null, "", window.location.pathname);
  });

  it("re-authenticates returning user with valid token", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchCurrentUser).mockResolvedValue({ login: "testuser" });

    await init();

    expect(fetchCurrentUser).toHaveBeenCalledWith("tok_123");
    expect(send).toHaveBeenCalledWith({ type: "AUTHENTICATE", user: mockUser });
  });

  it("goes to unauthenticated when returning user has expired token", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchCurrentUser).mockResolvedValue(null);

    await init();

    expect(fetchCurrentUser).toHaveBeenCalledWith("tok_123");
    expect(store.get(machineAtom)).toEqual({ phase: "unauthenticated", authError: null });
    expect(store.get(userAtom)).toBeNull();
  });

  it("goes to unauthenticated when no cached user", async () => {
    await init();

    expect(store.get(machineAtom)).toEqual({ phase: "unauthenticated", authError: null });
    expect(send).not.toHaveBeenCalled();
  });

  it("goes to unauthenticated when fetchCurrentUser throws", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchCurrentUser).mockRejectedValue(new Error("network error"));

    await init();

    expect(store.get(machineAtom)).toEqual({ phase: "unauthenticated", authError: null });
    expect(store.get(userAtom)).toBeNull();
  });
});
