import { uuid7 } from "@educapsules/shared";
import { hashPassword, verifyPassword } from "./passwords.js";
import { randomToken, sha256Hex, aesGcmDecrypt, aesGcmEncrypt } from "./crypto.js";
import { generateTotpSecret, totpProvisioningUri, verifyTotpCode } from "./totp.js";
import { generateRecoveryCodes, hashRecoveryCode } from "./recovery-codes.js";
import { AuthDomainError } from "./errors.js";
import { isCurrentlyLocked, recordFailedLogin, recordSuccessfulLogin } from "./lockout.js";
import { computeProgressiveDelayMs, sleep } from "./progressive-delay.js";
import {
  issueSession,
  revokeRotationChain,
  rotateSession,
  touchSession,
  validateSessionToken,
} from "./sessions.js";
import type { AuthRepository, LoginSessionRow, UserRow } from "./repository.js";

// A fixed, never-matching Argon2id hash used only to keep login's response
// timing similar whether or not the submitted email exists — mitigates
// email-enumeration via timing side-channel (AUTH-122/SEC-030's spirit,
// applied to login even though AUTH-122's literal text names password
// reset specifically). Never itself a real password.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$0jUjzVgcf1DXDfAHET5j9BD7Z+CSOwWhomcGkUjLc/0";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface RequestContext {
  ipHash: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
}

function requireMfaSecretKey(): string {
  const key = process.env.MFA_SECRET_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "MFA_SECRET_ENCRYPTION_KEY is not set — required to enroll or verify MFA. See .env.example.",
    );
  }
  return key;
}

// --- Registration & email verification (AUTH-121) --------------------------

export async function register(
  repo: AuthRepository,
  input: {
    organizationId: string;
    email: string;
    password: string;
    locale: string;
    timezone: string;
  },
): Promise<{ user: UserRow; rawVerificationToken: string }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new AuthDomainError("validation_failed", "A valid email address is required.");
  }
  if (input.password.length < 12) {
    throw new AuthDomainError("validation_failed", "Password must be at least 12 characters.");
  }
  const existing = await repo.findUserByEmail(input.organizationId, input.email);
  if (existing) {
    throw new AuthDomainError(
      "email_already_registered",
      "An account with this email already exists.",
    );
  }

  const passwordHash = await hashPassword(input.password);
  const user = await repo.createUser({
    organizationId: input.organizationId,
    email: input.email,
    passwordHash,
    locale: input.locale,
    timezone: input.timezone,
  });

  const rawVerificationToken = randomToken(32);
  await repo.createEmailVerificationToken({
    organizationId: user.organizationId,
    userId: user.id,
    tokenHash: await sha256Hex(rawVerificationToken),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  return { user, rawVerificationToken };
}

export async function verifyEmail(repo: AuthRepository, rawToken: string): Promise<void> {
  const now = new Date();
  const tokenHash = await sha256Hex(rawToken);
  const record = await repo.findValidEmailVerificationToken(tokenHash, now);
  if (!record)
    throw new AuthDomainError("token_invalid", "This verification link is invalid or has expired.");

  await repo.markEmailVerificationTokenUsed(record.id, now);
  const user = await repo.findUserById(record.organizationId, record.userId);
  if (user && user.status === "pending") {
    await repo.patchUser(record.organizationId, record.userId, {
      status: "active",
      emailVerifiedAt: now,
    });
  }
}

// --- Login / MFA challenge (AUTH-101, AUTH-116, AUTH-121, AUTH-122) --------

export type LoginResult =
  | { outcome: "authenticated"; user: UserRow; session: LoginSessionRow; rawToken: string }
  | { outcome: "mfa_required"; rawChallengeToken: string }
  | { outcome: "mfa_setup_required"; rawSetupToken: string };

export async function login(
  repo: AuthRepository,
  input: { organizationId: string; email: string; password: string },
  ctx: RequestContext,
): Promise<LoginResult> {
  const now = new Date();
  const user = await repo.findUserByEmail(input.organizationId, input.email);

  if (!user) {
    await verifyPassword(input.password, DUMMY_HASH); // timing normalization only
    throw new AuthDomainError("invalid_credentials", "Email or password is incorrect.");
  }

  if (isCurrentlyLocked(user, now)) {
    await repo.writeSecurityEvent({
      organizationId: user.organizationId,
      userId: user.id,
      eventType: "ACCOUNT_LOCKED",
      severity: "high",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      occurredAt: now,
      details: null,
    });
    throw new AuthDomainError(
      "account_locked",
      "This account is temporarily locked. Try again later.",
    );
  }

  const passwordOk = await verifyPassword(input.password, user.passwordHash ?? DUMMY_HASH);
  if (!passwordOk) {
    const { locked, failedLoginCount } = await recordFailedLogin(repo, user, now);
    await writeAudit(repo, user, "LOGIN_FAILED", ctx, now);
    if (locked) {
      await repo.writeSecurityEvent({
        organizationId: user.organizationId,
        userId: user.id,
        eventType: "LOGIN_BRUTE_FORCE",
        severity: "high",
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
        occurredAt: now,
        details: null,
      });
    }
    // SEC-032/API-017: progressive delay, independent of the IP-based rate
    // limiter and the hard lockout threshold — see progressive-delay.ts.
    const delayMs = computeProgressiveDelayMs(failedLoginCount);
    if (delayMs > 0) await sleep(delayMs);
    throw new AuthDomainError("invalid_credentials", "Email or password is incorrect.");
  }

  if (user.status === "pending") {
    throw new AuthDomainError("email_not_verified", "Please verify your email before signing in.");
  }
  if (user.status !== "active") {
    throw new AuthDomainError("account_not_active", "This account cannot sign in right now.");
  }

  await recordSuccessfulLogin(repo, user, now);

  const isAdmin = await repo.userHasActiveRole(user.organizationId, user.id, "ADMIN");

  // AUTH-116: MFA is required, not merely offered, for administrative
  // accounts. There is no role-assignment/admin-management UI in this
  // codebase yet (that is Phase 5 authorization territory), so an account
  // can already hold an active ADMIN role assignment (seed/migration/direct
  // DB action) without ever having been prompted to enroll MFA. Rather than
  // silently letting such an account sign in MFA-free — or hard-blocking it
  // with no way to ever complete enrollment, since enrollment itself
  // requires a session — a restricted mfa_setup_required session is issued
  // instead of a real one; it is good for nothing except /mfa/enroll and
  // /mfa/confirm (see requireValidSession's allowMfaSetup option below).
  if (isAdmin && !user.mfaEnabled) {
    const { rawToken } = await issueSession(
      repo,
      {
        organizationId: user.organizationId,
        userId: user.id,
        sessionType: "mfa_setup_required",
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
        deviceFingerprint: ctx.deviceFingerprint,
      },
      uuid7,
      now,
    );
    return { outcome: "mfa_setup_required", rawSetupToken: rawToken };
  }

  if (user.mfaEnabled) {
    const { rawToken } = await issueSession(
      repo,
      {
        organizationId: user.organizationId,
        userId: user.id,
        sessionType: "mfa_pending",
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
        deviceFingerprint: ctx.deviceFingerprint,
      },
      uuid7,
      now,
    );
    return { outcome: "mfa_required", rawChallengeToken: rawToken };
  }

  const { session, rawToken } = await issueSession(
    repo,
    {
      organizationId: user.organizationId,
      userId: user.id,
      sessionType: isAdmin ? "admin" : "standard",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
    },
    uuid7,
    now,
  );
  await writeAudit(repo, user, "LOGIN_SUCCESS", ctx, now, session.id);
  return { outcome: "authenticated", user, session, rawToken };
}

export async function verifyMfaChallenge(
  repo: AuthRepository,
  input: { rawChallengeToken: string; code: string; isRecoveryCode: boolean },
  ctx: RequestContext,
): Promise<{ user: UserRow; session: LoginSessionRow; rawToken: string }> {
  const now = new Date();
  const validation = await validateSessionToken(repo, input.rawChallengeToken, now);
  if (validation.outcome !== "valid") {
    throw new AuthDomainError("session_invalid", "This MFA challenge is invalid or has expired.");
  }
  const challengeSession = validation.session;
  if (now.getTime() - challengeSession.issuedAt.getTime() > MFA_CHALLENGE_TTL_MS) {
    await repo.revokeLoginSession(challengeSession.id, "mfa_challenge_expired", now);
    throw new AuthDomainError("session_invalid", "This MFA challenge has expired.");
  }

  const user = await repo.findUserById(challengeSession.organizationId, challengeSession.userId);
  if (!user)
    throw new AuthDomainError("session_invalid", "This MFA challenge is invalid or has expired.");

  const factor = await repo.findMfaFactor(user.organizationId, user.id);
  if (!factor || factor.status !== "active") {
    throw new AuthDomainError("mfa_invalid", "MFA is not active on this account.");
  }

  let ok: boolean;
  if (input.isRecoveryCode) {
    const hash = await hashRecoveryCode(input.code);
    const record = await repo.findUnusedRecoveryCodeByHash(user.organizationId, user.id, hash);
    ok = record !== null;
    if (ok) {
      await repo.markRecoveryCodeUsed(record!.id, now);
      await writeAudit(repo, user, "MFA_RECOVERY_CODE_USED", ctx, now); // AUTH-127
    }
  } else {
    const secret = await aesGcmDecrypt(requireMfaSecretKey(), factor.secretCiphertext);
    ok = await verifyTotpCode(secret, input.code, now.getTime());
  }

  if (!ok) {
    await writeAudit(repo, user, "MFA_FAILED", ctx, now);
    throw new AuthDomainError("mfa_invalid", "The code you entered is not valid.");
  }

  await repo.patchMfaFactor(user.organizationId, factor.id, { lastUsedAt: now });
  await repo.revokeLoginSession(challengeSession.id, "mfa_verified", now);

  const sessionType = (await repo.userHasActiveRole(user.organizationId, user.id, "ADMIN"))
    ? "admin"
    : "standard";
  const { session, rawToken } = await issueSession(
    repo,
    {
      organizationId: user.organizationId,
      userId: user.id,
      sessionType,
      ipHash: challengeSession.ipHash,
      userAgent: challengeSession.userAgent,
      deviceFingerprint: challengeSession.deviceFingerprint,
      mfaVerifiedAt: now,
    },
    uuid7,
    now,
  );
  await writeAudit(repo, user, "MFA_SUCCESS", ctx, now, session.id);
  await writeAudit(repo, user, "LOGIN_SUCCESS", ctx, now, session.id);
  return { user, session, rawToken };
}

// --- Session lifecycle (AUTH-105..110, AUTH-118) ----------------------------

export async function requireValidSession(
  repo: AuthRepository,
  rawToken: string,
  now = new Date(),
  opts: { allowMfaSetup?: boolean } = {},
): Promise<LoginSessionRow> {
  const result = await validateSessionToken(repo, rawToken, now);
  if (result.outcome === "reuse_detected") {
    await revokeRotationChain(repo, result.session, "reuse_detected", now);
    await repo.writeSecurityEvent({
      organizationId: result.session.organizationId,
      userId: result.session.userId,
      eventType: "TOKEN_REUSE_DETECTED",
      severity: "critical",
      ipHash: null,
      userAgent: null,
      occurredAt: now,
      details: null,
    });
    throw new AuthDomainError("session_invalid", "This session is no longer valid.");
  }
  if (result.outcome === "invalid") {
    throw new AuthDomainError("session_invalid", "This session is invalid or has expired.");
  }
  // AUTH-110: an MFA-pending credential is never treated as an authenticated
  // session by the general session check — only verifyMfaChallenge (which
  // calls validateSessionToken directly, not this function) may consume it.
  if (result.session.sessionType === "mfa_pending") {
    throw new AuthDomainError("mfa_required", "Complete the MFA challenge to continue.");
  }
  // AUTH-116: same treatment as mfa_pending above — an mfa_setup_required
  // session proves identity but not the required second factor, so it is
  // rejected for every ordinary protected route. Only the MFA-enrollment
  // routes pass allowMfaSetup to accept it.
  if (result.session.sessionType === "mfa_setup_required" && !opts.allowMfaSetup) {
    throw new AuthDomainError("admin_mfa_setup_required", "Complete MFA enrollment to continue.");
  }
  // AUTH-117: suspending (or otherwise deactivating) an account must
  // restrict its existing sessions, not just block future logins. The
  // session row itself can stay valid for a long time (up to the standard
  // 14-day absolute timeout) after an account is suspended, so the
  // account's *current* status is re-checked on every request rather than
  // only at issuance — this is what actually enforces the restriction,
  // since there is no admin-suspend endpoint yet that could instead
  // proactively revoke the sessions at the moment of suspension.
  const user = await repo.findUserById(result.session.organizationId, result.session.userId);
  if (!user || user.status !== "active") {
    throw new AuthDomainError("session_invalid", "This session is no longer valid.");
  }
  if (result.session.sessionType !== "mfa_setup_required") {
    await touchSession(repo, result.session, now);
  }
  return result.session;
}

export async function refreshSession(
  repo: AuthRepository,
  session: LoginSessionRow,
): Promise<{ session: LoginSessionRow; rawToken: string }> {
  return rotateSession(repo, session, uuid7);
}

export async function logout(repo: AuthRepository, session: LoginSessionRow): Promise<void> {
  await repo.revokeLoginSession(session.id, "logout", new Date());
}

export async function logoutAll(repo: AuthRepository, session: LoginSessionRow): Promise<void> {
  await repo.revokeAllUserSessions(
    session.organizationId,
    session.userId,
    "logout_all",
    new Date(),
  );
}

export async function listSessions(
  repo: AuthRepository,
  session: LoginSessionRow,
): Promise<LoginSessionRow[]> {
  return repo.listActiveUserSessions(session.organizationId, session.userId, new Date());
}

export async function revokeSessionById(
  repo: AuthRepository,
  session: LoginSessionRow,
  targetSessionId: string,
): Promise<void> {
  const target = await repo.findLoginSessionById(session.organizationId, targetSessionId);
  if (!target || target.userId !== session.userId) {
    throw new AuthDomainError("session_invalid", "Session not found.");
  }
  await repo.revokeLoginSession(target.id, "user_revoked", new Date());
}

// --- Password reset & change (AUTH-119, AUTH-121, AUTH-122) ----------------

export async function forgotPassword(
  repo: AuthRepository,
  input: { organizationId: string; email: string; ipHash: string | null },
): Promise<string | null> {
  // AUTH-122: the caller (route layer) must return the same response
  // regardless of what this returns — null means "no email was sent" but
  // must never be distinguishable to the client from a real send.
  const user = await repo.findUserByEmail(input.organizationId, input.email);
  if (!user) return null;

  const rawToken = randomToken(32);
  await repo.createPasswordResetToken({
    organizationId: user.organizationId,
    userId: user.id,
    tokenHash: await sha256Hex(rawToken),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    requestIpHash: input.ipHash,
  });
  return rawToken;
}

export async function resetPassword(
  repo: AuthRepository,
  input: { rawToken: string; newPassword: string },
  ctx: RequestContext,
): Promise<{ user: UserRow; session: LoginSessionRow; rawSessionToken: string }> {
  if (input.newPassword.length < 12) {
    throw new AuthDomainError("validation_failed", "Password must be at least 12 characters.");
  }
  const now = new Date();
  const tokenHash = await sha256Hex(input.rawToken);
  const record = await repo.findValidPasswordResetToken(tokenHash, now);
  if (!record)
    throw new AuthDomainError("token_invalid", "This reset link is invalid or has expired.");

  const passwordHash = await hashPassword(input.newPassword);
  await repo.patchUser(record.organizationId, record.userId, { passwordHash, updatedAt: now });
  await repo.markPasswordResetTokenUsed(record.id, now);

  // AUTH-119: revoke existing sessions and establish a new trusted one.
  await repo.revokeAllUserSessions(record.organizationId, record.userId, "password_changed", now);
  const user = await repo.findUserById(record.organizationId, record.userId);
  if (!user)
    throw new AuthDomainError("token_invalid", "This reset link is invalid or has expired.");
  await writeAudit(repo, user, "PASSWORD_CHANGED", ctx, now);

  const { session, rawToken: rawSessionToken } = await issueSession(
    repo,
    {
      organizationId: user.organizationId,
      userId: user.id,
      sessionType: "standard",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
    },
    uuid7,
    now,
  );
  return { user, session, rawSessionToken };
}

export async function changePassword(
  repo: AuthRepository,
  session: LoginSessionRow,
  input: { currentPassword: string; newPassword: string },
  ctx: RequestContext,
): Promise<{ session: LoginSessionRow; rawSessionToken: string }> {
  if (input.newPassword.length < 12) {
    throw new AuthDomainError("validation_failed", "Password must be at least 12 characters.");
  }
  const now = new Date();
  const user = await repo.findUserById(session.organizationId, session.userId);
  if (!user) throw new AuthDomainError("session_invalid", "Session is invalid.");

  const ok = await verifyPassword(input.currentPassword, user.passwordHash ?? DUMMY_HASH);
  if (!ok) throw new AuthDomainError("invalid_credentials", "Current password is incorrect.");

  const passwordHash = await hashPassword(input.newPassword);
  await repo.patchUser(user.organizationId, user.id, { passwordHash, updatedAt: now });
  await repo.revokeAllUserSessions(user.organizationId, user.id, "password_changed", now);
  await writeAudit(repo, user, "PASSWORD_CHANGED", ctx, now);

  const { session: newSession, rawToken: rawSessionToken } = await issueSession(
    repo,
    {
      organizationId: user.organizationId,
      userId: user.id,
      sessionType: session.sessionType === "admin" ? "admin" : "standard",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
    },
    uuid7,
    now,
  );
  return { session: newSession, rawSessionToken };
}

// --- MFA enrollment (AUTH-116, AUTH-126, AUTH-127) -------------------------

export async function enrollMfa(
  repo: AuthRepository,
  organizationId: string,
  userId: string,
): Promise<{ secretBase32: string; provisioningUri: string }> {
  const user = await repo.findUserById(organizationId, userId);
  if (!user) throw new AuthDomainError("session_invalid", "Session is invalid.");

  const secretBase32 = generateTotpSecret();
  const now = new Date();
  await repo.upsertMfaFactor({
    id: uuid7(),
    organizationId,
    userId,
    secretCiphertext: await aesGcmEncrypt(requireMfaSecretKey(), secretBase32),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return { secretBase32, provisioningUri: totpProvisioningUri(secretBase32, user.email) };
}

export async function confirmMfa(
  repo: AuthRepository,
  session: LoginSessionRow,
  code: string,
  ctx: RequestContext,
): Promise<{
  recoveryCodes: string[];
  upgradedSession?: { session: LoginSessionRow; rawToken: string };
}> {
  const { organizationId, userId } = session;
  const now = new Date();
  const factor = await repo.findMfaFactor(organizationId, userId);
  if (!factor || factor.status === "active") {
    throw new AuthDomainError("mfa_invalid", "No pending MFA enrolment found.");
  }
  const secret = await aesGcmDecrypt(requireMfaSecretKey(), factor.secretCiphertext);
  const ok = await verifyTotpCode(secret, code, now.getTime());
  if (!ok) throw new AuthDomainError("mfa_invalid", "The code you entered is not valid.");

  await repo.patchMfaFactor(organizationId, factor.id, {
    status: "active",
    verifiedAt: now,
    updatedAt: now,
  });
  await repo.patchUser(organizationId, userId, { mfaEnabled: true, updatedAt: now });

  const { plaintextCodes, hashes } = await generateRecoveryCodes();
  await repo.replaceRecoveryCodes(organizationId, userId, factor.id, hashes);

  const user = await repo.findUserById(organizationId, userId);
  if (user) await writeAudit(repo, user, "MFA_ENROLLED", ctx, now);

  // AUTH-116: an admin who just closed the mandatory-MFA gate from a
  // restricted mfa_setup_required session should not be forced to log in
  // again — revoke the setup session and hand back a real one.
  let upgradedSession: { session: LoginSessionRow; rawToken: string } | undefined;
  if (session.sessionType === "mfa_setup_required") {
    await repo.revokeLoginSession(session.id, "mfa_setup_completed", now);
    upgradedSession = await issueSession(
      repo,
      {
        organizationId,
        userId,
        sessionType: "admin",
        ipHash: session.ipHash,
        userAgent: session.userAgent,
        deviceFingerprint: session.deviceFingerprint,
      },
      uuid7,
      now,
    );
    if (user) await writeAudit(repo, user, "LOGIN_SUCCESS", ctx, now, upgradedSession.session.id);
  }

  return {
    recoveryCodes: plaintextCodes,
    ...(upgradedSession ? { upgradedSession } : {}),
  };
}

export async function disableMfa(
  repo: AuthRepository,
  session: LoginSessionRow,
  currentPassword: string,
  ctx: RequestContext,
): Promise<void> {
  const now = new Date();
  const user = await repo.findUserById(session.organizationId, session.userId);
  if (!user) throw new AuthDomainError("session_invalid", "Session is invalid.");
  const ok = await verifyPassword(currentPassword, user.passwordHash ?? DUMMY_HASH);
  if (!ok) throw new AuthDomainError("invalid_credentials", "Current password is incorrect.");

  // AUTH-116: an administrative account may not drop below the "MFA
  // enrolled" state it was required to reach to sign in at all — otherwise
  // disabling MFA would silently reopen the same gap login() now closes.
  if (await repo.userHasActiveRole(user.organizationId, user.id, "ADMIN")) {
    throw new AuthDomainError(
      "admin_mfa_setup_required",
      "Administrative accounts must keep multi-factor authentication enabled.",
    );
  }

  const factor = await repo.findMfaFactor(user.organizationId, user.id);
  if (factor) {
    await repo.replaceRecoveryCodes(user.organizationId, user.id, factor.id, []);
    await repo.deleteMfaFactor(user.organizationId, factor.id);
  }
  await repo.patchUser(user.organizationId, user.id, { mfaEnabled: false, updatedAt: now });
  await writeAudit(repo, user, "MFA_DISABLED", ctx, now);
}

export async function regenerateRecoveryCodes(
  repo: AuthRepository,
  organizationId: string,
  userId: string,
  currentPassword: string,
): Promise<string[]> {
  const user = await repo.findUserById(organizationId, userId);
  if (!user) throw new AuthDomainError("session_invalid", "Session is invalid.");
  const ok = await verifyPassword(currentPassword, user.passwordHash ?? DUMMY_HASH);
  if (!ok) throw new AuthDomainError("invalid_credentials", "Current password is incorrect.");

  const factor = await repo.findMfaFactor(organizationId, userId);
  if (!factor || factor.status !== "active") {
    throw new AuthDomainError("mfa_invalid", "MFA is not active on this account.");
  }
  const { plaintextCodes, hashes } = await generateRecoveryCodes();
  await repo.replaceRecoveryCodes(organizationId, userId, factor.id, hashes);
  return plaintextCodes;
}

// --- Audit helper ------------------------------------------------------------

async function writeAudit(
  repo: AuthRepository,
  user: UserRow,
  action: string,
  ctx: RequestContext,
  at: Date,
  loginSessionId: string | null = null,
): Promise<void> {
  await repo.writeAuditEvent({
    organizationId: user.organizationId,
    actorUserId: user.id,
    actorRole: null,
    action,
    targetType: "user",
    targetId: user.id,
    ipHash: ctx.ipHash,
    loginSessionId,
    occurredAt: at,
    reason: null,
  });
}
