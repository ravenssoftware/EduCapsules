import { base32Decode, base32Encode, hmacSha1 } from "./crypto.js";

/**
 * TOTP (RFC 6238) — the only first-class MFA factor decided for this
 * project (AUTH-126: passkeys/hardware keys/SSO are explicitly FUTURE; see
 * docs/architecture/auth-and-authorization.md §2). 30-second step, 6
 * digits, SHA-1 — the parameters every mainstream authenticator app
 * (Google Authenticator, Authy, Microsoft Authenticator, 1Password)
 * assumes by default.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20); // 160 bits, RFC 6238's recommended minimum
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/** otpauth:// provisioning URI for a QR code / manual entry, per the de facto Google Authenticator Key URI format. */
export function totpProvisioningUri(
  secretBase32: string,
  accountEmail: string,
  issuer = "EduCapsules",
): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

async function totpAt(secretBase32: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secretBase32);
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  // Counter is a 64-bit big-endian integer per RFC 4226; JS numbers are safe
  // up to 2^53, vastly beyond any realistic Unix-time-based counter value.
  view.setUint32(4, counter, false);
  const hmac = await hmacSha1(keyBytes, counterBytes);
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    (((hmac[offset]! & 0x7f) << 24) |
      ((hmac[offset + 1]! & 0xff) << 16) |
      ((hmac[offset + 2]! & 0xff) << 8) |
      (hmac[offset + 3]! & 0xff)) >>>
    0;
  const code = (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
  return code;
}

export async function currentTotpCode(secretBase32: string, now = Date.now()): Promise<string> {
  return totpAt(secretBase32, Math.floor(now / 1000 / STEP_SECONDS));
}

/**
 * Verifies a user-submitted code against a ±1 step window (90 seconds
 * total) to tolerate ordinary clock drift between server and phone, per
 * common TOTP-implementation practice — not itself an SRS-stated number,
 * flagged here as an implementation default rather than presented as a
 * traced requirement.
 */
export async function verifyTotpCode(
  secretBase32: string,
  submittedCode: string,
  now = Date.now(),
): Promise<boolean> {
  const counter = Math.floor(now / 1000 / STEP_SECONDS);
  const normalized = submittedCode.replace(/\s+/g, "");
  for (const drift of [0, -1, 1]) {
    const candidate = await totpAt(secretBase32, counter + drift);
    if (timingSafeEqual(candidate, normalized)) return true;
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
