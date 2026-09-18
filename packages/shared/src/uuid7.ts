/**
 * UUIDv7 (RFC 9562) — the external-identifier format SRS DB-002 requires:
 * "Any identifier exposed in a URL, an API response or a share link shall
 * be non-sequential (UUIDv7 or ULID)." UUIDv7 is time-ordered (good B-tree
 * locality for the database) but not sequential in the auto-increment
 * sense — an attacker cannot enumerate rows by incrementing an id, and two
 * ids minted in the same millisecond are unrelated except by chance.
 *
 * Implemented directly on the Web Crypto API (`crypto.getRandomValues`),
 * available unmodified on both Cloudflare Workers and Node 22+ — no
 * platform-specific dependency, consistent with the portability directive
 * (docs/decisions/02-assumptions-register.md A-13).
 */
export function uuid7(): string {
  const unixMs = BigInt(Date.now());
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  const bytes = new Uint8Array(16);

  // 48-bit big-endian timestamp (bytes 0-5)
  bytes[0] = Number((unixMs >> 40n) & 0xffn);
  bytes[1] = Number((unixMs >> 32n) & 0xffn);
  bytes[2] = Number((unixMs >> 24n) & 0xffn);
  bytes[3] = Number((unixMs >> 16n) & 0xffn);
  bytes[4] = Number((unixMs >> 8n) & 0xffn);
  bytes[5] = Number(unixMs & 0xffn);

  // Version 7 in the high nibble of byte 6; 12 bits of randomness (rand_a)
  bytes[6] = 0x70 | (randomBytes[0]! & 0x0f);
  bytes[7] = randomBytes[1]!;

  // Variant 10 in the top two bits of byte 8; 62 bits of randomness (rand_b)
  bytes[8] = 0x80 | (randomBytes[2]! & 0x3f);
  bytes[9] = randomBytes[3]!;
  bytes[10] = randomBytes[4]!;
  bytes[11] = randomBytes[5]!;
  bytes[12] = randomBytes[6]!;
  bytes[13] = randomBytes[7]!;
  bytes[14] = randomBytes[8]!;
  bytes[15] = randomBytes[9]!;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
