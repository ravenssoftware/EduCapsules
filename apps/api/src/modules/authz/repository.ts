import { and, eq, isNull } from "drizzle-orm";
import { uuid7 } from "@educapsules/shared";
import type { ScopeRef, ScopeType } from "./scope.js";

/**
 * Persistence layer for the authz module (docs/architecture/backend.md
 * §1's Persistence layer) — same duck-typing pattern as
 * ../auth/repository.ts (one implementation serves both the SQLite and
 * PostgreSQL schema modules; parity between them is enforced by
 * packages/db/src/schema/parity.test.ts).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RoleAssignmentRow {
  roleId: string;
  roleKey: string;
  scopeType: ScopeType;
  scopeId: string | null;
}

export interface AssistantAssignmentRow {
  id: string;
  organizationId: string;
  assistantUserId: string;
  teacherUserId: string;
  validFrom: Date;
  validUntil: Date | null;
  status: string;
  revokedAt: Date | null;
}

export interface ParentLinkRow {
  id: string;
  organizationId: string;
  parentUserId: string;
  studentUserId: string;
  relationship: string;
  status: string;
  confirmedAt: Date | null;
  revokedAt: Date | null;
}

export interface AuthzRepository {
  /** One level up the containment tree — null once at ORG or if the parent row is missing (defensive; should not happen given FK integrity). */
  findParentScope(organizationId: string, scope: ScopeRef): Promise<ScopeRef | null>;

  /** All ACTIVE, not-yet-expired role assignments for this user (SEC-013's "organization role assignment" source, and the generic role-permission path every role — including ADMIN's own conservative grants — resolves through). */
  activeUserRoleAssignments(
    organizationId: string,
    userId: string,
    now: Date,
  ): Promise<RoleAssignmentRow[]>;

  /** Bulk permission-key lookup for a set of roles — the RolePermission baseline (Table 37.2). */
  permissionKeysForRoles(roleIds: string[]): Promise<Map<string, Set<string>>>;

  /** classrooms.homeroom_teacher_id — one of the two ownership sources §7.4 names ("ownership or organization assignment"). */
  classroomOwnerTeacherId(organizationId: string, classroomId: string): Promise<string | null>;
  /** courses.owner_teacher_id — the content-tree counterpart. */
  courseOwnerTeacherId(organizationId: string, courseId: string): Promise<string | null>;

  /** SEC-015: an active Membership row for this user against this specific classroom/group. */
  hasActiveMembership(
    organizationId: string,
    userId: string,
    containerType: "classroom" | "group",
    containerId: string,
  ): Promise<boolean>;
  /** Every classroom/group a student currently has an active Membership in — used to resolve Parent -> Student -> scope transitively. */
  activeMembershipsForUser(
    organizationId: string,
    userId: string,
  ): Promise<Array<{ containerType: "classroom" | "group"; containerId: string }>>;

  /** SEC-012: a CONFIRMED, not-revoked ParentLink for this exact parent+student pair. "ACTIVE" in §7.4's prose — see docs/authz/authorization.md for why CONFIRMED-and-not-revoked is the resolved reading. */
  findConfirmedParentLink(
    organizationId: string,
    parentUserId: string,
    studentUserId: string,
  ): Promise<ParentLinkRow | null>;
  createParentLink(row: {
    id: string;
    organizationId: string;
    parentUserId: string;
    studentUserId: string;
    relationship: string;
    requestedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<ParentLinkRow>;
  findParentLinkById(organizationId: string, id: string): Promise<ParentLinkRow | null>;
  confirmParentLink(id: string, confirmedBy: string, at: Date): Promise<void>;
  revokeParentLink(id: string, revokedBy: string, at: Date): Promise<void>;
  listParentLinksForParent(organizationId: string, parentUserId: string): Promise<ParentLinkRow[]>;
  listParentLinksForStudent(
    organizationId: string,
    studentUserId: string,
  ): Promise<ParentLinkRow[]>;

  /** SEC-014: every currently-ACTIVE (status='active', not expired) AssistantAssignment for this assistant. Expiry is evaluated by the caller against `validUntil` at authorisation time (AST-007) — this does not filter by validUntil itself, only by the stored `status`. */
  activeAssistantAssignmentsForAssistant(
    organizationId: string,
    assistantUserId: string,
  ): Promise<AssistantAssignmentRow[]>;
  assignmentScopes(organizationId: string, assignmentId: string): Promise<ScopeRef[]>;
  assignmentPermissionKeys(organizationId: string, assignmentId: string): Promise<Set<string>>;

  createAssistantAssignment(row: {
    id: string;
    organizationId: string;
    assistantUserId: string;
    teacherUserId: string;
    validFrom: Date;
    validUntil: Date | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    scopes: ScopeRef[];
    permissionKeys: string[];
  }): Promise<AssistantAssignmentRow>;
  findAssistantAssignmentById(
    organizationId: string,
    id: string,
  ): Promise<AssistantAssignmentRow | null>;
  revokeAssistantAssignment(id: string, revokedBy: string, reason: string, at: Date): Promise<void>;
  listAssistantAssignmentsForTeacher(
    organizationId: string,
    teacherUserId: string,
  ): Promise<AssistantAssignmentRow[]>;
  listAssistantAssignmentsForAssistant(
    organizationId: string,
    assistantUserId: string,
  ): Promise<AssistantAssignmentRow[]>;

  permissionIdForKey(key: string): Promise<string | null>;

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
}

function toAssistantAssignmentRow(r: any): AssistantAssignmentRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    assistantUserId: r.assistantUserId,
    teacherUserId: r.teacherUserId,
    validFrom: r.validFrom,
    validUntil: r.validUntil ?? null,
    status: r.status,
    revokedAt: r.revokedAt ?? null,
  };
}

function toParentLinkRow(r: any): ParentLinkRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    parentUserId: r.parentUserId,
    studentUserId: r.studentUserId,
    relationship: r.relationship,
    status: r.status,
    confirmedAt: r.confirmedAt ?? null,
    revokedAt: r.revokedAt ?? null,
  };
}

export function createAuthzRepository(db: any, schema: any): AuthzRepository {
  return {
    async findParentScope(organizationId, scope) {
      if (scope.scopeType === "ORG") return null;
      if (scope.scopeType === "CLASSROOM") return { scopeType: "ORG", scopeId: null };
      if (scope.scopeType === "SUBJECT") return { scopeType: "ORG", scopeId: null };
      if (scope.scopeType === "GROUP") {
        const rows = await db
          .select({ classroomId: schema.groups.classroomId })
          .from(schema.groups)
          .where(
            and(
              eq(schema.groups.organizationId, organizationId),
              eq(schema.groups.id, scope.scopeId),
            ),
          );
        const row = rows[0];
        return row ? { scopeType: "CLASSROOM", scopeId: row.classroomId } : null;
      }
      if (scope.scopeType === "COURSE") {
        const rows = await db
          .select({ subjectId: schema.courses.subjectId })
          .from(schema.courses)
          .where(
            and(
              eq(schema.courses.organizationId, organizationId),
              eq(schema.courses.id, scope.scopeId),
            ),
          );
        const row = rows[0];
        return row ? { scopeType: "SUBJECT", scopeId: row.subjectId } : null;
      }
      if (scope.scopeType === "CYCLE") {
        const rows = await db
          .select({ courseId: schema.cycles.courseId })
          .from(schema.cycles)
          .where(
            and(
              eq(schema.cycles.organizationId, organizationId),
              eq(schema.cycles.id, scope.scopeId),
            ),
          );
        const row = rows[0];
        return row ? { scopeType: "COURSE", scopeId: row.courseId } : null;
      }
      return null;
    },

    async activeUserRoleAssignments(organizationId, userId, now) {
      const rows = await db
        .select({
          roleId: schema.userRoleAssignments.roleId,
          roleKey: schema.roles.key,
          scopeType: schema.userRoleAssignments.scopeType,
          scopeId: schema.userRoleAssignments.scopeId,
          validUntil: schema.userRoleAssignments.validUntil,
        })
        .from(schema.userRoleAssignments)
        .innerJoin(schema.roles, eq(schema.userRoleAssignments.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.userRoleAssignments.organizationId, organizationId),
            eq(schema.userRoleAssignments.userId, userId),
            eq(schema.userRoleAssignments.status, "active"),
          ),
        );
      return rows
        .filter((r: any) => !r.validUntil || r.validUntil.getTime() > now.getTime())
        .map((r: any) => ({
          roleId: r.roleId,
          roleKey: r.roleKey,
          scopeType: r.scopeType,
          scopeId: r.scopeId ?? null,
        }));
    },

    async permissionKeysForRoles(roleIds) {
      const result = new Map<string, Set<string>>();
      if (roleIds.length === 0) return result;
      const rows = await db
        .select({
          roleId: schema.rolePermissions.roleId,
          key: schema.permissions.key,
        })
        .from(schema.rolePermissions)
        .innerJoin(
          schema.permissions,
          eq(schema.rolePermissions.permissionId, schema.permissions.id),
        );
      for (const r of rows as any[]) {
        if (!roleIds.includes(r.roleId)) continue;
        const set = result.get(r.roleId) ?? new Set<string>();
        set.add(r.key);
        result.set(r.roleId, set);
      }
      return result;
    },

    async classroomOwnerTeacherId(organizationId, classroomId) {
      const rows = await db
        .select({ homeroomTeacherId: schema.classrooms.homeroomTeacherId })
        .from(schema.classrooms)
        .where(
          and(
            eq(schema.classrooms.organizationId, organizationId),
            eq(schema.classrooms.id, classroomId),
          ),
        );
      return rows[0]?.homeroomTeacherId ?? null;
    },

    async courseOwnerTeacherId(organizationId, courseId) {
      const rows = await db
        .select({ ownerTeacherId: schema.courses.ownerTeacherId })
        .from(schema.courses)
        .where(
          and(eq(schema.courses.organizationId, organizationId), eq(schema.courses.id, courseId)),
        );
      return rows[0]?.ownerTeacherId ?? null;
    },

    async hasActiveMembership(organizationId, userId, containerType, containerId) {
      const rows = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.organizationId, organizationId),
            eq(schema.memberships.userId, userId),
            eq(schema.memberships.containerType, containerType),
            eq(schema.memberships.containerId, containerId),
            eq(schema.memberships.status, "active"),
            isNull(schema.memberships.leftAt),
          ),
        );
      return rows.length > 0;
    },

    async activeMembershipsForUser(organizationId, userId) {
      const rows = await db
        .select({
          containerType: schema.memberships.containerType,
          containerId: schema.memberships.containerId,
        })
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.organizationId, organizationId),
            eq(schema.memberships.userId, userId),
            eq(schema.memberships.status, "active"),
            isNull(schema.memberships.leftAt),
          ),
        );
      return rows;
    },

    async findConfirmedParentLink(organizationId, parentUserId, studentUserId) {
      const rows = await db
        .select()
        .from(schema.parentLinks)
        .where(
          and(
            eq(schema.parentLinks.organizationId, organizationId),
            eq(schema.parentLinks.parentUserId, parentUserId),
            eq(schema.parentLinks.studentUserId, studentUserId),
            eq(schema.parentLinks.status, "confirmed"),
            isNull(schema.parentLinks.revokedAt),
          ),
        );
      return rows[0] ? toParentLinkRow(rows[0]) : null;
    },

    async createParentLink(row) {
      await db.insert(schema.parentLinks).values({
        id: row.id,
        organizationId: row.organizationId,
        parentUserId: row.parentUserId,
        studentUserId: row.studentUserId,
        relationship: row.relationship,
        requestedBy: row.requestedBy,
        status: "requested",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        parentUserId: row.parentUserId,
        studentUserId: row.studentUserId,
        relationship: row.relationship,
        status: "requested",
        confirmedAt: null,
        revokedAt: null,
      };
    },

    async findParentLinkById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.parentLinks)
        .where(
          and(eq(schema.parentLinks.organizationId, organizationId), eq(schema.parentLinks.id, id)),
        );
      return rows[0] ? toParentLinkRow(rows[0]) : null;
    },

    async confirmParentLink(id, confirmedBy, at) {
      await db
        .update(schema.parentLinks)
        .set({ status: "confirmed", confirmedAt: at, confirmedBy, updatedAt: at })
        .where(eq(schema.parentLinks.id, id));
    },

    async revokeParentLink(id, revokedBy, at) {
      await db
        .update(schema.parentLinks)
        .set({ status: "revoked", revokedAt: at, revokedBy, updatedAt: at })
        .where(eq(schema.parentLinks.id, id));
    },

    async listParentLinksForParent(organizationId, parentUserId) {
      const rows = await db
        .select()
        .from(schema.parentLinks)
        .where(
          and(
            eq(schema.parentLinks.organizationId, organizationId),
            eq(schema.parentLinks.parentUserId, parentUserId),
          ),
        );
      return rows.map(toParentLinkRow);
    },

    async listParentLinksForStudent(organizationId, studentUserId) {
      const rows = await db
        .select()
        .from(schema.parentLinks)
        .where(
          and(
            eq(schema.parentLinks.organizationId, organizationId),
            eq(schema.parentLinks.studentUserId, studentUserId),
          ),
        );
      return rows.map(toParentLinkRow);
    },

    async activeAssistantAssignmentsForAssistant(organizationId, assistantUserId) {
      const rows = await db
        .select()
        .from(schema.assistantAssignments)
        .where(
          and(
            eq(schema.assistantAssignments.organizationId, organizationId),
            eq(schema.assistantAssignments.assistantUserId, assistantUserId),
            eq(schema.assistantAssignments.status, "active"),
          ),
        );
      return rows.map(toAssistantAssignmentRow);
    },

    async assignmentScopes(organizationId, assignmentId) {
      const rows = await db
        .select({
          scopeType: schema.assistantAssignmentScopes.scopeType,
          scopeId: schema.assistantAssignmentScopes.scopeId,
        })
        .from(schema.assistantAssignmentScopes)
        .where(
          and(
            eq(schema.assistantAssignmentScopes.organizationId, organizationId),
            eq(schema.assistantAssignmentScopes.assistantAssignmentId, assignmentId),
          ),
        );
      return rows;
    },

    async assignmentPermissionKeys(organizationId, assignmentId) {
      const rows = await db
        .select({ key: schema.permissions.key })
        .from(schema.assistantAssignmentPermissions)
        .innerJoin(
          schema.permissions,
          eq(schema.assistantAssignmentPermissions.permissionId, schema.permissions.id),
        )
        .where(
          and(
            eq(schema.assistantAssignmentPermissions.organizationId, organizationId),
            eq(schema.assistantAssignmentPermissions.assistantAssignmentId, assignmentId),
          ),
        );
      return new Set(rows.map((r: any) => r.key));
    },

    async createAssistantAssignment(row) {
      await db.insert(schema.assistantAssignments).values({
        id: row.id,
        organizationId: row.organizationId,
        assistantUserId: row.assistantUserId,
        teacherUserId: row.teacherUserId,
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      if (row.scopes.length > 0) {
        await db.insert(schema.assistantAssignmentScopes).values(
          row.scopes.map((s) => ({
            id: uuid7(),
            organizationId: row.organizationId,
            assistantAssignmentId: row.id,
            scopeType: s.scopeType,
            scopeId: s.scopeId,
          })),
        );
      }
      if (row.permissionKeys.length > 0) {
        const permIds = await Promise.all(
          row.permissionKeys.map(async (key) => {
            const rows = await db
              .select({ id: schema.permissions.id })
              .from(schema.permissions)
              .where(eq(schema.permissions.key, key));
            return rows[0]?.id as string | undefined;
          }),
        );
        await db.insert(schema.assistantAssignmentPermissions).values(
          permIds
            .filter((id): id is string => Boolean(id))
            .map((permissionId) => ({
              organizationId: row.organizationId,
              assistantAssignmentId: row.id,
              permissionId,
              createdAt: row.createdAt,
            })),
        );
      }
      return {
        id: row.id,
        organizationId: row.organizationId,
        assistantUserId: row.assistantUserId,
        teacherUserId: row.teacherUserId,
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        status: "active",
        revokedAt: null,
      };
    },

    async findAssistantAssignmentById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.assistantAssignments)
        .where(
          and(
            eq(schema.assistantAssignments.organizationId, organizationId),
            eq(schema.assistantAssignments.id, id),
          ),
        );
      return rows[0] ? toAssistantAssignmentRow(rows[0]) : null;
    },

    async revokeAssistantAssignment(id, revokedBy, reason, at) {
      await db
        .update(schema.assistantAssignments)
        .set({
          status: "revoked",
          revokedAt: at,
          revokedBy,
          revocationReason: reason,
          updatedAt: at,
        })
        .where(eq(schema.assistantAssignments.id, id));
    },

    async listAssistantAssignmentsForTeacher(organizationId, teacherUserId) {
      const rows = await db
        .select()
        .from(schema.assistantAssignments)
        .where(
          and(
            eq(schema.assistantAssignments.organizationId, organizationId),
            eq(schema.assistantAssignments.teacherUserId, teacherUserId),
          ),
        );
      return rows.map(toAssistantAssignmentRow);
    },

    async listAssistantAssignmentsForAssistant(organizationId, assistantUserId) {
      const rows = await db
        .select()
        .from(schema.assistantAssignments)
        .where(
          and(
            eq(schema.assistantAssignments.organizationId, organizationId),
            eq(schema.assistantAssignments.assistantUserId, assistantUserId),
          ),
        );
      return rows.map(toAssistantAssignmentRow);
    },

    async permissionIdForKey(key) {
      const rows = await db
        .select({ id: schema.permissions.id })
        .from(schema.permissions)
        .where(eq(schema.permissions.key, key));
      return rows[0]?.id ?? null;
    },

    async writeAuditEvent(row) {
      await db.insert(schema.auditLog).values({
        id: uuid7(),
        organizationId: row.organizationId,
        actorUserId: row.actorUserId,
        actorRole: row.actorRole,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        beforeRef: null,
        afterRef: null,
        ipHash: row.ipHash,
        loginSessionId: row.loginSessionId,
        occurredAt: row.occurredAt,
        reason: row.reason,
      });
    },
  };
}
