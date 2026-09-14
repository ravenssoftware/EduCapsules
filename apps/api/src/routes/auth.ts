import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { optionalEnv } from "@educapsules/shared";
import type { AppEnv } from "../types.js";
import { AuthDomainError, type AuthErrorCode } from "../modules/auth/errors.js";
import { ipHashFromRequest, rateLimit, requireSession } from "../modules/auth/middleware.js";
import {
  InMemoryRateLimiter,
  LOGIN_RATE_LIMIT,
  MFA_RATE_LIMIT,
  PASSWORD_RESET_RATE_LIMIT,
} from "../modules/auth/rate-limit.js";
import * as authService from "../modules/auth/service.js";
import type { RequestContext } from "../modules/auth/service.js";

/**
 * /api/v1/auth (SRS Table 38.2's /auth resource group) — API-002 versioned
 * path, mounted at that prefix by app.ts. Every route here is on API-003's
 * public allow-list except the session-management and MFA-management ones,
 * which require requireSession() (stage 1 of the §7 pipeline only — see
 * that middleware's own doc comment for why this is not authorization).
 */

const ERROR_STATUS: Record<AuthErrorCode, number> = {
  invalid_credentials: 401,
  account_locked: 423,
  account_not_active: 403,
  email_not_verified: 403,
  mfa_required: 401,
  mfa_invalid: 400,
  session_invalid: 401,
  token_invalid: 400,
  email_already_registered: 409,
  validation_failed: 422,
  rate_limited: 429,
};

function toHttpException(err: unknown): HTTPException {
  if (err instanceof AuthDomainError) {
    return new HTTPException(ERROR_STATUS[err.code] as 400, { message: err.message });
  }
  throw err;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch {
    throw new HTTPException(422, { message: "Request body must be valid JSON." });
  }
}

function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new HTTPException(422, { message: `"${field}" is required.` });
  }
  return value;
}

function optionalString(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field];
  return typeof value === "string" ? value : undefined;
}

async function requestContext(c: Context<AppEnv>): Promise<RequestContext> {
  return {
    ipHash: await ipHashFromRequest(c),
    userAgent: c.req.header("user-agent") ?? null,
    deviceFingerprint: c.req.header("x-device-fingerprint") ?? null,
  };
}

// Dev-only convenience: without a real MailSender (docs/architecture/backend.md
// §1's Integration layer — not built in Phase 4), the raw verification/reset
// token is returned in the response ONLY when NODE_ENV isn't "production",
// so local development and tests can exercise the full flow without a mail
// server. In production this field is always omitted — see
// docs/auth/authentication.md §6.
function isProduction(): boolean {
  return optionalEnv("NODE_ENV", "development") === "production";
}

export const auth = new Hono<AppEnv>();

const loginLimiter = new InMemoryRateLimiter(LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowMs);
const resetLimiter = new InMemoryRateLimiter(
  PASSWORD_RESET_RATE_LIMIT.limit,
  PASSWORD_RESET_RATE_LIMIT.windowMs,
);
const mfaLimiter = new InMemoryRateLimiter(MFA_RATE_LIMIT.limit, MFA_RATE_LIMIT.windowMs);

const byIp = (c: Context<AppEnv>) =>
  c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";

auth.post("/register", async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  try {
    const { rawVerificationToken } = await authService.register(repo, {
      organizationId: requireString(body, "organizationId"),
      email: requireString(body, "email"),
      password: requireString(body, "password"),
      locale: optionalString(body, "locale") ?? "en",
      timezone: optionalString(body, "timezone") ?? "UTC",
    });
    return c.json(
      {
        status: "registered",
        message: "Check your email to verify your account.",
        ...(isProduction() ? {} : { devVerificationToken: rawVerificationToken }),
      },
      201,
    );
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/verify-email", async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  try {
    await authService.verifyEmail(repo, requireString(body, "token"));
    return c.json({ status: "verified" });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/login", rateLimit(loginLimiter, byIp), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const ctx = await requestContext(c);
  try {
    const result = await authService.login(
      repo,
      {
        organizationId: requireString(body, "organizationId"),
        email: requireString(body, "email"),
        password: requireString(body, "password"),
      },
      ctx,
    );
    if (result.outcome === "mfa_required") {
      return c.json({ status: "mfa_required", mfaChallengeToken: result.rawChallengeToken }, 200);
    }
    return c.json(
      { status: "authenticated", sessionToken: result.rawToken, userId: result.user.id },
      200,
    );
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/mfa/verify", rateLimit(mfaLimiter, byIp), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const ctx = await requestContext(c);
  try {
    const result = await authService.verifyMfaChallenge(
      repo,
      {
        rawChallengeToken: requireString(body, "mfaChallengeToken"),
        code: requireString(body, "code"),
        isRecoveryCode: body.isRecoveryCode === true,
      },
      ctx,
    );
    return c.json({
      status: "authenticated",
      sessionToken: result.rawToken,
      userId: result.user.id,
    });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/logout", requireSession(), async (c) => {
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  await authService.logout(repo, session);
  return c.json({ status: "logged_out" });
});

auth.post("/logout-all", requireSession(), async (c) => {
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  await authService.logoutAll(repo, session);
  return c.json({ status: "logged_out" });
});

auth.post("/refresh", requireSession(), async (c) => {
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  const { rawToken } = await authService.refreshSession(repo, session);
  return c.json({ status: "refreshed", sessionToken: rawToken });
});

auth.get("/sessions", requireSession(), async (c) => {
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  const sessions = await authService.listSessions(repo, session);
  return c.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      sessionType: s.sessionType,
      deviceFingerprint: s.deviceFingerprint,
      userAgent: s.userAgent,
      issuedAt: s.issuedAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      isCurrent: s.id === session.id,
    })),
  });
});

auth.delete("/sessions/:id", requireSession(), async (c) => {
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  try {
    await authService.revokeSessionById(repo, session, c.req.param("id"));
    return c.json({ status: "revoked" });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/password/forgot", rateLimit(resetLimiter, byIp), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  // AUTH-122: identical response whether or not the email is registered.
  const rawToken = await authService.forgotPassword(repo, {
    organizationId: requireString(body, "organizationId"),
    email: requireString(body, "email"),
    ipHash: await ipHashFromRequest(c),
  });
  return c.json({
    status: "if_registered_email_sent",
    ...(isProduction() || rawToken === null ? {} : { devResetToken: rawToken }),
  });
});

auth.post("/password/reset", rateLimit(resetLimiter, byIp), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const ctx = await requestContext(c);
  try {
    const result = await authService.resetPassword(
      repo,
      { rawToken: requireString(body, "token"), newPassword: requireString(body, "newPassword") },
      ctx,
    );
    return c.json({
      status: "password_reset",
      sessionToken: result.rawSessionToken,
      userId: result.user.id,
    });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/password/change", requireSession(), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  const ctx = await requestContext(c);
  try {
    const result = await authService.changePassword(
      repo,
      session,
      {
        currentPassword: requireString(body, "currentPassword"),
        newPassword: requireString(body, "newPassword"),
      },
      ctx,
    );
    return c.json({ status: "password_changed", sessionToken: result.rawSessionToken });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/mfa/enroll", requireSession(), async (c) => {
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  const { secretBase32, provisioningUri } = await authService.enrollMfa(
    repo,
    session.organizationId,
    session.userId,
  );
  return c.json({ secret: secretBase32, provisioningUri });
});

auth.post("/mfa/confirm", requireSession(), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  const ctx = await requestContext(c);
  try {
    const { recoveryCodes } = await authService.confirmMfa(
      repo,
      session.organizationId,
      session.userId,
      requireString(body, "code"),
      ctx,
    );
    return c.json({ status: "mfa_enabled", recoveryCodes });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/mfa/disable", requireSession(), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  const ctx = await requestContext(c);
  try {
    await authService.disableMfa(repo, session, requireString(body, "currentPassword"), ctx);
    return c.json({ status: "mfa_disabled" });
  } catch (err) {
    throw toHttpException(err);
  }
});

auth.post("/mfa/recovery-codes/regenerate", requireSession(), async (c) => {
  const body = await readJsonBody(c.req.raw);
  const repo = c.get("authRepository");
  const session = c.get("session")!;
  try {
    const recoveryCodes = await authService.regenerateRecoveryCodes(
      repo,
      session.organizationId,
      session.userId,
      requireString(body, "currentPassword"),
    );
    return c.json({ recoveryCodes });
  } catch (err) {
    throw toHttpException(err);
  }
});
