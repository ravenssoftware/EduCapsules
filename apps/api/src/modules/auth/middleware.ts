import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { sha256Hex } from "./crypto.js";
import { requireValidSession } from "./service.js";
import { AUTH_ERROR_STATUS, AuthDomainError } from "./errors.js";
import type { AppEnv } from "../../types.js";
import type { InMemoryRateLimiter } from "./rate-limit.js";

const BEARER_PREFIX = "Bearer ";

/**
 * Authentication middleware — stage 1 of the §7 eleven-stage authorization
 * pipeline (docs/architecture/auth-and-authorization.md §2), and nothing
 * past it: it establishes *who* the caller is (`c.set("session", ...)`).
 * No route mounted behind it may treat that alone as permission to act —
 * Phase 5 owns the authorization stages this middleware deliberately stops
 * short of.
 */
export function requireSession(opts: { allowMfaSetup?: boolean } = {}): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const header = c.req.header("authorization");
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new HTTPException(401, { message: "Authentication required." });
    }
    const rawToken = header.slice(BEARER_PREFIX.length).trim();
    const repo = c.get("authRepository");
    try {
      const session = await requireValidSession(repo, rawToken, new Date(), opts);
      c.set("session", session);
    } catch (err) {
      if (err instanceof AuthDomainError) {
        throw new HTTPException(AUTH_ERROR_STATUS[err.code] as 400, { message: err.message });
      }
      throw err;
    }
    await next();
  };
}

/** SEC-031/API-017: per-IP-or-identity rate limiting for authentication endpoints, ahead of any credential check. */
export function rateLimit(
  limiter: InMemoryRateLimiter,
  keyOf: (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => string,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const key = keyOf(c);
    if (!limiter.consume(key)) {
      const repo = c.get("authRepository");
      await repo.writeSecurityEvent({
        organizationId: null,
        userId: null,
        eventType: "RATE_LIMIT_EXCEEDED",
        severity: "medium",
        ipHash: await ipHashFromRequest(c),
        userAgent: c.req.header("user-agent") ?? null,
        occurredAt: new Date(),
        details: null,
      });
      c.header("Retry-After", "60");
      throw new HTTPException(429, { message: "Too many requests. Try again later." });
    }
    await next();
  };
}

export async function ipHashFromRequest(
  c: Parameters<MiddlewareHandler<AppEnv>>[0],
): Promise<string | null> {
  // Never store a raw IP address (AUD-002 says "IP metadata where
  // appropriate", not the address itself) — only its hash, same treatment
  // as every ip_hash column in packages/db. CF-Connecting-IP first (the
  // real client IP once behind Cloudflare per §41.3/§41.4), falling back to
  // X-Forwarded-For for the current Node-only dev/CI runtime.
  const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? null;
  return ip ? sha256Hex(ip) : null;
}
