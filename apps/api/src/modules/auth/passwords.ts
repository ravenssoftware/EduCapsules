import { argon2id, argon2Verify } from "hash-wasm";

/**
 * Password hashing — SEC-023 (Argon2id preferred). Uses `hash-wasm`'s pure
 * WebAssembly Argon2id, not the classic native-addon `argon2`/`bcrypt`
 * packages: a native (N-API) binding cannot run inside a Cloudflare Workers
 * isolate at all (no filesystem, no native code loading), which is exactly
 * the portability cliff `docs/architecture/backend.md` §5/§6 and CON-01
 * exist to prevent. `hash-wasm` runs identically under Node (today) and
 * Workers (the eventual MVP target) with no code change — see
 * `docs/auth/authentication.md` §2 for the full reasoning, reported per the
 * Phase 4 instruction to flag portability decisions rather than silently
 * picking a runtime-specific implementation.
 *
 * Isolated in this one module (SEC-023's "keep it isolated so it can be
 * changed later" requirement) — every other module calls hashPassword /
 * verifyPassword, never a hashing primitive directly.
 */

// OWASP-recommended Argon2id baseline for an interactive login path as of
// 2026 (19 MiB memory, t=2, p=1) — deliberately modest so a single-VPS
// production deployment (CON-02) isn't CPU-starved under concurrent logins;
// revisit under real load testing (§43.1) rather than raising it blind.
const ARGON2ID_PARAMS = {
  parallelism: 1,
  iterations: 2,
  memorySize: 19 * 1024,
  hashLength: 32,
  outputType: "encoded" as const,
};

export async function hashPassword(plaintext: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return argon2id({ password: plaintext, salt, ...ARGON2ID_PARAMS });
}

/** Never throws on a bad password — returns false. Constant-time comparison is handled internally by hash-wasm's argon2Verify. */
export async function verifyPassword(plaintext: string, encodedHash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plaintext, hash: encodedHash });
  } catch {
    return false;
  }
}
