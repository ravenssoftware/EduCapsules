import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords.js";

describe("password hashing (SEC-023 Argon2id)", () => {
  it("never stores the plaintext password in the hash output", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("produces a different hash each time for the same password (random salt)", async () => {
    const a = await hashPassword("same-password-123456");
    const b = await hashPassword("same-password-123456");
    expect(a).not.toBe(b);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("my-real-password-1234");
    await expect(verifyPassword("my-real-password-1234", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("my-real-password-1234");
    await expect(verifyPassword("wrong-password-123456", hash)).resolves.toBe(false);
  });

  it("returns false rather than throwing for a malformed hash", async () => {
    await expect(verifyPassword("anything", "not-a-real-hash")).resolves.toBe(false);
  });
});
