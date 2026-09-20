import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { organizations, users } from "./identity.js";

/**
 * Identity & Authentication entities — SRS §35 (Authentication & Login
 * Sessions), §37.3.1 (Table 37.2: LoginSession, MfaFactor), §44 (Account
 * Lifecycle), §36 (Audit, Logging & Monitoring — SecurityEvent, DB-004).
 * See docs/database/schema-overview.md and docs/auth/authentication.md.
 *
 * Phase 4 scope only: identity + authentication foundation. No
 * authorization/permission tables here (UserRoleAssignment already exists
 * from Phase 3, unchanged) — Phase 5 owns PermissionGrant/
 * AssistantAssignment/ParentLink.
 */

export const loginSessions = sqliteTable(
  "login_sessions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    /** AUTH-102/103: opaque, cryptographically random session credential — only its hash is ever stored. */
    tokenHash: text("token_hash").notNull(),
    /**
     * Table 35.1 session types, plus one implementation-internal value.
     * 'standard' and 'admin' are the two real Table 35.1 types Phase 4
     * issues; 'mfa_pending' is not a Table 35.1 type at all — it is a
     * short-lived, non-authenticated placeholder issued by login() while an
     * MFA challenge is outstanding, and requireValidSession() (apps/api's
     * auth service) rejects it outright regardless of expiry, so it can
     * never be mistaken for a real session (AUTH-110). 'elevated' (re-auth
     * for sensitive actions), 'support_impersonation' and the separate
     * Content Access Session are later-phase features (§2 of
     * docs/architecture/auth-and-authorization.md); left as plain text (no
     * CHECK) rather than a partial enumeration that would need widening
     * every time a later phase adds one.
     */
    sessionType: text("session_type").notNull().default("standard"),
    deviceFingerprint: text("device_fingerprint"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    /** AUTH-116/AUTH-113: set once this session has completed an MFA challenge; admin sessions require this to be non-null. */
    mfaVerifiedAt: integer("mfa_verified_at", { mode: "timestamp_ms" }),
    issuedAt: integer("issued_at", { mode: "timestamp_ms" }).notNull(),
    /** AUTH-104 idle timeout: extended on every authenticated request. */
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
    idleExpiresAt: integer("idle_expires_at", { mode: "timestamp_ms" }).notNull(),
    /** AUTH-104 absolute timeout: fixed at issuance, never extended. */
    absoluteExpiresAt: integer("absolute_expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    /** e.g. logout | logout_all | rotated | password_changed | admin_revoked | reuse_detected | account_locked. */
    revocationReason: text("revocation_reason"),
    /**
     * AUTH-110/AUTH-115: session-token rotation chain. Rotating a session
     * revokes the old row (revocation_reason='rotated') and creates a new
     * one pointing back here, rather than mutating the token in place —
     * this is what makes reuse of an already-rotated token detectable (the
     * presented hash resolves to a row that is revoked specifically for
     * 'rotated', which the auth module treats as a reuse signal and
     * revokes the entire chain, not just this row).
     */
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

export const mfaFactors = sqliteTable(
  "mfa_factors",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    /** AUTH-126: TOTP is the only first-class factor decided so far; passkeys/hardware keys/SSO are explicitly FUTURE. */
    type: text("type").notNull().default("TOTP"),
    /**
     * Encrypted TOTP secret (AES-256-GCM, base64), never plaintext (Table
     * 37.2: "the table stores a reference, never the secret itself").
     * Phase 4 encrypts with a server-held key (src/scripts or the auth
     * module's mfa/secret-cipher.ts) rather than a real external secrets
     * manager, which doesn't exist yet in this project (SEC-034's
     * long-term target) — isolated behind that one module so swapping in
     * a real KMS/secret-manager reference later touches one file, not
     * every caller.
     */
    secretCiphertext: text("secret_ciphertext").notNull(),
    /** pending (enrolled, not yet confirmed) | active | disabled. */
    status: text("status").notNull().default("pending"),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
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

export const mfaRecoveryCodes = sqliteTable(
  "mfa_recovery_codes",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    mfaFactorId: text("mfa_factor_id").notNull(),
    /** AUTH-127: single-use backup code, hashed (SHA-256 — high-entropy random value, not a memorized secret, so Argon2id's slow-hash property is unnecessary here; see docs/auth/authentication.md). */
    codeHash: text("code_hash").notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    /** AUTH-121: short-lived, single-use. Only the hash is stored (AUTH-103). */
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    requestIpHash: text("request_ip_hash"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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

export const emailVerificationTokens = sqliteTable(
  "email_verification_tokens",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    /** AUTH-121 "verified email": short-lived, single-use. Only the hash is stored (AUTH-103). */
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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

export const securityEvents = sqliteTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    /**
     * Nullable, unlike every other table's organization_id: some events
     * (an anonymous rate-limit trip against the public /auth/login
     * endpoint before any credential is even checked) have no resolvable
     * tenant yet. This is a deliberate, narrow exception to DB-011's
     * composite-FK pattern — see docs/database/tenancy-and-security.md.
     */
    organizationId: text("organization_id"),
    userId: text("user_id"),
    /** Table 36.2's Authentication-domain vocabulary, the subset Phase 4 actually raises. */
    eventType: text("event_type").notNull(),
    /** §34.4's own severity vocabulary (Critical/High/Medium) — no invented 'low' tier. */
    severity: text("severity").notNull().default("medium"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    /** Portable JSON-as-text (DB-007). */
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
