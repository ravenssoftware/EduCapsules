/**
 * Portable cryptographic primitives for the auth module — built entirely on
 * the Web Crypto API (`crypto.getRandomValues`, `crypto.subtle`), available
 * natively in both Node 22 (our current runtime, per `server.ts`) and
 * Cloudflare Workers (the SRS CON-01 MVP target, not yet wired up — see
 * `docs/architecture/backend.md` §6). No native (N-API) binding is used
 * anywhere in this module: a native addon like the classic `argon2`/`bcrypt`
 * packages cannot run inside a Workers isolate at all, which would silently
 * weld authentication to a single runtime the moment someone deployed this
 * code to the actual MVP target — see `docs/auth/authentication.md` §2 for
 * the full portability reasoning behind every choice in this file.
 */

const encoder = new TextEncoder();

/** A cryptographically random, URL-safe opaque token (AUTH-102) — used for session, password-reset and email-verification credentials. Never store this value itself (AUTH-103); store only `sha256Hex(token)`. */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** A shorter, human-typeable random code (AUTH-127 recovery codes) — grouped as XXXX-XXXX-XXXX from a 32-symbol Crockford-ish alphabet with no ambiguous characters. */
export function randomRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

/** SHA-256 hex digest — used to store only the hash of a bearer token/code, never the value itself (AUTH-103, AUTH-111). Not for passwords: see passwords.ts for why those need a memory-hard hash instead. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** RFC 4648 base32 (no padding) — the conventional encoding for a TOTP secret shown to a user / embedded in an otpauth:// provisioning URI. */
export function base32Encode(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/** HMAC-SHA1 via Web Crypto — RFC 6238's default TOTP algorithm (chosen for authenticator-app interop: Google/Microsoft/Authy all assume SHA-1 unless an app explicitly advertises otherwise). HMAC-SHA1's use as a MAC is not weakened by SHA-1's collision weaknesses, which only affect collision resistance, not MAC security. */
export async function hmacSha1(keyBytes: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, message);
  return new Uint8Array(signature);
}

/**
 * AES-256-GCM encrypt/decrypt for the MFA TOTP secret at rest
 * (mfa_factors.secret_ciphertext — see schema-overview.md §Auth). The key
 * comes from MFA_SECRET_ENCRYPTION_KEY (32 raw bytes, base64), read once by
 * the caller via @educapsules/shared's requireEnv — never hard-coded, never
 * committed. This stands in for a real secrets-manager reference (Table
 * 37.2's stated long-term shape) until one exists in this project; isolated
 * here so swapping it in later touches this one module.
 */
export async function aesGcmEncrypt(keyB64: string, plaintext: string): Promise<string> {
  const keyBytes = base64Decode(keyB64);
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext)),
  );
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return base64UrlEncode(combined);
}

export async function aesGcmDecrypt(keyB64: string, encoded: string): Promise<string> {
  const keyBytes = base64Decode(keyB64);
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const combined = base64UrlDecode(encoded);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

function base64Decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return base64Decode(padded + pad);
}
