import { uuid7 } from "@educapsules/shared";
import { AuthzDomainError } from "./errors.js";
import type { Principal } from "./service.js";
import type { AuthzRepository, ParentLinkRow } from "./repository.js";

/**
 * ParentLink lifecycle (§22, PAR-*). REQUESTED -> CONFIRMED -> (REVOKED).
 * PAR-002: "Claiming a relationship, or knowing a Student's ID or email,
 * shall never be sufficient" — the request step alone never grants
 * anything (enforced structurally: authz/service.ts's resolveParentSources
 * only ever looks at status='confirmed', never 'requested').
 */

export interface RequestContext {
  ipHash: string | null;
}

export async function requestParentLink(
  repo: AuthzRepository,
  requester: Principal,
  input: { parentUserId: string; studentUserId: string; relationship: string },
  ctx: RequestContext,
): Promise<ParentLinkRow> {
  const now = new Date();

  const requesterRoles = await repo.activeUserRoleAssignments(
    requester.organizationId,
    requester.userId,
    now,
  );
  const isSelfServiceParent =
    requester.userId === input.parentUserId && requesterRoles.some((r) => r.roleKey === "PARENT");
  const isStaff = requesterRoles.some((r) => r.roleKey === "TEACHER" || r.roleKey === "ADMIN");
  if (!isSelfServiceParent && !isStaff) {
    throw new AuthzDomainError(
      "forbidden",
      "Only the parent themselves, or a Teacher/Admin acting on their behalf, may request a ParentLink.",
    );
  }

  const parentRoles = await repo.activeUserRoleAssignments(
    requester.organizationId,
    input.parentUserId,
    now,
  );
  if (!parentRoles.some((r) => r.roleKey === "PARENT")) {
    throw new AuthzDomainError(
      "validation_failed",
      "The target user does not hold the PARENT role.",
    );
  }
  const studentRoles = await repo.activeUserRoleAssignments(
    requester.organizationId,
    input.studentUserId,
    now,
  );
  if (!studentRoles.some((r) => r.roleKey === "STUDENT")) {
    throw new AuthzDomainError(
      "validation_failed",
      "The target user does not hold the STUDENT role.",
    );
  }

  const existing = await repo.findConfirmedParentLink(
    requester.organizationId,
    input.parentUserId,
    input.studentUserId,
  );
  if (existing) {
    throw new AuthzDomainError("validation_failed", "A confirmed ParentLink already exists.");
  }

  const id = uuid7();
  const row = await repo.createParentLink({
    id,
    organizationId: requester.organizationId,
    parentUserId: input.parentUserId,
    studentUserId: input.studentUserId,
    relationship: input.relationship,
    requestedBy: requester.userId,
    createdAt: now,
    updatedAt: now,
  });

  // PAR-009: issuance is audited.
  await repo.writeAuditEvent({
    organizationId: requester.organizationId,
    actorUserId: requester.userId,
    actorRole: isSelfServiceParent ? "PARENT" : "STAFF",
    action: "PARENT_LINK_REQUESTED",
    targetType: "parent_link",
    targetId: id,
    ipHash: ctx.ipHash,
    loginSessionId: null,
    occurredAt: now,
    reason: null,
  });

  return row;
}

export async function confirmParentLink(
  repo: AuthzRepository,
  confirmer: Principal,
  linkId: string,
  ctx: RequestContext,
): Promise<void> {
  const now = new Date();

  // PAR-002: confirmation is only ever by an authorized Teacher, Organization
  // or Admin — never the parent confirming their own claim.
  const confirmerRoles = await repo.activeUserRoleAssignments(
    confirmer.organizationId,
    confirmer.userId,
    now,
  );
  if (!confirmerRoles.some((r) => r.roleKey === "TEACHER" || r.roleKey === "ADMIN")) {
    throw new AuthzDomainError("forbidden", "Only a Teacher or Admin may confirm a ParentLink.");
  }

  const link = await repo.findParentLinkById(confirmer.organizationId, linkId);
  if (!link || link.status !== "requested") {
    throw new AuthzDomainError("not_found", "ParentLink not found.");
  }

  await repo.confirmParentLink(linkId, confirmer.userId, now);

  await repo.writeAuditEvent({
    organizationId: confirmer.organizationId,
    actorUserId: confirmer.userId,
    actorRole: "STAFF",
    action: "PARENT_LINK_CONFIRMED",
    targetType: "parent_link",
    targetId: linkId,
    ipHash: ctx.ipHash,
    loginSessionId: null,
    occurredAt: now,
    reason: null,
  });
}

export async function revokeParentLink(
  repo: AuthzRepository,
  revoker: Principal,
  linkId: string,
  reason: string | null,
  ctx: RequestContext,
): Promise<void> {
  const now = new Date();

  // PAR-006: revocable by an authorized Teacher or Admin — not the Parent,
  // not the Student.
  const revokerRoles = await repo.activeUserRoleAssignments(
    revoker.organizationId,
    revoker.userId,
    now,
  );
  if (!revokerRoles.some((r) => r.roleKey === "TEACHER" || r.roleKey === "ADMIN")) {
    throw new AuthzDomainError("forbidden", "Only a Teacher or Admin may revoke a ParentLink.");
  }

  const link = await repo.findParentLinkById(revoker.organizationId, linkId);
  if (!link || link.status === "revoked") {
    throw new AuthzDomainError("not_found", "ParentLink not found.");
  }

  // PAR-006: takes effect immediately.
  await repo.revokeParentLink(linkId, revoker.userId, now);

  // PAR-009: revocation is audited.
  await repo.writeAuditEvent({
    organizationId: revoker.organizationId,
    actorUserId: revoker.userId,
    actorRole: "STAFF",
    action: "PARENT_LINK_REVOKED",
    targetType: "parent_link",
    targetId: linkId,
    ipHash: ctx.ipHash,
    loginSessionId: null,
    occurredAt: now,
    reason,
  });
}
