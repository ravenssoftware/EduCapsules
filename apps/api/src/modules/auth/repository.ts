import { and, eq, gt, isNull } from "drizzle-orm";
import { uuid7 } from "@educapsules/shared";

/**
 * Persistence layer for the auth module (docs/architecture/backend.md §1's
 * Persistence layer). Internally duck-typed against `db`/`schema` (same
 * pattern as packages/db/src/schema/db-behavior-scenarios.ts) so ONE
 * implementation serves both the SQLite and PostgreSQL schema modules —
 * the two are structurally identical (enforced by packages/db's parity
 * test) even though their concrete Drizzle types differ. The public
 * surface below is fully typed; only the internals reach for `any`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UserRow {
  id: string;
  organizationId: string;
  email: string;
  passwordHash: string | null;
  status: string;
  locale: string;
  timezone: string;
  mfaEnabled: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginSessionRow {
  id: string;
  organizationId: string;
  userId: string;
  tokenHash: string;
  sessionType: string;
  deviceFingerprint: string | null;
  ipHash: string | null;
  userAgent: string | null;
  mfaVerifiedAt: Date | null;
  issuedAt: Date;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  revocationReason: string | null;
  rotatedFromSessionId: string | null;
}

export interface MfaFactorRow {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  secretCiphertext: string;
  status: string;
  verifiedAt: Date | null;
  lastUsedAt: Date | null;
}

export interface AuthRepository {
  findUserByEmail(organizationId: string, email: string): Promise<UserRow | null>;
  findUserById(organizationId: string, userId: string): Promise<UserRow | null>;
  createUser(input: {
    organizationId: string;
    email: string;
    passwordHash: string;
    locale: string;
    timezone: string;
  }): Promise<UserRow>;
  patchUser(
    organizationId: string,
    userId: string,
    patch: Partial<{
      status: string;
      passwordHash: string;
      failedLoginCount: number;
      lockedUntil: Date | null;
      emailVerifiedAt: Date | null;
      mfaEnabled: boolean;
      updatedAt: Date;
    }>,
  ): Promise<void>;
  userHasActiveRole(organizationId: string, userId: string, roleKey: string): Promise<boolean>;

  createLoginSession(
    row: Omit<LoginSessionRow, "revokedAt" | "revocationReason">,
  ): Promise<LoginSessionRow>;
  findLoginSessionByTokenHash(tokenHash: string): Promise<LoginSessionRow | null>;
  findLoginSessionById(organizationId: string, id: string): Promise<LoginSessionRow | null>;
  touchLoginSession(
    id: string,
    patch: { lastSeenAt: Date; idleExpiresAt: Date; mfaVerifiedAt?: Date },
  ): Promise<void>;
  revokeLoginSession(id: string, reason: string, at: Date): Promise<void>;
  revokeAllUserSessions(
    organizationId: string,
    userId: string,
    reason: string,
    at: Date,
    exceptSessionId?: string,
  ): Promise<void>;
  listActiveUserSessions(
    organizationId: string,
    userId: string,
    now: Date,
  ): Promise<LoginSessionRow[]>;

  upsertMfaFactor(row: {
    id: string;
    organizationId: string;
    userId: string;
    secretCiphertext: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<MfaFactorRow>;
  findMfaFactor(organizationId: string, userId: string): Promise<MfaFactorRow | null>;
  patchMfaFactor(
    organizationId: string,
    id: string,
    patch: Partial<{
      status: string;
      verifiedAt: Date | null;
      lastUsedAt: Date | null;
      updatedAt: Date;
    }>,
  ): Promise<void>;
  deleteMfaFactor(organizationId: string, id: string): Promise<void>;

  replaceRecoveryCodes(
    organizationId: string,
    userId: string,
    mfaFactorId: string,
    hashes: string[],
  ): Promise<void>;
  findUnusedRecoveryCodeByHash(
    organizationId: string,
    userId: string,
    hash: string,
  ): Promise<{ id: string } | null>;
  markRecoveryCodeUsed(id: string, at: Date): Promise<void>;
  countUnusedRecoveryCodes(organizationId: string, userId: string): Promise<number>;

  createPasswordResetToken(row: {
    organizationId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestIpHash: string | null;
  }): Promise<void>;
  findValidPasswordResetToken(
    tokenHash: string,
    now: Date,
  ): Promise<{ id: string; organizationId: string; userId: string } | null>;
  markPasswordResetTokenUsed(id: string, at: Date): Promise<void>;

  createEmailVerificationToken(row: {
    organizationId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findValidEmailVerificationToken(
    tokenHash: string,
    now: Date,
  ): Promise<{ id: string; organizationId: string; userId: string } | null>;
  markEmailVerificationTokenUsed(id: string, at: Date): Promise<void>;

  writeAuditEvent(row: {
    organizationId: string;
    actorUserId: string | null;
    actorRole: string | null;
    action: string;
    targetType: string;
    targetId: string;
    ipHash: string | null;
    loginSessionId: string | null;
    occurredAt: Date;
    reason: string | null;
  }): Promise<void>;
  writeSecurityEvent(row: {
    organizationId: string | null;
    userId: string | null;
    eventType: string;
    severity: string;
    ipHash: string | null;
    userAgent: string | null;
    occurredAt: Date;
    details: string | null;
  }): Promise<void>;
}

function toUserRow(r: any): UserRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    email: r.email,
    passwordHash: r.passwordHash,
    status: r.status,
    locale: r.locale,
    timezone: r.timezone,
    mfaEnabled: !!r.mfaEnabled,
    failedLoginCount: r.failedLoginCount,
    lockedUntil: r.lockedUntil ?? null,
    emailVerifiedAt: r.emailVerifiedAt ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toSessionRow(r: any): LoginSessionRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    userId: r.userId,
    tokenHash: r.tokenHash,
    sessionType: r.sessionType,
    deviceFingerprint: r.deviceFingerprint ?? null,
    ipHash: r.ipHash ?? null,
    userAgent: r.userAgent ?? null,
    mfaVerifiedAt: r.mfaVerifiedAt ?? null,
    issuedAt: r.issuedAt,
    lastSeenAt: r.lastSeenAt,
    idleExpiresAt: r.idleExpiresAt,
    absoluteExpiresAt: r.absoluteExpiresAt,
    revokedAt: r.revokedAt ?? null,
    revocationReason: r.revocationReason ?? null,
    rotatedFromSessionId: r.rotatedFromSessionId ?? null,
  };
}

function toMfaFactorRow(r: any): MfaFactorRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    userId: r.userId,
    type: r.type,
    secretCiphertext: r.secretCiphertext,
    status: r.status,
    verifiedAt: r.verifiedAt ?? null,
    lastUsedAt: r.lastUsedAt ?? null,
  };
}

export function createAuthRepository(db: any, schema: any): AuthRepository {
  return {
    async findUserByEmail(organizationId, email) {
      const rows = await db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.organizationId, organizationId), eq(schema.users.email, email)));
      return rows[0] ? toUserRow(rows[0]) : null;
    },

    async findUserById(organizationId, userId) {
      const rows = await db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.organizationId, organizationId), eq(schema.users.id, userId)));
      return rows[0] ? toUserRow(rows[0]) : null;
    },

    async createUser({ organizationId, email, passwordHash, locale, timezone }) {
      const now = new Date();
      const row = {
        id: uuid7(),
        organizationId,
        email,
        phone: null,
        passwordHash,
        status: "pending",
        locale,
        timezone,
        mfaEnabled: false,
        failedLoginCount: 0,
        lockedUntil: null,
        emailVerifiedAt: null,
        createdBy: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        deletedBy: null,
      };
      await db.insert(schema.users).values(row);
      return toUserRow(row);
    },

    async patchUser(organizationId, userId, patch) {
      await db
        .update(schema.users)
        .set({ ...patch, updatedAt: patch.updatedAt ?? new Date() })
        .where(and(eq(schema.users.organizationId, organizationId), eq(schema.users.id, userId)));
    },

    async userHasActiveRole(organizationId, userId, roleKey) {
      const rows = await db
        .select({ id: schema.userRoleAssignments.id })
        .from(schema.userRoleAssignments)
        .innerJoin(schema.roles, eq(schema.userRoleAssignments.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.userRoleAssignments.organizationId, organizationId),
            eq(schema.userRoleAssignments.userId, userId),
            eq(schema.userRoleAssignments.status, "active"),
            eq(schema.roles.key, roleKey),
          ),
        );
      return rows.length > 0;
    },

    async createLoginSession(row) {
      await db
        .insert(schema.loginSessions)
        .values({ ...row, revokedAt: null, revocationReason: null });
      return { ...row, revokedAt: null, revocationReason: null };
    },

    async findLoginSessionByTokenHash(tokenHash) {
      const rows = await db
        .select()
        .from(schema.loginSessions)
        .where(eq(schema.loginSessions.tokenHash, tokenHash));
      return rows[0] ? toSessionRow(rows[0]) : null;
    },

    async findLoginSessionById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.loginSessions)
        .where(
          and(
            eq(schema.loginSessions.organizationId, organizationId),
            eq(schema.loginSessions.id, id),
          ),
        );
      return rows[0] ? toSessionRow(rows[0]) : null;
    },

    async touchLoginSession(id, patch) {
      await db.update(schema.loginSessions).set(patch).where(eq(schema.loginSessions.id, id));
    },

    async revokeLoginSession(id, reason, at) {
      await db
        .update(schema.loginSessions)
        .set({ revokedAt: at, revocationReason: reason })
        .where(eq(schema.loginSessions.id, id));
    },

    async revokeAllUserSessions(organizationId, userId, reason, at, exceptSessionId) {
      const rows = await db
        .select({ id: schema.loginSessions.id })
        .from(schema.loginSessions)
        .where(
          and(
            eq(schema.loginSessions.organizationId, organizationId),
            eq(schema.loginSessions.userId, userId),
            isNull(schema.loginSessions.revokedAt),
          ),
        );
      for (const row of rows) {
        if (exceptSessionId && row.id === exceptSessionId) continue;
        await db
          .update(schema.loginSessions)
          .set({ revokedAt: at, revocationReason: reason })
          .where(eq(schema.loginSessions.id, row.id));
      }
    },

    async listActiveUserSessions(organizationId, userId, now) {
      const rows = await db
        .select()
        .from(schema.loginSessions)
        .where(
          and(
            eq(schema.loginSessions.organizationId, organizationId),
            eq(schema.loginSessions.userId, userId),
            isNull(schema.loginSessions.revokedAt),
            gt(schema.loginSessions.absoluteExpiresAt, now),
          ),
        );
      return rows.map(toSessionRow);
    },

    async upsertMfaFactor(row) {
      await db
        .insert(schema.mfaFactors)
        .values(row)
        .onConflictDoUpdate({
          target: [
            schema.mfaFactors.organizationId,
            schema.mfaFactors.userId,
            schema.mfaFactors.type,
          ],
          set: {
            secretCiphertext: row.secretCiphertext,
            status: row.status,
            updatedAt: row.updatedAt,
            verifiedAt: null,
          },
        });
      const rows = await db
        .select()
        .from(schema.mfaFactors)
        .where(
          and(
            eq(schema.mfaFactors.organizationId, row.organizationId),
            eq(schema.mfaFactors.userId, row.userId),
          ),
        );
      return toMfaFactorRow(rows[0]);
    },

    async findMfaFactor(organizationId, userId) {
      const rows = await db
        .select()
        .from(schema.mfaFactors)
        .where(
          and(
            eq(schema.mfaFactors.organizationId, organizationId),
            eq(schema.mfaFactors.userId, userId),
          ),
        );
      return rows[0] ? toMfaFactorRow(rows[0]) : null;
    },

    async patchMfaFactor(organizationId, id, patch) {
      await db
        .update(schema.mfaFactors)
        .set(patch)
        .where(
          and(eq(schema.mfaFactors.organizationId, organizationId), eq(schema.mfaFactors.id, id)),
        );
    },

    async deleteMfaFactor(organizationId, id) {
      // MFA factors carry no soft-delete column (they are not user-generated
      // academic content, DB-017's scope) — disabling sets status='disabled'
      // via patchMfaFactor; this is reserved for the enrolment-replaced case
      // where the old row is genuinely superseded, not a user-facing delete.
      await db
        .delete(schema.mfaFactors)
        .where(
          and(eq(schema.mfaFactors.organizationId, organizationId), eq(schema.mfaFactors.id, id)),
        );
    },

    async replaceRecoveryCodes(organizationId, userId, mfaFactorId, hashes) {
      await db
        .delete(schema.mfaRecoveryCodes)
        .where(
          and(
            eq(schema.mfaRecoveryCodes.organizationId, organizationId),
            eq(schema.mfaRecoveryCodes.userId, userId),
          ),
        );
      if (hashes.length === 0) return; // e.g. disableMfa clearing codes with nothing to reinsert — an empty .values([]) is invalid SQL.
      const now = new Date();
      await db.insert(schema.mfaRecoveryCodes).values(
        hashes.map((codeHash) => ({
          id: uuid7(),
          organizationId,
          userId,
          mfaFactorId,
          codeHash,
          usedAt: null,
          createdAt: now,
        })),
      );
    },

    async findUnusedRecoveryCodeByHash(organizationId, userId, hash) {
      const rows = await db
        .select({ id: schema.mfaRecoveryCodes.id })
        .from(schema.mfaRecoveryCodes)
        .where(
          and(
            eq(schema.mfaRecoveryCodes.organizationId, organizationId),
            eq(schema.mfaRecoveryCodes.userId, userId),
            eq(schema.mfaRecoveryCodes.codeHash, hash),
            isNull(schema.mfaRecoveryCodes.usedAt),
          ),
        );
      return rows[0] ?? null;
    },

    async markRecoveryCodeUsed(id, at) {
      await db
        .update(schema.mfaRecoveryCodes)
        .set({ usedAt: at })
        .where(eq(schema.mfaRecoveryCodes.id, id));
    },

    async countUnusedRecoveryCodes(organizationId, userId) {
      const rows = await db
        .select({ id: schema.mfaRecoveryCodes.id })
        .from(schema.mfaRecoveryCodes)
        .where(
          and(
            eq(schema.mfaRecoveryCodes.organizationId, organizationId),
            eq(schema.mfaRecoveryCodes.userId, userId),
            isNull(schema.mfaRecoveryCodes.usedAt),
          ),
        );
      return rows.length;
    },

    async createPasswordResetToken({
      organizationId,
      userId,
      tokenHash,
      expiresAt,
      requestIpHash,
    }) {
      await db.insert(schema.passwordResetTokens).values({
        id: uuid7(),
        organizationId,
        userId,
        tokenHash,
        expiresAt,
        usedAt: null,
        requestIpHash,
        createdAt: new Date(),
      });
    },

    async findValidPasswordResetToken(tokenHash, now) {
      const rows = await db
        .select()
        .from(schema.passwordResetTokens)
        .where(
          and(
            eq(schema.passwordResetTokens.tokenHash, tokenHash),
            isNull(schema.passwordResetTokens.usedAt),
            gt(schema.passwordResetTokens.expiresAt, now),
          ),
        );
      return rows[0] ?? null;
    },

    async markPasswordResetTokenUsed(id, at) {
      await db
        .update(schema.passwordResetTokens)
        .set({ usedAt: at })
        .where(eq(schema.passwordResetTokens.id, id));
    },

    async createEmailVerificationToken({ organizationId, userId, tokenHash, expiresAt }) {
      await db.insert(schema.emailVerificationTokens).values({
        id: uuid7(),
        organizationId,
        userId,
        tokenHash,
        expiresAt,
        usedAt: null,
        createdAt: new Date(),
      });
    },

    async findValidEmailVerificationToken(tokenHash, now) {
      const rows = await db
        .select()
        .from(schema.emailVerificationTokens)
        .where(
          and(
            eq(schema.emailVerificationTokens.tokenHash, tokenHash),
            isNull(schema.emailVerificationTokens.usedAt),
            gt(schema.emailVerificationTokens.expiresAt, now),
          ),
        );
      return rows[0] ?? null;
    },

    async markEmailVerificationTokenUsed(id, at) {
      await db
        .update(schema.emailVerificationTokens)
        .set({ usedAt: at })
        .where(eq(schema.emailVerificationTokens.id, id));
    },

    async writeAuditEvent(row) {
      await db
        .insert(schema.auditLog)
        .values({ id: uuid7(), beforeRef: null, afterRef: null, ...row });
    },

    async writeSecurityEvent(row) {
      await db.insert(schema.securityEvents).values({ id: uuid7(), ...row });
    },
  };
}
