import { describe, it, expect, beforeEach } from "vitest";
import { t, setLocale, registerLocale } from "./index";

beforeEach(() => {
  setLocale("en");
});

describe("t()", () => {
  it("returns the English string for a known key", () => {
    expect(t("auth.loginFailed")).toBe("Login failed");
  });

  it("interpolates parameters", () => {
    expect(t("auth.welcome", { username: "Jo" })).toBe("Welcome, Jo!");
  });

  it("leaves template intact when no params are given", () => {
    expect(t("auth.welcome")).toBe("Welcome, {username}!");
  });
});

describe("setLocale() / registerLocale()", () => {
  it("falls back to English for an unknown locale", () => {
    setLocale("xx");
    expect(t("auth.loginFailed")).toBe("Login failed");
  });

  it("uses registered translations", () => {
    registerLocale("test", { "auth.loginFailed": "Test-fejl" });
    setLocale("test");
    expect(t("auth.loginFailed")).toBe("Test-fejl");
  });

  it("falls back to English for missing keys in a partial locale", () => {
    registerLocale("partial", { "auth.loginFailed": "Partial" });
    setLocale("partial");
    expect(t("auth.logout")).toBe("Log out");
  });
});

describe("pluralization", () => {
  it("selects _one suffix when count is 1", () => {
    registerLocale("en-x-pluralone", {
      "note.loading": "fallback",
      "note.loading_one": "{count} item",
      "note.loading_other": "{count} items",
    });
    setLocale("en-x-pluralone");
    expect(t("note.loading", { count: 1 })).toBe("1 item");
  });

  it("selects _other suffix when count is not 1", () => {
    registerLocale("en-x-pluralother", {
      "note.loading": "fallback",
      "note.loading_one": "{count} item",
      "note.loading_other": "{count} items",
    });
    setLocale("en-x-pluralother");
    expect(t("note.loading", { count: 5 })).toBe("5 items");
  });

  it("falls back to base key when no plural suffix exists", () => {
    expect(t("auth.loginFailed", { count: 3 })).toBe("Login failed");
  });
});
