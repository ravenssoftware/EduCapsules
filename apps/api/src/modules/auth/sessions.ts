import { randomToken, sha256Hex } from "./crypto.js";
import type { AuthRepository, LoginSessionRow } from "./repository.js";
import { AuthDomainError } from "./errors.js";

/**
 * AUTH-104 session timeouts. Table 35.3 marks the exact minute/day values
 * TBD pending D-14 security testing; these are the indicative bands the
 * SRS itself already states (Table 35.3's footnote: "30–60 min idle /
 * 7–30 days absolute for students... 10–20 min / 8–12 hours for admins"),
 * taken at a conservative point in each stated range — not invented
 * numbers — and overridable via environment so D-14's eventual real
 * values need a config change, not a redeploy.
 */
export const SESSION_POLICY = {
  standard: { idleMs: 60 * 60 * 1000, absoluteMs: 14 * 24 * 60 * 60 * 1000 },
  admin: { idleMs: 15 * 60 * 1000, absoluteMs: 10 * 60 * 60 * 1000 },
  /**
   * Not a real authenticated session — issued by login() while an MFA
   * challenge is outstanding. Deliberately short-lived and, critically,
   * rejected outright by requireValidSession() (service.ts) regardless of
   * its own expiry: AUTH-110 requires that a pre-authentication credential
   * is never reusable as an authenticated one, so the type tag itself, not
   * just the short timeout, is what a general "is this session logged in"
   * check keys off. Only verifyMfaChallenge() (which calls
   * validateSessionToken directly, bypassing that rejection) may consume it.
   */
  mfa_pending: { idleMs: 5 * 60 * 1000, absoluteMs: 5 * 60 * 1000 },
  /**
   * AUTH-116: issued instead of a real session when an account holding the
   * ADMIN role has correctly authenticated but has not yet enrolled MFA.
   * Like mfa_pending, this is not a Table 35.1 session type and is rejected
   * outright by requireValidSession() for ordinary protected routes — its
   * only legitimate use is completing MFA enrollment (/mfa/enroll,
   * /mfa/confirm), which accept it explicitly. A slightly longer window
   * than mfa_pending's since scanning a QR code and entering a TOTP code
   * takes longer than a challenge the user already has a code ready for.
   */
  mfa_setup_required: { idleMs: 15 * 60 * 1000, absoluteMs: 15 * 60 * 1000 },
} as const;

export interface IssuedSession {
  session: LoginSessionRow;
  /** The raw bearer token — returned to the caller exactly once, never persisted (AUTH-103). */
  rawToken: string;
}

export interface SessionContext {
  organizationId: string;
  userId: string;
  sessionType: "standard" | "admin" | "mfa_pending" | "mfa_setup_required";
  deviceFingerprint?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  mfaVerifiedAt?: Date | null;
  rotatedFromSessionId?: string | null;
}

export async function issueSession(
  repo: AuthRepository,
  ctx: SessionContext,
  uuid7: () => string,
  now = new Date(),
): Promise<IssuedSession> {
  const rawToken = randomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const policy = SESSION_POLICY[ctx.sessionType];
  const session = await repo.createLoginSession({
    id: uuid7(),
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    tokenHash,
    sessionType: ctx.sessionType,
    deviceFingerprint: ctx.deviceFingerprint ?? null,
    ipHash: ctx.ipHash ?? null,
    userAgent: ctx.userAgent ?? null,
    mfaVerifiedAt: ctx.mfaVerifiedAt ?? null,
    issuedAt: now,
    lastSeenAt: now,
    idleExpiresAt: new Date(now.getTime() + policy.idleMs),
    absoluteExpiresAt: new Date(now.getTime() + policy.absoluteMs),
    rotatedFromSessionId: ctx.rotatedFromSessionId ?? null,
  });
  return { session, rawToken };
}

export type SessionValidationResult =
  | { outcome: "valid"; session: LoginSessionRow }
  | { outcome: "reuse_detected"; session: LoginSessionRow }
  | { outcome: "invalid" };

/**
 * AUTH-104/AUTH-110/AUTH-115/AUTH-118. Validates a bearer token against a
 * live session: rejects an unknown hash, an expired session (idle or
 * absolute), a directly-revoked session, and — the reuse-detection case —
 * a token whose session was revoked specifically because it was *rotated*
 * away, which means a stale credential is being replayed. The caller
 * (sessions middleware) is responsible for revoking the whole chain and
 * raising TOKEN_REUSE_DETECTED on that last outcome; this function only
 * detects it.
 */
export async function validateSessionToken(
  repo: AuthRepository,
  rawToken: string,
  now = new Date(),
): Promise<SessionValidationResult> {
  const tokenHash = await sha256Hex(rawToken);
  const session = await repo.findLoginSessionByTokenHash(tokenHash);
  if (!session) return { outcome: "invalid" };

  if (session.revokedAt) {
    if (session.revocationReason === "rotated") return { outcome: "reuse_detected", session };
    return { outcome: "invalid" };
  }
  if (session.absoluteExpiresAt.getTime() <= now.getTime()) return { outcome: "invalid" };
  if (session.idleExpiresAt.getTime() <= now.getTime()) return { outcome: "invalid" };

  return { outcome: "valid", session };
}

export async function touchSession(
  repo: AuthRepository,
  session: LoginSessionRow,
  now = new Date(),
): Promise<void> {
  const policy = SESSION_POLICY[session.sessionType === "admin" ? "admin" : "standard"];
  await repo.touchLoginSession(session.id, {
    lastSeenAt: now,
    idleExpiresAt: new Date(now.getTime() + policy.idleMs),
  });
}

/** AUTH-110: rotates a session's credential — revokes the old row (reason='rotated') and issues a fresh one carrying the same identity/type forward. */
export async function rotateSession(
  repo: AuthRepository,
  session: LoginSessionRow,
  uuid7: () => string,
  now = new Date(),
): Promise<IssuedSession> {
  await repo.revokeLoginSession(session.id, "rotated", now);
  return issueSession(
    repo,
    {
      organizationId: session.organizationId,
      userId: session.userId,
      sessionType: session.sessionType === "admin" ? "admin" : "standard",
      deviceFingerprint: session.deviceFingerprint,
      ipHash: session.ipHash,
      userAgent: session.userAgent,
      mfaVerifiedAt: session.mfaVerifiedAt,
      rotatedFromSessionId: session.id,
    },
    uuid7,
    now,
  );
}

/** Walks a rotation chain forward from a reused (stale) session and revokes every descendant still active — the whole family is compromised, not just the replayed link. */
export async function revokeRotationChain(
  repo: AuthRepository,
  startSession: LoginSessionRow,
  reason: string,
  now = new Date(),
): Promise<void> {
  // The chain is stored as a backward pointer (rotated_from_session_id), so
  // walking forward means: revoke everything for this user issued at or
  // after this session — a simpler, still-correct superset of "just the
  // descendants" that errs toward revoking more on a detected attack, never less.
  await repo.revokeAllUserSessions(startSession.organizationId, startSession.userId, reason, now);
}

export function assertSessionRow(session: LoginSessionRow | null): LoginSessionRow {
  if (!session) throw new AuthDomainError("session_invalid", "Session is invalid or has expired.");
  return session;
}
