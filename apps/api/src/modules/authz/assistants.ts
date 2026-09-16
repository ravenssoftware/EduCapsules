import { uuid7 } from "@educapsules/shared";
import type { PermissionKey } from "@educapsules/shared";
import { EDUCATIONAL_PERMISSIONS } from "@educapsules/shared";
import { AuthzDomainError } from "./errors.js";
import { authorize, type Principal } from "./service.js";
import type { ScopeRef } from "./scope.js";
import type { AssistantAssignmentRow, AuthzRepository } from "./repository.js";

/**
 * AssistantAssignment lifecycle (§21, AST-*). This is the one place a
 * delegation is created or revoked — never done ad hoc from a route
 * handler — so the GEN-025/SEC-006 non-amplification check (the grantor
 * must currently hold every delegated permission, in every named scope,
 * themselves) can never be bypassed by a caller that forgot to run it.
 */

const DELEGATABLE_KEYS = new Set<string>(
  EDUCATIONAL_PERMISSIONS.filter((p) => p.isDelegatable).map((p) => p.key),
);

export interface RequestContext {
  ipHash: string | null;
}

export async function createAssistantAssignment(
  repo: AuthzRepository,
  teacher: Principal,
  input: {
    assistantUserId: string;
    scopes: ScopeRef[];
    permissionKeys: PermissionKey[];
    validFrom?: Date;
    validUntil?: Date | null;
  },
  ctx: RequestContext,
): Promise<AssistantAssignmentRow> {
  const now = new Date();

  // AST-002: an assignment must be explicitly, non-emptily scoped —
  // "being an Assistant, on its own, grants nothing" (GEN-006).
  if (input.scopes.length === 0) {
    throw new AuthzDomainError("validation_failed", "At least one scope is required.");
  }
  if (input.permissionKeys.length === 0) {
    throw new AuthzDomainError("validation_failed", "At least one permission is required.");
  }

  // AST-004/§26.2's closed, per-row delegability column: only §26.2
  // permissions marked delegatable may ever appear on an assignment — never
  // an administrative (§26.3) code, and never one of §26.2's own
  // structurally-non-delegatable rows (CREATE_ACHIEVEMENT, ADJUST_POINTS,
  // MANAGE_STORAGE_PERMISSIONS, ASSIGN_ASSISTANT).
  for (const key of input.permissionKeys) {
    if (!DELEGATABLE_KEYS.has(key)) {
      throw new AuthzDomainError("validation_failed", `${key} is not a delegatable permission.`);
    }
  }

  // AST-001: the target account must actually be an Assistant.
  const assistantRoles = await repo.activeUserRoleAssignments(
    teacher.organizationId,
    input.assistantUserId,
    now,
  );
  if (!assistantRoles.some((r) => r.roleKey === "ASSISTANT")) {
    throw new AuthzDomainError(
      "validation_failed",
      "The target user does not hold the ASSISTANT role in this organization.",
    );
  }

  // SEC-006/GEN-025 — the heart of "no privilege amplification": for every
  // (scope, permission) pair being delegated, the delegating Teacher must
  // CURRENTLY hold that exact permission covering that exact scope. This
  // runs the same pipeline every ordinary request goes through — there is
  // no separate, weaker check for "am I allowed to delegate this."
  for (const scope of input.scopes) {
    for (const permissionKey of input.permissionKeys) {
      try {
        await authorize(
          repo,
          teacher,
          { scopeType: scope.scopeType, scopeId: scope.scopeId },
          now,
          {
            permissionKey,
          },
        );
      } catch {
        throw new AuthzDomainError(
          "forbidden",
          `You do not hold ${permissionKey} in ${scope.scopeType}:${scope.scopeId} — cannot delegate a permission you do not have.`,
        );
      }
    }
  }

  const id = uuid7();
  const row = await repo.createAssistantAssignment({
    id,
    organizationId: teacher.organizationId,
    assistantUserId: input.assistantUserId,
    teacherUserId: teacher.userId,
    validFrom: input.validFrom ?? now,
    validUntil: input.validUntil ?? null,
    createdBy: teacher.userId,
    createdAt: now,
    updatedAt: now,
    scopes: input.scopes,
    permissionKeys: input.permissionKeys,
  });

  // AST-005: every grant is audited and visible to the delegating Teacher.
  await repo.writeAuditEvent({
    organizationId: teacher.organizationId,
    actorUserId: teacher.userId,
    actorRole: "TEACHER",
    action: "ASSISTANT_ASSIGNMENT_CREATED",
    targetType: "assistant_assignment",
    targetId: id,
    ipHash: ctx.ipHash,
    loginSessionId: null,
    occurredAt: now,
    reason: null,
  });

  return row;
}

export async function revokeAssistantAssignment(
  repo: AuthzRepository,
  caller: Principal,
  assignmentId: string,
  reason: string | null,
  ctx: RequestContext,
): Promise<void> {
  const now = new Date();
  const assignment = await repo.findAssistantAssignmentById(caller.organizationId, assignmentId);
  if (!assignment || assignment.status !== "active") {
    throw new AuthzDomainError("not_found", "Assignment not found.");
  }

  // Symmetric with PAR-006 (ParentLink revocation): the delegating Teacher
  // themselves, or an Admin — nobody else, and never the Assistant (AST-004's
  // "never has: ... self-granted permissions" extends to self-revocation
  // being meaningless as a security boundary either way, but is not this
  // function's job to grant).
  const isDelegatingTeacher = caller.userId === assignment.teacherUserId;
  const callerRoles = await repo.activeUserRoleAssignments(
    caller.organizationId,
    caller.userId,
    now,
  );
  const isAdmin = callerRoles.some((r) => r.roleKey === "ADMIN");
  if (!isDelegatingTeacher && !isAdmin) {
    throw new AuthzDomainError("not_found", "Assignment not found.");
  }

  // AST-007: immediate, while preserving the historical row and its
  // attribution — this is an UPDATE of status/revoked_at, never a delete.
  await repo.revokeAssistantAssignment(assignmentId, caller.userId, reason ?? "revoked", now);

  await repo.writeAuditEvent({
    organizationId: caller.organizationId,
    actorUserId: caller.userId,
    actorRole: isAdmin && !isDelegatingTeacher ? "ADMIN" : "TEACHER",
    action: "ASSISTANT_ASSIGNMENT_REVOKED",
    targetType: "assistant_assignment",
    targetId: assignmentId,
    ipHash: ctx.ipHash,
    loginSessionId: null,
    occurredAt: now,
    reason,
  });
}
