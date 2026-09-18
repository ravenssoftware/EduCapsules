import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { requireEnv, optionalEnv } from "./env.js";

describe("env", () => {
  const KEY = "EDUCAPSULES_TEST_VAR";

  beforeEach(() => {
    delete process.env[KEY];
  });

  afterEach(() => {
    delete process.env[KEY];
  });

  it("requireEnv returns the value when set", () => {
    process.env[KEY] = "value";
    expect(requireEnv(KEY)).toBe("value");
  });

  it("requireEnv throws when missing", () => {
    expect(() => requireEnv(KEY)).toThrow(/Missing required environment variable/);
  });

  it("optionalEnv falls back when unset", () => {
    expect(optionalEnv(KEY, "fallback")).toBe("fallback");
  });

  it("optionalEnv returns the set value over the fallback", () => {
    process.env[KEY] = "set";
    expect(optionalEnv(KEY, "fallback")).toBe("set");
  });
});
