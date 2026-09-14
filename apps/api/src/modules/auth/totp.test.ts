import { describe, expect, it } from "vitest";
import {
  currentTotpCode,
  generateTotpSecret,
  totpProvisioningUri,
  verifyTotpCode,
} from "./totp.js";

describe("TOTP (RFC 6238)", () => {
  it("generates a distinct secret each time", () => {
    const secrets = new Set(Array.from({ length: 20 }, () => generateTotpSecret()));
    expect(secrets.size).toBe(20);
  });

  it("verifies the code it just generated for itself", async () => {
    const secret = generateTotpSecret();
    const code = await currentTotpCode(secret);
    expect(code).toMatch(/^\d{6}$/);
    await expect(verifyTotpCode(secret, code)).resolves.toBe(true);
  });

  it("rejects a code generated from a different secret", async () => {
    const secretA = generateTotpSecret();
    const secretB = generateTotpSecret();
    const codeForB = await currentTotpCode(secretB);
    await expect(verifyTotpCode(secretA, codeForB)).resolves.toBe(false);
  });

  it("rejects an obviously wrong code", async () => {
    const secret = generateTotpSecret();
    await expect(verifyTotpCode(secret, "000000")).resolves.toBe(false);
  });

  it("tolerates one step of clock drift in either direction", async () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const oneStepAgo = now - 30_000;
    const codeFromPast = await currentTotpCode(secret, oneStepAgo);
    await expect(verifyTotpCode(secret, codeFromPast, now)).resolves.toBe(true);
  });

  it("rejects a code from more than one step away", async () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const farInThePast = now - 5 * 30_000;
    const staleCode = await currentTotpCode(secret, farInThePast);
    await expect(verifyTotpCode(secret, staleCode, now)).resolves.toBe(false);
  });

  it("builds a well-formed otpauth:// provisioning URI", () => {
    const uri = totpProvisioningUri("JBSWY3DPEHPK3PXP", "teacher@example.test");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("issuer=EduCapsules");
  });
});
