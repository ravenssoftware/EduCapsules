import { randomRecoveryCode, sha256Hex } from "./crypto.js";

/**
 * AUTH-127: single-use backup codes issued at MFA enrolment, so a lost MFA
 * factor cannot permanently lock a user out of their own account. Hashed
 * with SHA-256 (not Argon2id): these are already high-entropy
 * machine-generated random values, not memorized secrets, so the slow/
 * memory-hard property Argon2id gives passwords protects against nothing
 * extra here and would needlessly slow down bulk generation — see
 * docs/auth/authentication.md §3.
 */

const RECOVERY_CODE_COUNT = 10;

export interface GeneratedRecoveryCodes {
  /** Shown to the user exactly once — never stored, never logged. */
  plaintextCodes: string[];
  /** What actually gets persisted. */
  hashes: string[];
}

export async function generateRecoveryCodes(): Promise<GeneratedRecoveryCodes> {
  const plaintextCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () => randomRecoveryCode());
  const hashes = await Promise.all(plaintextCodes.map((code) => sha256Hex(code)));
  return { plaintextCodes, hashes };
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return sha256Hex(code.trim().toUpperCase());
}
