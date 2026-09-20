import type { PermissionKey } from "@educapsules/shared";
import { AuthzDomainError } from "./errors.js";
import { grantCoversTarget, resolveAncestorChain, type ScopeRef, type ScopeType } from "./scope.js";
import type { AuthzRepository } from "./repository.js";

/**
 * The centralized authorization pipeline (§7.1) — the ONE place every
 * protected operation's identity/session/tenant/role/scope/relationship/
 * permission decision is made (docs/architecture/auth-and-authorization.md
 * §1). No route handler or service implements its own ad hoc check; every
 * one calls `authorize()` (or the `requirePermission()`/`requireRelationship()`
 * middleware wrapping it) instead.
 *
 * Tenant isolation is structural, not a stage that can be forgotten:
 * `Principal.organizationId` always comes from the caller's *validated
 * session* (never a client-supplied field — SEC-004), and every repository
 * query below is scoped by it. There is no code path here that accepts an
 * organization id as an argument from anywhere else.
 *
 * Entitlement (§7.5, SEC-016..018) is a deliberate no-op: no
 * Entitlement/subscription/commercial entity exists in this codebase yet
 * (a later, not-yet-built phase's concern) — there is nothing to check
 * against. Documented here rather than silently omitted.
 */

export interface Principal {
  organizationId: string;
  userId: string;
}

export interface AuthzTarget {
  scopeType: ScopeType;
  /** Null only for scopeType 'ORG'. */
  scopeId: string | null;
  /**
   * Set when the check is against a *specific, already-identified* object
   * (e.g. GET /classrooms/:id) — governs SEC-009: a denial for a target
   * carrying `objectId` is reported as `not_found`, indistinguishable from
   * the object genuinely not existing. Omitted for checks that aren't
   * about a specific object's existence (e.g. "may I create a classroom in
   * this org at all") — those deny as `forbidden`, since there is nothing
   * to disclose the existence of.
   */
  objectId?: string;
}

export type AuthoritySourceKind =
  "role" | "teacher_ownership" | "student_membership" | "parent_link" | "assistant_assignment";

export interface AuthoritySource {
  kind: AuthoritySourceKind;
  /** Present for every kind — empty for the purely relationship-based kinds (student_membership, parent_link), which never satisfy a permission-gated check on their own (§6.1: Student/Parent hold no catalogue permissions). */
  permissionKeys: Set<string>;
  /** Present only for kind 'assistant_assignment' — which delegation record this authority came from (AST-005 audit attribution). */
  assistantAssignmentId?: string;
  /** Present only for kind 'parent_link' — which student this visibility is through. */
  viaStudentUserId?: string;
}

export interface AuthorityDecision {
  sources: AuthoritySource[];
}

/**
 * Role- and ownership-based authority ONLY (no Student/Parent/Assistant
 * relationship sources) — used both for a principal's own request AND,
 * non-recursively, to re-verify a *delegating Teacher's* current authority
 * when checking an Assistant's request (SEC-014). Keeping this the one
 * shared implementation means the live re-check can never drift from what
 * "the Teacher holds this permission" actually means elsewhere in the
 * pipeline.
 */
async function resolveDirectAuthority(
  repo: AuthzRepository,
  principal: Principal,
  targetChain: ScopeRef[],
  now: Date,
): Promise<AuthoritySource[]> {
  const sources: AuthoritySource[] = [];

  const assignments = await repo.activeUserRoleAssignments(
    principal.organizationId,
    principal.userId,
    now,
  );
  const permissionMap = await repo.permissionKeysForRoles(assignments.map((a) => a.roleId));

  for (const assignment of assignments) {
    const permissionKeys = permissionMap.get(assignment.roleId) ?? new Set<string>();
    // GEN-006-style principle applied uniformly: holding a role that
    // carries no catalogue permissions (STUDENT, PARENT, ASSISTANT — none
    // of which have any role_permissions rows by design, see
    // packages/db/src/seed/data.ts) grants nothing on its own, no matter
    // how widely that role assignment happens to be scoped. Their actual
    // authority comes entirely from the dedicated relationship sources
    // below (membership, ParentLink, AssistantAssignment) — never from
    // simply holding the role. Without this guard, an ORG-wide STUDENT/
    // PARENT role assignment (the normal shape for those roles, since
    // their authority isn't scope-bound the way a Teacher's is) would
    // silently satisfy the plain relationship check for every scope in the
    // organization purely because ORG grants match everything.
    if (permissionKeys.size === 0) continue;
    const grantedScope: ScopeRef = { scopeType: assignment.scopeType, scopeId: assignment.scopeId };
    if (grantCoversTarget(grantedScope, targetChain)) {
      sources.push({ kind: "role", permissionKeys });
    }
  }

  // Teacher ownership (§7.4: "Teacher -> Classroom/Course: ownership OR
  // organization role assignment") — a second, independent authority
  // source alongside the role-assignment one above, not a replacement for
  // it: a Teacher must still currently hold an active TEACHER role
  // assignment somewhere in the org to be "acting as a teacher" at all;
  // ownership of a *specific* classroom/course is what tells the pipeline
  // *which* scope that authority reaches, without requiring a redundant
  // per-classroom UserRoleAssignment row for every classroom a Teacher owns.
  const teacherAssignment = assignments.find((a) => a.roleKey === "TEACHER");
  if (teacherAssignment) {
    const teacherPermissionKeys = permissionMap.get(teacherAssignment.roleId) ?? new Set();
    const classroomNode = targetChain.find((s) => s.scopeType === "CLASSROOM");
    if (classroomNode?.scopeId) {
      const ownerId = await repo.classroomOwnerTeacherId(
        principal.organizationId,
        classroomNode.scopeId,
      );
      if (ownerId === principal.userId) {
        sources.push({ kind: "teacher_ownership", permissionKeys: teacherPermissionKeys });
      }
    }
    const courseNode = targetChain.find((s) => s.scopeType === "COURSE");
    if (courseNode?.scopeId) {
      const ownerId = await repo.courseOwnerTeacherId(principal.organizationId, courseNode.scopeId);
      if (ownerId === principal.userId) {
        sources.push({ kind: "teacher_ownership", permissionKeys: teacherPermissionKeys });
      }
    }
  }

  return sources;
}

async function resolveStudentSources(
  repo: AuthzRepository,
  principal: Principal,
  targetChain: ScopeRef[],
): Promise<AuthoritySource[]> {
  const sources: AuthoritySource[] = [];
  for (const node of targetChain) {
    if (node.scopeType !== "CLASSROOM" && node.scopeType !== "GROUP") continue;
    if (!node.scopeId) continue;
    const containerType = node.scopeType === "CLASSROOM" ? "classroom" : "group";
    const isMember = await repo.hasActiveMembership(
      principal.organizationId,
      principal.userId,
      containerType,
      node.scopeId,
    );
    if (isMember) sources.push({ kind: "student_membership", permissionKeys: new Set() });
  }
  return sources;
}

async function resolveParentSources(
  repo: AuthzRepository,
  principal: Principal,
  targetChain: ScopeRef[],
  now: Date,
): Promise<AuthoritySource[]> {
  // PAR-000/Table 6.1: Parent authority derives from role + a verified
  // relationship — a PARENT role assignment alone (no confirmed link) or a
  // confirmed link without the role would each be insufficient on their own.
  const assignments = await repo.activeUserRoleAssignments(
    principal.organizationId,
    principal.userId,
    now,
  );
  if (!assignments.some((a) => a.roleKey === "PARENT")) return [];

  const links = await repo.listParentLinksForParent(principal.organizationId, principal.userId);
  const confirmedStudentIds = links
    .filter((l) => l.status === "confirmed" && !l.revokedAt)
    .map((l) => l.studentUserId);

  const sources: AuthoritySource[] = [];
  for (const studentUserId of confirmedStudentIds) {
    const memberships = await repo.activeMembershipsForUser(
      principal.organizationId,
      studentUserId,
    );
    const covered = memberships.some((m) => {
      const nodeType = m.containerType === "classroom" ? "CLASSROOM" : "GROUP";
      return targetChain.some(
        (node) => node.scopeType === nodeType && node.scopeId === m.containerId,
      );
    });
    if (covered) {
      sources.push({
        kind: "parent_link",
        permissionKeys: new Set(),
        viaStudentUserId: studentUserId,
      });
    }
  }
  return sources;
}

async function resolveAssistantSources(
  repo: AuthzRepository,
  principal: Principal,
  targetChain: ScopeRef[],
  now: Date,
): Promise<AuthoritySource[]> {
  const sources: AuthoritySource[] = [];
  const assignments = await repo.activeAssistantAssignmentsForAssistant(
    principal.organizationId,
    principal.userId,
  );

  for (const assignment of assignments) {
    // AST-006/AST-007: expiry is evaluated here, at authorisation time —
    // never by a background job flipping `status`.
    if (assignment.validUntil && assignment.validUntil.getTime() <= now.getTime()) continue;

    const scopes = await repo.assignmentScopes(principal.organizationId, assignment.id);
    // SRS §7.3: "the caller must satisfy every scope named on the grant" —
    // every recorded scope row must contain the target on ITS OWN tree; a
    // scope row from a tree the target has no node in (e.g. a COURSE scope
    // on a plain CLASSROOM target) cannot be satisfied by this target, so
    // the whole assignment does not apply to it.
    const allScopesSatisfied =
      scopes.length > 0 &&
      scopes.every((s) => {
        const sameTree = targetChain.some((node) => node.scopeType === s.scopeType);
        return sameTree && grantCoversTarget(s, targetChain);
      });
    if (!allScopesSatisfied) continue;

    const delegatedKeys = await repo.assignmentPermissionKeys(
      principal.organizationId,
      assignment.id,
    );
    if (delegatedKeys.size === 0) continue;

    // SEC-014: re-verify, live, that the delegating Teacher STILL holds
    // each delegated permission at an equal-or-wider scope — never trusted
    // from grant time. A permission the Teacher has since lost silently
    // drops out of what the Assistant may use, with no separate cleanup
    // step required.
    const teacherSources = await resolveDirectAuthority(
      repo,
      { organizationId: principal.organizationId, userId: assignment.teacherUserId },
      targetChain,
      now,
    );
    const teacherHeldKeys = new Set<string>();
    for (const s of teacherSources) for (const k of s.permissionKeys) teacherHeldKeys.add(k);

    const effectiveKeys = new Set<string>();
    for (const k of delegatedKeys) if (teacherHeldKeys.has(k)) effectiveKeys.add(k);
    if (effectiveKeys.size === 0) continue;

    sources.push({
      kind: "assistant_assignment",
      permissionKeys: effectiveKeys,
      assistantAssignmentId: assignment.id,
    });
  }

  return sources;
}

export async function resolveAuthoritySources(
  repo: AuthzRepository,
  principal: Principal,
  target: AuthzTarget,
  now: Date,
): Promise<AuthoritySource[]> {
  const targetChain = await resolveAncestorChain(
    (organizationId, scope) => repo.findParentScope(organizationId, scope),
    principal.organizationId,
    { scopeType: target.scopeType, scopeId: target.scopeId },
  );

  const [direct, student, parent, assistant] = await Promise.all([
    resolveDirectAuthority(repo, principal, targetChain, now),
    resolveStudentSources(repo, principal, targetChain),
    resolveParentSources(repo, principal, targetChain, now),
    resolveAssistantSources(repo, principal, targetChain, now),
  ]);

  return [...direct, ...student, ...parent, ...assistant];
}

export interface AuthorizeOptions {
  /** Omit for a pure relationship/visibility check (e.g. "may I even see this classroom") — any authority source satisfies that. Set to require a *specific* catalogue permission (e.g. MANAGE_CLASSROOM) — only a source whose permissionKeys include it satisfies that. */
  permissionKey?: PermissionKey;
}

/**
 * The single entry point every route/service calls. Fails closed: any
 * error resolving sources, or zero matching sources, denies — there is no
 * code path where "couldn't determine" defaults to allow (§7.1's figure
 * note, GEN-004).
 */
export async function authorize(
  repo: AuthzRepository,
  principal: Principal,
  target: AuthzTarget,
  now: Date,
  options: AuthorizeOptions = {},
): Promise<AuthorityDecision> {
  const sources = await resolveAuthoritySources(repo, principal, target, now);
  const matching = options.permissionKey
    ? sources.filter((s) => s.permissionKeys.has(options.permissionKey!))
    : sources;

  if (matching.length === 0) {
    const code = target.objectId ? "not_found" : "forbidden";
    throw new AuthzDomainError(
      code,
      code === "not_found" ? "Not found." : "You do not have permission to perform this action.",
    );
  }
  return { sources: matching };
}
