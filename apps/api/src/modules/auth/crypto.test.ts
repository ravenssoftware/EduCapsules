import { describe, expect, it } from "vitest";
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  base32Decode,
  base32Encode,
  bytesToHex,
  hmacSha1,
  randomRecoveryCode,
  randomToken,
  sha256Hex,
} from "./crypto.js";

describe("randomToken", () => {
  it("generates cryptographically distinct URL-safe tokens (AUTH-102)", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => randomToken(32)));
    expect(tokens.size).toBe(200);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe("randomRecoveryCode", () => {
  it("generates distinct, grouped, unambiguous-alphabet codes", () => {
    const codes = new Set(Array.from({ length: 200 }, () => randomRecoveryCode()));
    expect(codes.size).toBe(200);
    for (const code of codes) {
      expect(code).toMatch(
        /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/,
      );
    }
  });
});

describe("sha256Hex", () => {
  it("matches a known SHA-256 test vector", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is deterministic", async () => {
    expect(await sha256Hex("hello")).toBe(await sha256Hex("hello"));
  });
});

describe("base32 encode/decode", () => {
  it("round-trips arbitrary byte sequences", () => {
    for (const len of [1, 10, 20, 33]) {
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      const roundTripped = base32Decode(base32Encode(bytes));
      expect(bytesToHex(roundTripped)).toBe(bytesToHex(bytes));
    }
  });
});

describe("hmacSha1", () => {
  it("matches RFC 2202 HMAC-SHA1 test case 1", async () => {
    const key = new Uint8Array(20).fill(0x0b);
    const message = new TextEncoder().encode("Hi There");
    const result = await hmacSha1(key, message);
    expect(bytesToHex(result)).toBe("b617318655057264e28bc0b6fb378c8ef146be00");
  });
});

describe("AES-GCM encrypt/decrypt", () => {
  it("round-trips plaintext and produces different ciphertext each time (random IV)", async () => {
    const key = Buffer.from(new Uint8Array(32).map((_, i) => i)).toString("base64");
    const a = await aesGcmEncrypt(key, "top secret TOTP seed");
    const b = await aesGcmEncrypt(key, "top secret TOTP seed");
    expect(a).not.toBe(b);
    expect(await aesGcmDecrypt(key, a)).toBe("top secret TOTP seed");
    expect(await aesGcmDecrypt(key, b)).toBe("top secret TOTP seed");
  });

  it("fails to decrypt with the wrong key", async () => {
    const key1 = Buffer.from(new Uint8Array(32).fill(1)).toString("base64");
    const key2 = Buffer.from(new Uint8Array(32).fill(2)).toString("base64");
    const ciphertext = await aesGcmEncrypt(key1, "secret");
    await expect(aesGcmDecrypt(key2, ciphertext)).rejects.toThrow();
  });
});
