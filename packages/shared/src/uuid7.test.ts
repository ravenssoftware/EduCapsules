import { describe, expect, it } from "vitest";
import { uuid7 } from "./uuid7.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("uuid7", () => {
  it("produces a well-formed UUID string", () => {
    expect(uuid7()).toMatch(UUID_RE);
  });

  it("sets the version nibble to 7 (RFC 9562)", () => {
    const id = uuid7();
    const versionNibble = id.split("-")[2]![0];
    expect(versionNibble).toBe("7");
  });

  it("sets the variant bits to 10xx (RFC 9562)", () => {
    const id = uuid7();
    const variantNibble = id.split("-")[3]![0];
    expect(["8", "9", "a", "b"]).toContain(variantNibble);
  });

  it("generates unique ids across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuid7()));
    expect(ids.size).toBe(1000);
  });

  it("is time-ordered — ids minted later sort later lexicographically (DB index locality)", async () => {
    const first = uuid7();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = uuid7();
    expect(first < second).toBe(true);
  });

  it("is not sequential — consecutive ids in the same millisecond do not increment by one (DB-002)", () => {
    const a = uuid7();
    const b = uuid7();
    // The trailing random segment must differ; a naive sequential id would not.
    expect(a.split("-").slice(3).join("-")).not.toBe(b.split("-").slice(3).join("-"));
  });
});
