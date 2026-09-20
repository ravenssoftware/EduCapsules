import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { organizations, permissions, users } from "./identity.js";

/**
 * Phase 5 — Authorization entities. Postgres mirror of ../sqlite/authz.ts —
 * same table/column names, same nullability, same constraints; only the
 * concrete column types differ. Structural parity is enforced by
 * src/schema/parity.test.ts. See that file's header comment for the design
 * rationale (scope-as-a-set, PermissionGrant realised as a join table).
 */

export const assistantAssignments = pgTable(
  "assistant_assignments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    assistantUserId: text("assistant_user_id").notNull(),
    teacherUserId: text("teacher_user_id").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: text("revoked_by"),
    revocationReason: text("revocation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("assistant_assignments_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "assistant_assignments_organization_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.assistantUserId],
      foreignColumns: [users.organizationId, users.id],
      name: "assistant_assignments_assistant_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.teacherUserId],
      foreignColumns: [users.organizationId, users.id],
      name: "assistant_assignments_teacher_fk",
    }),
    index("assistant_assignments_org_assistant_idx").on(t.organizationId, t.assistantUserId),
    index("assistant_assignments_org_teacher_idx").on(t.organizationId, t.teacherUserId),
    check(
      "assistant_assignments_status_check",
      sql`${t.status} IN ('pending', 'active', 'expired', 'revoked', 'suspended')`,
    ),
  ],
);

export const assistantAssignmentScopes = pgTable(
  "assistant_assignment_scopes",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    assistantAssignmentId: text("assistant_assignment_id").notNull(),
    scopeType: text("scope_type").notNull(),
    scopeId: text("scope_id").notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.assistantAssignmentId],
      foreignColumns: [assistantAssignments.organizationId, assistantAssignments.id],
      name: "assistant_assignment_scopes_assignment_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "assistant_assignment_scopes_organization_fk",
    }),
    index("assistant_assignment_scopes_assignment_idx").on(t.assistantAssignmentId),
    index("assistant_assignment_scopes_scope_idx").on(t.organizationId, t.scopeType, t.scopeId),
    check(
      "assistant_assignment_scopes_scope_type_check",
      sql`${t.scopeType} IN ('CLASSROOM', 'GROUP', 'SUBJECT', 'COURSE', 'CYCLE')`,
    ),
  ],
);

export const assistantAssignmentPermissions = pgTable(
  "assistant_assignment_permissions",
  {
    organizationId: text("organization_id").notNull(),
    assistantAssignmentId: text("assistant_assignment_id").notNull(),
    permissionId: text("permission_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.assistantAssignmentId, t.permissionId] }),
    foreignKey({
      columns: [t.organizationId, t.assistantAssignmentId],
      foreignColumns: [assistantAssignments.organizationId, assistantAssignments.id],
      name: "assistant_assignment_permissions_assignment_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "assistant_assignment_permissions_organization_fk",
    }),
    foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
      name: "assistant_assignment_permissions_permission_fk",
    }),
  ],
);

export const parentLinks = pgTable(
  "parent_links",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    parentUserId: text("parent_user_id").notNull(),
    studentUserId: text("student_user_id").notNull(),
    relationship: text("relationship").notNull(),
    requestedBy: text("requested_by"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: text("confirmed_by"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: text("revoked_by"),
    status: text("status").notNull().default("requested"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "parent_links_organization_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.parentUserId],
      foreignColumns: [users.organizationId, users.id],
      name: "parent_links_parent_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.studentUserId],
      foreignColumns: [users.organizationId, users.id],
      name: "parent_links_student_fk",
    }),
    index("parent_links_org_parent_idx").on(t.organizationId, t.parentUserId),
    index("parent_links_org_student_idx").on(t.organizationId, t.studentUserId),
    check("parent_links_status_check", sql`${t.status} IN ('requested', 'confirmed', 'revoked')`),
  ],
);
