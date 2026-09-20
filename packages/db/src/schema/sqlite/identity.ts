import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

/**
 * Identity, tenancy and access-control entities — SRS §37.3.1 (Table 37.2),
 * §8 (Organization & Tenancy). See docs/database/schema-overview.md for the
 * full rationale.
 *
 * Tenant isolation (GEN-019, DB-001, ORG-002): every scoped table below
 * carries organization_id, and every cross-table reference within a tenant
 * is a composite foreign key on (organization_id, id) — DB-011 — so a
 * cross-tenant reference is a foreign-key violation, not just an
 * application bug. `unique().on(organizationId, id)` on a parent table
 * exists ONLY to give child tables something to composite-FK into; `id`
 * alone is already the real primary key and already globally unique.
 */

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull(),
    locale: text("locale").notNull(),
    /** ORG-009: request -> confirm -> grace_period -> read_only -> archived, plus active. */
    status: text("status").notNull().default("active"),
    planId: text("plan_id"),
    /** ORG-010: closure requires a stated reason and Platform Owner/Super Admin authorization. */
    closedAt: integer("closed_at", { mode: "timestamp_ms" }),
    closureReason: text("closure_reason"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    unique("organizations_slug_unique").on(t.slug),
    // ORG-009's lifecycle: request -> confirm -> grace_period -> read_only -> archived, plus active.
    check(
      "organizations_status_check",
      sql`${t.status} IN ('active', 'closure_requested', 'closure_confirmed', 'grace_period', 'read_only', 'archived')`,
    ),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    /** Nullable: not every future auth method (e.g. a future SSO) needs one (AUTH-121, AUTH-126). */
    passwordHash: text("password_hash"),
    /** Table 44.1 / §45.3 account state machine: PENDING -> ACTIVE -> (SUSPENDED|LOCKED|DEACTIVATED) -> ANONYMISED -> PURGED. */
    status: text("status").notNull().default("pending"),
    locale: text("locale").notNull(),
    timezone: text("timezone").notNull(),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
    /** SEC-032/AUTH-117: consecutive failed authentication attempts since the last success; resets on success or on auto-recovery from LOCKED. */
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    /** Set alongside status='locked' (SEC-032); the account is eligible to self-recover to 'active' once this passes — see auth module lockout.ts. */
    lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
    /** AUTH-121: verified email is a precondition for PENDING -> ACTIVE. */
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
    /** DB-017: who created this row (e.g. an inviting Admin); null for self-registration. No FK — see schema-overview.md's DB-017 note. */
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    /** Reserved for the erasure pipeline (§44, Phase 25); unused until then. */
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    /** DB-017: who performed the soft deletion; null while deletedAt is null. */
    deletedBy: text("deleted_by"),
  },
  (t) => [
    // DB-012: email is unique per organization, never globally (Table 37.2).
    unique("users_org_email_unique").on(t.organizationId, t.email),
    // Lets other tenant-scoped tables composite-FK into a specific user
    // within the same organization (DB-011).
    unique("users_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "users_organization_fk",
    }),
    index("users_org_idx").on(t.organizationId),
    // Table 44.1 account states — the full state machine (§45.3), including
    // the two erasure-pipeline terminal states not reachable by any Phase 4
    // code path yet (anonymised/purged are Phase 25, DB-003/§44).
    check(
      "users_status_check",
      sql`${t.status} IN ('pending', 'active', 'suspended', 'locked', 'deactivated', 'anonymised', 'purged')`,
    ),
  ],
);

export const userProfiles = sqliteTable(
  "user_profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name").notNull(),
    /** Forward reference to File (Phase 8, Teacher Storage) — no FK yet; the table doesn't exist. */
    avatarFileId: text("avatar_file_id"),
    bio: text("bio"),
    /** Portable JSON-as-text (DB-007) — never a Postgres-only jsonb type. */
    contactPreferences: text("contact_preferences"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "user_profiles_user_fk",
    }),
  ],
);

export const roles = sqliteTable(
  "roles",
  {
    id: text("id").primaryKey(),
    /** Null = system role (GEN-006: STUDENT, TEACHER, ASSISTANT, PARENT, ADMIN), immutable. */
    organizationId: text("organization_id"),
    key: text("key").notNull(),
    name: text("name").notNull(),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    // Custom, organization-scoped roles must have a unique key within that
    // organization. System roles (organization_id IS NULL) are a separate
    // case SQLite/Postgres unique indexes cannot express directly (NULLs are
    // never equal to each other), so uniqueness among system-role keys is
    // enforced at the application/seed layer instead — documented, not silently assumed.
    unique("roles_org_key_unique").on(t.organizationId, t.key),
    unique("roles_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "roles_organization_fk",
    }),
  ],
);

export const permissions = sqliteTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    /** Global catalogue (§26). Rows are created by migration/seed, never by end users. */
    key: text("key").notNull(),
    category: text("category").notNull(),
    isDelegatable: integer("is_delegatable", { mode: "boolean" }).notNull().default(false),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [unique("permissions_key_unique").on(t.key)],
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id").notNull(),
    permissionId: text("permission_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.id],
      name: "role_permissions_role_fk",
    }),
    foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
      name: "role_permissions_permission_fk",
    }),
  ],
);

export const userRoleAssignments = sqliteTable(
  "user_role_assignments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    roleId: text("role_id").notNull(),
    /** §7.3 scope containment: ORG, CLASSROOM, GROUP, SUBJECT, COURSE. */
    scopeType: text("scope_type").notNull(),
    /** Null when scopeType = ORG (whole-organization scope). Polymorphic — no FK (app-enforced). */
    scopeId: text("scope_id"),
    grantedBy: text("granted_by"),
    validFrom: integer("valid_from", { mode: "timestamp_ms" }).notNull(),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "user_role_assignments_user_fk",
    }),
    // Role's organization_id may be null (system role); a composite FK cannot
    // express "match if not null, else any" portably, so this is a simple FK
    // on role_id alone, cross-checked at the application layer against
    // scopeType/organizationId where the role is organization-scoped.
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.id],
      name: "user_role_assignments_role_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "user_role_assignments_organization_fk",
    }),
    index("user_role_assignments_user_idx").on(t.userId),
    index("user_role_assignments_scope_idx").on(t.scopeType, t.scopeId),
    // Section 7.3 scope containment: ORG, CLASSROOM, GROUP, SUBJECT, COURSE — no others.
    check(
      "user_role_assignments_scope_type_check",
      sql`${t.scopeType} IN ('ORG', 'CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE')`,
    ),
  ],
);
