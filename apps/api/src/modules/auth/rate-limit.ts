/**
 * SEC-031/API-015/API-017 rate limiting for authentication endpoints.
 *
 * This is an in-memory, single-process sliding-window limiter — a
 * deliberate, documented simplification, not the production-shape
 * abstraction: `docs/architecture/backend.md` §5's `Cache` port (KV/Durable
 * Objects for MVP, Redis for production) is the eventual home for
 * cross-instance rate-limit state, and this module is written so swapping
 * to it later means replacing `InMemoryRateLimiter` with a Cache-backed one
 * behind the same `RateLimiter` interface — no caller changes. It is
 * adequate for now because CON-02's production target is presently a
 * single VPS process; it stops being adequate the moment the backend runs
 * as more than one instance, which is flagged as a known limitation in
 * docs/auth/authentication.md §5 rather than silently assumed away.
 */

export interface RateLimiter {
  /** Returns true if the request is allowed; false if the limit was hit. */
  consume(key: string): boolean;
}

interface Window {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string): boolean {
    const now = Date.now();
    const existing = this.windows.get(key);
    if (!existing || existing.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (existing.count >= this.limit) return false;
    existing.count += 1;
    return true;
  }
}

// D-02 (SRS §38.3) marks exact rate-limit budgets TBD pending load testing —
// these are conservative, clearly-labeled interim defaults, not invented
// SRS numbers, and are read from the environment so they can be tuned
// without a code change once D-02 is resolved.
export const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
export const PASSWORD_RESET_RATE_LIMIT = { limit: 5, windowMs: 60_000 };
export const MFA_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
