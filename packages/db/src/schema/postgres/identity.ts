import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Identity, tenancy and access-control entities — Postgres mirror of
 * ../sqlite/identity.ts. Same table names, same column names, same
 * nullability, same constraints; only the concrete column types differ
 * where the two engines have no shared native type (e.g. native `boolean`
 * and `timestamp with time zone` here vs. SQLite's integer-encoded
 * equivalents). Structural parity between the two files is enforced by
 * src/schema/parity.test.ts. See docs/database/schema-overview.md.
 */

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull().default("active"),
    planId: text("plan_id"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closureReason: text("closure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("organizations_slug_unique").on(t.slug),
    check(
      "organizations_status_check",
      sql`${t.status} IN ('active', 'closure_requested', 'closure_confirmed', 'grace_period', 'read_only', 'archived')`,
    ),
  ],
);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash"),
    status: text("status").notNull().default("active"),
    locale: text("locale").notNull(),
    timezone: text("timezone").notNull(),
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by"),
  },
  (t) => [
    unique("users_org_email_unique").on(t.organizationId, t.email),
    unique("users_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "users_organization_fk",
    }),
    index("users_org_idx").on(t.organizationId),
  ],
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name").notNull(),
    avatarFileId: text("avatar_file_id"),
    bio: text("bio"),
    contactPreferences: text("contact_preferences"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "user_profiles_user_fk",
    }),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id"),
    key: text("key").notNull(),
    name: text("name").notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("roles_org_key_unique").on(t.organizationId, t.key),
    unique("roles_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "roles_organization_fk",
    }),
  ],
);

export const permissions = pgTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    category: text("category").notNull(),
    isDelegatable: boolean("is_delegatable").notNull().default(false),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [unique("permissions_key_unique").on(t.key)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id").notNull(),
    permissionId: text("permission_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
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

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    roleId: text("role_id").notNull(),
    scopeType: text("scope_type").notNull(),
    scopeId: text("scope_id"),
    grantedBy: text("granted_by"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "user_role_assignments_user_fk",
    }),
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
    check(
      "user_role_assignments_scope_type_check",
      sql`${t.scopeType} IN ('ORG', 'CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE')`,
    ),
  ],
);
