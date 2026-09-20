import { sql } from "drizzle-orm";
import { check, foreignKey, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organizations, users } from "./identity.js";

/**
 * Identity & Authentication entities — Postgres mirror of
 * ../sqlite/auth.ts. See that file's header comment for the SRS
 * references; see docs/database/schema-overview.md and
 * docs/auth/authentication.md for details.
 */

export const loginSessions = pgTable(
  "login_sessions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    sessionType: text("session_type").notNull().default("standard"),
    deviceFingerprint: text("device_fingerprint"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    mfaVerifiedAt: timestamp("mfa_verified_at", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    idleExpiresAt: timestamp("idle_expires_at", { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    rotatedFromSessionId: text("rotated_from_session_id"),
  },
  (t) => [
    unique("login_sessions_org_id_unique").on(t.organizationId, t.id),
    unique("login_sessions_token_hash_unique").on(t.tokenHash),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "login_sessions_user_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "login_sessions_organization_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.rotatedFromSessionId],
      foreignColumns: [t.organizationId, t.id],
      name: "login_sessions_rotated_from_fk",
    }),
    index("login_sessions_user_idx").on(t.organizationId, t.userId),
  ],
);

export const mfaFactors = pgTable(
  "mfa_factors",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull().default("TOTP"),
    secretCiphertext: text("secret_ciphertext").notNull(),
    status: text("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("mfa_factors_org_id_unique").on(t.organizationId, t.id),
    unique("mfa_factors_org_user_type_unique").on(t.organizationId, t.userId, t.type),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "mfa_factors_user_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "mfa_factors_organization_fk",
    }),
    check("mfa_factors_type_check", sql`${t.type} IN ('TOTP')`),
    check("mfa_factors_status_check", sql`${t.status} IN ('pending', 'active', 'disabled')`),
  ],
);

export const mfaRecoveryCodes = pgTable(
  "mfa_recovery_codes",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    mfaFactorId: text("mfa_factor_id").notNull(),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("mfa_recovery_codes_hash_unique").on(t.codeHash),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "mfa_recovery_codes_user_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.mfaFactorId],
      foreignColumns: [mfaFactors.organizationId, mfaFactors.id],
      name: "mfa_recovery_codes_factor_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "mfa_recovery_codes_organization_fk",
    }),
    index("mfa_recovery_codes_user_idx").on(t.organizationId, t.userId),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    requestIpHash: text("request_ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("password_reset_tokens_hash_unique").on(t.tokenHash),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "password_reset_tokens_user_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "password_reset_tokens_organization_fk",
    }),
    index("password_reset_tokens_user_idx").on(t.organizationId, t.userId),
  ],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("email_verification_tokens_hash_unique").on(t.tokenHash),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "email_verification_tokens_user_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "email_verification_tokens_organization_fk",
    }),
    index("email_verification_tokens_user_idx").on(t.organizationId, t.userId),
  ],
);

export const securityEvents = pgTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id"),
    userId: text("user_id"),
    eventType: text("event_type").notNull(),
    severity: text("severity").notNull().default("medium"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    details: text("details"),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "security_events_organization_fk",
    }),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "security_events_user_fk",
    }),
    index("security_events_org_idx").on(t.organizationId, t.occurredAt),
    index("security_events_user_idx").on(t.userId, t.occurredAt),
    check(
      "security_events_event_type_check",
      sql`${t.eventType} IN ('RATE_LIMIT_EXCEEDED', 'LOGIN_BRUTE_FORCE', 'ACCOUNT_LOCKED', 'TOKEN_REUSE_DETECTED', 'SUSPICIOUS_SESSION')`,
    ),
    check("security_events_severity_check", sql`${t.severity} IN ('medium', 'high', 'critical')`),
  ],
);
