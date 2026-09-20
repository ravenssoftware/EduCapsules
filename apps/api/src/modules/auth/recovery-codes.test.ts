import { describe, expect, it } from "vitest";
import { generateRecoveryCodes, hashRecoveryCode } from "./recovery-codes.js";

describe("MFA recovery codes (AUTH-127)", () => {
  it("generates 10 distinct codes with matching hashes", async () => {
    const { plaintextCodes, hashes } = await generateRecoveryCodes();
    expect(plaintextCodes).toHaveLength(10);
    expect(new Set(plaintextCodes).size).toBe(10);
    expect(hashes).toHaveLength(10);
    expect(new Set(hashes).size).toBe(10);
  });

  it("never returns the plaintext codes inside the hash values", async () => {
    const { plaintextCodes, hashes } = await generateRecoveryCodes();
    for (const hash of hashes) {
      for (const code of plaintextCodes) {
        expect(hash).not.toBe(code);
      }
    }
  });

  it("hashRecoveryCode reproduces one of the generated hashes for its own code", async () => {
    const { plaintextCodes, hashes } = await generateRecoveryCodes();
    const recomputed = await hashRecoveryCode(plaintextCodes[0]!);
    expect(recomputed).toBe(hashes[0]);
  });

  it("is case-insensitive and trims whitespace", async () => {
    const { plaintextCodes, hashes } = await generateRecoveryCodes();
    const messy = `  ${plaintextCodes[0]!.toLowerCase()}  `;
    expect(await hashRecoveryCode(messy)).toBe(hashes[0]);
  });
});
