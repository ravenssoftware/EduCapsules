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
import { organizations, permissions, users } from "./identity.js";

/**
 * Phase 5 — Authorization entities: Assistant delegation and Parent↔Student
 * linking (SRS §7.3/§7.4, §21 AST-*, §22 PAR-*, Table 37.2). `permissions`,
 * `role_permissions` and `user_role_assignments` already exist from Phase 3
 * (identity.ts) — this file only adds what didn't exist yet.
 *
 * AssistantAssignment's scope is modelled as a *set* of scope rows
 * (assistant_assignment_scopes), not a single scope_type/scope_id pair like
 * UserRoleAssignment: §7.3 explicitly states "Cohort scopes (Classroom/
 * Group) and content scopes (Course/Cycle) may be combined in one Assistant
 * Assignment — the caller must satisfy every scope named on the grant."
 * A single scope_type/scope_id column cannot represent a combination; a
 * child table can.
 *
 * The SRS's `PermissionGrant` entity (Table 37.2: "chiefly used for
 * assistant delegation") is realised here as `assistant_assignment_permissions`,
 * a join table on AssistantAssignment — the same shape Phase 3 already
 * established for `role_permissions` — rather than a second, more generic
 * freestanding grant entity Phase 5 has no other confirmed use for.
 */

export const assistantAssignments = sqliteTable(
  "assistant_assignments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    assistantUserId: text("assistant_user_id").notNull(),
    teacherUserId: text("teacher_user_id").notNull(),
    validFrom: integer("valid_from", { mode: "timestamp_ms" }).notNull(),
    /** AST-006: optional expiry; enforced at authorisation time (AST-007), not by a background job. */
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    /** §45.3: PENDING -> ACTIVE -> (EXPIRED | REVOKED | SUSPENDED). Phase 5 code paths only ever produce active/revoked directly — see authz/assistants.ts. */
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    revokedBy: text("revoked_by"),
    revocationReason: text("revocation_reason"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
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

export const assistantAssignmentScopes = sqliteTable(
  "assistant_assignment_scopes",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    assistantAssignmentId: text("assistant_assignment_id").notNull(),
    /** §7.3 scope containment, minus ORG — an Assistant assignment is always a bounded delegation, never organization-wide (AST-002, GEN-006). */
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

export const assistantAssignmentPermissions = sqliteTable(
  "assistant_assignment_permissions",
  {
    organizationId: text("organization_id").notNull(),
    assistantAssignmentId: text("assistant_assignment_id").notNull(),
    permissionId: text("permission_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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

export const parentLinks = sqliteTable(
  "parent_links",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    parentUserId: text("parent_user_id").notNull(),
    studentUserId: text("student_user_id").notNull(),
    /** Free text (e.g. 'parent', 'guardian') — the SRS does not enumerate a closed set for this field. */
    relationship: text("relationship").notNull(),
    requestedBy: text("requested_by"),
    /** PAR-002: only a Teacher, Organization (Admin acting for the org) or Admin may confirm — enforced in the service layer, not by this column. */
    confirmedAt: integer("confirmed_at", { mode: "timestamp_ms" }),
    confirmedBy: text("confirmed_by"),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    revokedBy: text("revoked_by"),
    /** §45.3: REQUESTED -> CONFIRMED -> (REVOKED). A REQUESTED link grants nothing (PAR-002). */
    status: text("status").notNull().default("requested"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
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
