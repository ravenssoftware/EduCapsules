import { describe, expect, it } from "vitest";
import type { ObjectStore } from "../../ports/object-store.js";
import { InMemoryObjectStore } from "./in-memory-object-store.js";

/**
 * A contract test, not an implementation test: every `ObjectStore`
 * implementation must pass this suite. Only the in-memory fake exists yet;
 * the R2 and S3-compatible adapters (Phase 8) are added to this same
 * `implementations` array — never a separate, divergent test file — so
 * BE-008's "two implementations exercised in CI" is provable, not asserted.
 */
const implementations: Array<[string, () => ObjectStore]> = [
  ["InMemoryObjectStore", () => new InMemoryObjectStore()],
];

describe.each(implementations)("ObjectStore contract (%s)", (_name, factory) => {
  it("returns null for a key that was never put", async () => {
    const store = factory();
    expect(await store.get({ key: "missing" })).toBeNull();
    expect(await store.head({ key: "missing" })).toBeNull();
  });

  it("round-trips bytes through put/get", async () => {
    const store = factory();
    const body = new TextEncoder().encode("hello");
    await store.put({ key: "a" }, body, "text/plain");
    expect(await store.get({ key: "a" })).toEqual(body);
  });

  it("head reports size and content type without returning bytes", async () => {
    const store = factory();
    const body = new TextEncoder().encode("hello world");
    await store.put({ key: "a" }, body, "text/plain");
    const meta = await store.head({ key: "a" });
    expect(meta?.size).toBe(body.byteLength);
    expect(meta?.contentType).toBe("text/plain");
  });

  it("delete removes the object", async () => {
    const store = factory();
    await store.put({ key: "a" }, new Uint8Array([1]), "application/octet-stream");
    await store.delete({ key: "a" });
    expect(await store.get({ key: "a" })).toBeNull();
  });

  it("copy duplicates an object under a new key without deleting the original", async () => {
    const store = factory();
    const body = new Uint8Array([1, 2, 3]);
    await store.put({ key: "a" }, body, "application/octet-stream");
    await store.copy({ key: "a" }, { key: "b" });
    expect(await store.get({ key: "a" })).toEqual(body);
    expect(await store.get({ key: "b" })).toEqual(body);
  });

  it("signedUrl never returns the raw key as a durable public path (CNT-013)", async () => {
    const store = factory();
    await store.put({ key: "secret" }, new Uint8Array([1]), "application/octet-stream");
    const url = await store.signedUrl({ key: "secret" }, 60);
    expect(url).toContain("expires=");
  });
});
