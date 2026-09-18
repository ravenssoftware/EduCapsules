import { uuid7 } from "@educapsules/shared";
import { SYSTEM_ROLES } from "@educapsules/db";
import {
  authorize,
  type AuthorizeOptions,
  type AuthzTarget,
  type Principal,
} from "../authz/service.js";
import type { AuthzRepository } from "../authz/repository.js";
import { AuthzDomainError } from "../authz/errors.js";
import { AcademicStructureDomainError } from "./errors.js";
import type {
  AcademicPeriodRow,
  AcademicStructureRepository,
  ClassroomRow,
  CoTeacherRow,
  CourseAudienceRow,
  CourseRow,
  CycleRow,
  EnrollmentRow,
  GroupRow,
  MembershipRow,
  SubjectRow,
  TopicRow,
} from "./repository.js";

/**
 * Business-rule layer for the academic-structure module (SRS §8.1, §9, §10,
 * §37.3.2). Every mutating (and every scope/object-identified read) action
 * calls the centralized ../authz/service.js `authorize()` pipeline first —
 * no ad-hoc permission checks anywhere in this file. The permission-key /
 * scope-type mapping used throughout is documented in full in
 * docs/academic-structure/academic-structure.md §2 (the permission
 * catalogue, §26.2, has no dedicated key for Subject, AcademicPeriod,
 * Membership or Enrollment individually — this file's mapping of those onto
 * MANAGE_COURSE / ORG_MANAGE / MANAGE_STUDENTS is a documented interpretive
 * decision, not a silent assumption; see that doc for the full reasoning).
 *
 * TEACHER_ROLE_ID: the co-teacher mechanism (CRS-009) grants a
 * UserRoleAssignment scoped to the Course with roleId = the fixed, seeded
 * TEACHER system role id (packages/db/src/seed/data.ts's SYSTEM_ROLES) —
 * looked up from the same constant the seed script itself uses, never
 * queried at runtime, since system role ids are fixed and never change.
 */
const TEACHER_ROLE_ID = SYSTEM_ROLES.find((r) => r.key === "TEACHER")!.id;

export interface Deps {
  repo: AcademicStructureRepository;
  authzRepo: AuthzRepository;
}

async function check(
  deps: Deps,
  principal: Principal,
  target: AuthzTarget,
  options: AuthorizeOptions = {},
): Promise<void> {
  await authorize(deps.authzRepo, principal, target, new Date(), options);
}

function conflict(message: string): never {
  throw new AcademicStructureDomainError("conflict", message);
}
function invalid(message: string): never {
  throw new AcademicStructureDomainError("validation_failed", message);
}
function notFound(message = "Not found."): never {
  throw new AcademicStructureDomainError("not_found", message);
}
function forbidden(message = "You do not have permission to perform this action."): never {
  throw new AcademicStructureDomainError("forbidden", message);
}

async function audit(
  deps: Deps,
  principal: Principal,
  action: string,
  targetType: string,
  targetId: string,
  loginSessionId: string | null,
): Promise<void> {
  await deps.authzRepo.writeAuditEvent({
    organizationId: principal.organizationId,
    actorUserId: principal.userId,
    actorRole: null,
    action,
    targetType,
    targetId,
    ipHash: null,
    loginSessionId,
    occurredAt: new Date(),
    reason: null,
  });
}

// --- AcademicPeriod (PER-001..006) -----------------------------------------

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export async function listAcademicPeriods(
  deps: Deps,
  principal: Principal,
): Promise<AcademicPeriodRow[]> {
  await check(deps, principal, { scopeType: "ORG", scopeId: null });
  return deps.repo.listAcademicPeriods(principal.organizationId);
}

export async function getAcademicPeriod(
  deps: Deps,
  principal: Principal,
  id: string,
): Promise<AcademicPeriodRow> {
  await check(deps, principal, { scopeType: "ORG", scopeId: null, objectId: id });
  const row = await deps.repo.findAcademicPeriodById(principal.organizationId, id);
  if (!row) notFound();
  return row;
}

export async function createAcademicPeriod(
  deps: Deps,
  principal: Principal,
  input: { name: string; startsOn: string; endsOn: string },
  ctx: { loginSessionId: string | null },
): Promise<AcademicPeriodRow> {
  // PER-002: Admin creates/manages AcademicPeriods. "Teachers where the
  // Organization delegates it" has no defined delegation mechanism (no
  // Organization-settings field exists for it) — reported as a known
  // limitation (see docs/academic-structure/academic-structure.md §5), not
  // silently built as if it existed. Only the Admin path (ORG_MANAGE) is
  // implemented.
  await check(
    deps,
    principal,
    { scopeType: "ORG", scopeId: null },
    { permissionKey: "ORG_MANAGE" },
  );
  if (!input.name || !input.startsOn || !input.endsOn)
    invalid("name, startsOn and endsOn are required.");
  if (input.endsOn < input.startsOn) invalid("endsOn must not be before startsOn.");

  // PER-004: non-overlapping by default, unconditionally (no Organization
  // opt-in mechanism exists to build the "unless explicitly supports
  // concurrent periods" exception against).
  const existing = await deps.repo.listAcademicPeriods(principal.organizationId);
  if (existing.some((p) => datesOverlap(input.startsOn, input.endsOn, p.startsOn, p.endsOn))) {
    conflict("This date range overlaps an existing AcademicPeriod in this Organization (PER-004).");
  }

  const now = new Date();
  const row = await deps.repo.createAcademicPeriod({
    id: uuid7(),
    organizationId: principal.organizationId,
    name: input.name,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(
    deps,
    principal,
    "ACADEMIC_PERIOD_CREATED",
    "academic_period",
    row.id,
    ctx.loginSessionId,
  );
  return row;
}

const PERIOD_STATUSES = ["planned", "active", "closed"] as const;

export async function updateAcademicPeriod(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: { name?: string; startsOn?: string; endsOn?: string; status?: string },
  ctx: { loginSessionId: string | null },
): Promise<AcademicPeriodRow> {
  await check(
    deps,
    principal,
    { scopeType: "ORG", scopeId: null, objectId: id },
    { permissionKey: "ORG_MANAGE" },
  );
  const existing = await deps.repo.findAcademicPeriodById(principal.organizationId, id);
  if (!existing) notFound();

  const startsOn = patch.startsOn ?? existing.startsOn;
  const endsOn = patch.endsOn ?? existing.endsOn;
  if (endsOn < startsOn) invalid("endsOn must not be before startsOn.");

  if (patch.startsOn || patch.endsOn) {
    const others = (await deps.repo.listAcademicPeriods(principal.organizationId)).filter(
      (p) => p.id !== id,
    );
    if (others.some((p) => datesOverlap(startsOn, endsOn, p.startsOn, p.endsOn))) {
      conflict(
        "This date range overlaps an existing AcademicPeriod in this Organization (PER-004).",
      );
    }
  }

  if (patch.status) {
    if (!PERIOD_STATUSES.includes(patch.status as (typeof PERIOD_STATUSES)[number])) {
      invalid(`status must be one of ${PERIOD_STATUSES.join(", ")}.`);
    }
    // PER-005/006: closing never deletes or moves data — the schema and
    // every dependent entity's FK reference is untouched by this status
    // flip. 'closed' is terminal (no re-opening) — a deliberate, minimal
    // forward-only state machine; the SRS does not name a re-open action.
    if (existing.status === "closed" && patch.status !== "closed") {
      conflict("A closed AcademicPeriod cannot be reopened.");
    }
  }

  await deps.repo.updateAcademicPeriod(principal.organizationId, id, patch, new Date());
  await audit(
    deps,
    principal,
    "ACADEMIC_PERIOD_UPDATED",
    "academic_period",
    id,
    ctx.loginSessionId,
  );
  const updated = await deps.repo.findAcademicPeriodById(principal.organizationId, id);
  return updated!;
}

// --- Classroom (CLS-*) -------------------------------------------------

export async function listClassrooms(
  deps: Deps,
  principal: Principal,
  filters?: { academicPeriodId?: string },
): Promise<ClassroomRow[]> {
  const all = await deps.repo.listClassrooms(principal.organizationId, filters);
  const visible: ClassroomRow[] = [];
  for (const classroom of all) {
    try {
      await check(deps, principal, {
        scopeType: "CLASSROOM",
        scopeId: classroom.id,
        objectId: classroom.id,
      });
      visible.push(classroom);
    } catch (err) {
      // GEN-025/SEC-009: a classroom the caller has no relationship to is
      // silently omitted from the list, exactly like a single-object 404 —
      // but only for the expected authorization-denial condition. Any other
      // error (a genuine bug, a repository failure) must surface, not
      // vanish the row silently.
      if (!(err instanceof AuthzDomainError)) throw err;
    }
  }
  return visible;
}

export async function getClassroom(
  deps: Deps,
  principal: Principal,
  id: string,
): Promise<ClassroomRow> {
  await check(deps, principal, { scopeType: "CLASSROOM", scopeId: id, objectId: id });
  const row = await deps.repo.findClassroomById(principal.organizationId, id);
  if (!row) notFound();
  return row;
}

export async function createClassroom(
  deps: Deps,
  principal: Principal,
  input: {
    name: string;
    gradeLevel: string | null;
    academicPeriodId: string;
    homeroomTeacherId: string | null;
  },
  ctx: { loginSessionId: string | null },
): Promise<ClassroomRow> {
  await check(
    deps,
    principal,
    { scopeType: "ORG", scopeId: null },
    { permissionKey: "MANAGE_CLASSROOM" },
  );
  if (!input.name) invalid("name is required.");
  if (!input.academicPeriodId) invalid("academicPeriodId is required.");
  const period = await deps.repo.findAcademicPeriodById(
    principal.organizationId,
    input.academicPeriodId,
  );
  if (!period)
    invalid("academicPeriodId does not refer to an AcademicPeriod in this Organization.");

  const now = new Date();
  const row = await deps.repo.createClassroom({
    id: uuid7(),
    organizationId: principal.organizationId,
    name: input.name,
    gradeLevel: input.gradeLevel ?? null,
    academicPeriodId: input.academicPeriodId,
    homeroomTeacherId: input.homeroomTeacherId ?? null,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "CLASSROOM_CREATED", "classroom", row.id, ctx.loginSessionId);
  return row;
}

export async function updateClassroom(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: {
    name?: string;
    gradeLevel?: string | null;
    homeroomTeacherId?: string | null;
    status?: "active" | "archived";
  },
  ctx: { loginSessionId: string | null },
): Promise<ClassroomRow> {
  await check(
    deps,
    principal,
    { scopeType: "CLASSROOM", scopeId: id, objectId: id },
    { permissionKey: "MANAGE_CLASSROOM" },
  );
  const existing = await deps.repo.findClassroomById(principal.organizationId, id);
  if (!existing) notFound();

  await deps.repo.updateClassroom(principal.organizationId, id, patch, new Date());
  await audit(deps, principal, "CLASSROOM_UPDATED", "classroom", id, ctx.loginSessionId);
  const updated = await deps.repo.findClassroomById(principal.organizationId, id);
  return updated!;
}

// --- Group (GRP-*) -----------------------------------------------------

export async function listGroups(
  deps: Deps,
  principal: Principal,
  classroomId: string,
): Promise<GroupRow[]> {
  await check(deps, principal, {
    scopeType: "CLASSROOM",
    scopeId: classroomId,
    objectId: classroomId,
  });
  return deps.repo.listGroupsByClassroom(principal.organizationId, classroomId);
}

export async function getGroup(deps: Deps, principal: Principal, id: string): Promise<GroupRow> {
  await check(deps, principal, { scopeType: "GROUP", scopeId: id, objectId: id });
  const row = await deps.repo.findGroupById(principal.organizationId, id);
  if (!row) notFound();
  return row;
}

export async function createGroup(
  deps: Deps,
  principal: Principal,
  classroomId: string,
  input: { name: string; purpose: string | null },
  ctx: { loginSessionId: string | null },
): Promise<GroupRow> {
  const classroom = await deps.repo.findClassroomById(principal.organizationId, classroomId);
  if (!classroom) notFound();
  await check(
    deps,
    principal,
    { scopeType: "CLASSROOM", scopeId: classroomId, objectId: classroomId },
    { permissionKey: "MANAGE_CLASSROOM" },
  );
  if (!input.name) invalid("name is required.");

  const now = new Date();
  const row = await deps.repo.createGroup({
    id: uuid7(),
    organizationId: principal.organizationId,
    classroomId,
    name: input.name,
    purpose: input.purpose ?? null,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "GROUP_CREATED", "group", row.id, ctx.loginSessionId);
  return row;
}

export async function updateGroup(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: { name?: string; purpose?: string | null; status?: "active" | "archived" },
  ctx: { loginSessionId: string | null },
): Promise<GroupRow> {
  await check(
    deps,
    principal,
    { scopeType: "GROUP", scopeId: id, objectId: id },
    { permissionKey: "MANAGE_CLASSROOM" },
  );
  const existing = await deps.repo.findGroupById(principal.organizationId, id);
  if (!existing) notFound();

  await deps.repo.updateGroup(principal.organizationId, id, patch, new Date());
  await audit(deps, principal, "GROUP_UPDATED", "group", id, ctx.loginSessionId);
  const updated = await deps.repo.findGroupById(principal.organizationId, id);
  return updated!;
}

// --- Membership (CLS-009/010, PER-003) ----------------------------------

function containerScopeType(containerType: "classroom" | "group"): "CLASSROOM" | "GROUP" {
  return containerType === "classroom" ? "CLASSROOM" : "GROUP";
}

async function resolveContainerOrThrow(
  deps: Deps,
  organizationId: string,
  containerType: "classroom" | "group",
  containerId: string,
): Promise<ClassroomRow | GroupRow> {
  if (containerType === "classroom") {
    const row = await deps.repo.findClassroomById(organizationId, containerId);
    if (!row) notFound();
    return row;
  }
  if (containerType === "group") {
    const row = await deps.repo.findGroupById(organizationId, containerId);
    if (!row) notFound();
    return row;
  }
  invalid('containerType must be "classroom" or "group".');
}

export async function listMemberships(
  deps: Deps,
  principal: Principal,
  containerType: "classroom" | "group",
  containerId: string,
): Promise<MembershipRow[]> {
  await resolveContainerOrThrow(deps, principal.organizationId, containerType, containerId);
  await check(
    deps,
    principal,
    { scopeType: containerScopeType(containerType), scopeId: containerId, objectId: containerId },
    { permissionKey: "VIEW_STUDENTS" },
  );
  return deps.repo.listMembershipsForContainer(
    principal.organizationId,
    containerType,
    containerId,
  );
}

export async function addMembership(
  deps: Deps,
  principal: Principal,
  input: {
    userId: string;
    containerType: "classroom" | "group";
    containerId: string;
    roleInContainer: string | null;
  },
  ctx: { loginSessionId: string | null },
): Promise<MembershipRow> {
  if (input.containerType !== "classroom" && input.containerType !== "group") {
    invalid('containerType must be "classroom" or "group".');
  }
  if (!input.userId) invalid("userId is required.");
  // SRS Table 40.2: an invalid client-supplied reference is a validation
  // error, never a raw DB FK violation surfacing as a 500.
  if (!(await deps.repo.userExists(principal.organizationId, input.userId))) {
    invalid("userId does not refer to a user in this Organization.");
  }

  // Tenancy-and-security.md §1's named gap: the polymorphic container_id
  // column has no FK — existence and organization match are validated here,
  // at the application layer, exactly as that document said Phase 6 must.
  const container = await resolveContainerOrThrow(
    deps,
    principal.organizationId,
    input.containerType,
    input.containerId,
  );

  await check(
    deps,
    principal,
    {
      scopeType: containerScopeType(input.containerType),
      scopeId: input.containerId,
      objectId: input.containerId,
    },
    { permissionKey: "MANAGE_STUDENTS" },
  );

  if (input.containerType === "classroom") {
    const classroom = container as ClassroomRow;
    // PER-003: at most one ACTIVE classroom-type Membership per
    // (organization, user, academic_period) — enforced here, at the
    // application layer, since it requires a join through
    // Membership -> Classroom -> AcademicPeriod no single DB constraint can
    // express (see docs/academic-structure/academic-structure.md §4).
    const activeClassroomMemberships = await deps.repo.listActiveClassroomMembershipsForUser(
      principal.organizationId,
      input.userId,
    );
    const samePeriod = activeClassroomMemberships.find(
      (m) => m.academicPeriodId === classroom.academicPeriodId,
    );
    if (samePeriod) {
      conflict(
        "This student already has an active Classroom membership in this AcademicPeriod (PER-003/BR-015). Use the move-student operation instead.",
      );
    }
  }

  const now = new Date();
  const row = await deps.repo.createMembership({
    id: uuid7(),
    organizationId: principal.organizationId,
    userId: input.userId,
    containerType: input.containerType,
    containerId: input.containerId,
    roleInContainer: input.roleInContainer ?? "STUDENT",
    joinedAt: now,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "MEMBERSHIP_CREATED", "membership", row.id, ctx.loginSessionId);
  return row;
}

export async function endMembership(
  deps: Deps,
  principal: Principal,
  id: string,
  ctx: { loginSessionId: string | null },
): Promise<void> {
  const membership = await deps.repo.findMembershipById(principal.organizationId, id);
  if (!membership) notFound();
  await check(
    deps,
    principal,
    {
      scopeType: containerScopeType(membership.containerType),
      scopeId: membership.containerId,
      objectId: membership.containerId,
    },
    { permissionKey: "MANAGE_STUDENTS" },
  );
  if (membership.leftAt) conflict("This membership has already ended.");

  const now = new Date();
  // CLS-009: never deleted — leftAt is set, the row stays.
  await deps.repo.endMembership(id, now, now);
  await audit(deps, principal, "MEMBERSHIP_ENDED", "membership", id, ctx.loginSessionId);
}

export async function moveStudent(
  deps: Deps,
  principal: Principal,
  input: { userId: string; toClassroomId: string },
  ctx: { loginSessionId: string | null },
): Promise<MembershipRow> {
  if (!input.userId) invalid("userId is required.");
  if (!input.toClassroomId) invalid("toClassroomId is required.");
  const toClassroom = await deps.repo.findClassroomById(
    principal.organizationId,
    input.toClassroomId,
  );
  if (!toClassroom) notFound();

  await check(
    deps,
    principal,
    { scopeType: "CLASSROOM", scopeId: input.toClassroomId, objectId: input.toClassroomId },
    { permissionKey: "MANAGE_STUDENTS" },
  );

  // BR-015/CLS-009: moving a student ends the current membership (in the
  // SAME AcademicPeriod as the destination — PER-003's own scope) and
  // creates a new one; grades/submissions/points/achievements are never
  // touched (they attach to the Activity/context they were earned in, not
  // to the Membership row).
  const activeClassroomMemberships = await deps.repo.listActiveClassroomMembershipsForUser(
    principal.organizationId,
    input.userId,
  );
  const current = activeClassroomMemberships.find(
    (m) =>
      m.academicPeriodId === toClassroom.academicPeriodId && m.containerId !== input.toClassroomId,
  );
  if (current) {
    // The caller must also be authorized to end the OLD membership's
    // container — a Teacher who owns only the destination Classroom may not
    // silently pull a student out of a Classroom they have no authority
    // over.
    await check(
      deps,
      principal,
      { scopeType: "CLASSROOM", scopeId: current.containerId, objectId: current.containerId },
      { permissionKey: "MANAGE_STUDENTS" },
    );
    const now = new Date();
    await deps.repo.endMembership(current.id, now, now);
    await audit(deps, principal, "MEMBERSHIP_ENDED", "membership", current.id, ctx.loginSessionId);
  } else {
    const sameClassroom = activeClassroomMemberships.find(
      (m) => m.containerId === input.toClassroomId,
    );
    if (sameClassroom) conflict("This student is already an active member of this Classroom.");
  }

  const now = new Date();
  const row = await deps.repo.createMembership({
    id: uuid7(),
    organizationId: principal.organizationId,
    userId: input.userId,
    containerType: "classroom",
    containerId: input.toClassroomId,
    roleInContainer: "STUDENT",
    joinedAt: now,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "MEMBERSHIP_CREATED", "membership", row.id, ctx.loginSessionId);
  return row;
}

// --- Subject (SUB-*) -----------------------------------------------------

export async function listSubjects(deps: Deps, principal: Principal): Promise<SubjectRow[]> {
  const all = await deps.repo.listSubjects(principal.organizationId);
  const visible: SubjectRow[] = [];
  for (const subject of all) {
    try {
      await check(deps, principal, {
        scopeType: "SUBJECT",
        scopeId: subject.id,
        objectId: subject.id,
      });
      visible.push(subject);
    } catch (err) {
      // silently omitted, as with Classroom listing — only for the
      // expected authorization denial; unexpected errors surface.
      if (!(err instanceof AuthzDomainError)) throw err;
    }
  }
  return visible;
}

export async function getSubject(
  deps: Deps,
  principal: Principal,
  id: string,
): Promise<SubjectRow> {
  await check(deps, principal, { scopeType: "SUBJECT", scopeId: id, objectId: id });
  const row = await deps.repo.findSubjectById(principal.organizationId, id);
  if (!row) notFound();
  return row;
}

export async function createSubject(
  deps: Deps,
  principal: Principal,
  input: { name: string; code: string | null; description: string | null },
  ctx: { loginSessionId: string | null },
): Promise<SubjectRow> {
  // SUB-001's actor is "Teacher/Admin"; the catalogue has no dedicated
  // Subject permission (§26.1's closed catalogue) — MANAGE_COURSE
  // ("Create/edit courses, cycles, topics") is the nearest content-tree
  // management permission and is used here as a documented interpretive
  // decision (see docs/academic-structure/academic-structure.md §2).
  await check(
    deps,
    principal,
    { scopeType: "ORG", scopeId: null },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (!input.name) invalid("name is required.");
  if (input.code) {
    const existing = await deps.repo.findSubjectByCode(principal.organizationId, input.code);
    if (existing)
      conflict(`A Subject with code "${input.code}" already exists in this Organization.`);
  }

  const now = new Date();
  const row = await deps.repo.createSubject({
    id: uuid7(),
    organizationId: principal.organizationId,
    name: input.name,
    code: input.code ?? null,
    description: input.description ?? null,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "SUBJECT_CREATED", "subject", row.id, ctx.loginSessionId);
  return row;
}

export async function updateSubject(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: {
    name?: string;
    code?: string | null;
    description?: string | null;
    status?: "active" | "archived";
  },
  ctx: { loginSessionId: string | null },
): Promise<SubjectRow> {
  await check(
    deps,
    principal,
    { scopeType: "SUBJECT", scopeId: id, objectId: id },
    { permissionKey: "MANAGE_COURSE" },
  );
  const existing = await deps.repo.findSubjectById(principal.organizationId, id);
  if (!existing) notFound();
  if (patch.code && patch.code !== existing.code) {
    const dup = await deps.repo.findSubjectByCode(principal.organizationId, patch.code);
    if (dup && dup.id !== id) {
      conflict(`A Subject with code "${patch.code}" already exists in this Organization.`);
    }
  }

  await deps.repo.updateSubject(principal.organizationId, id, patch, new Date());
  await audit(deps, principal, "SUBJECT_UPDATED", "subject", id, ctx.loginSessionId);
  const updated = await deps.repo.findSubjectById(principal.organizationId, id);
  return updated!;
}

// --- Course (CRS-*) -----------------------------------------------------

export async function listCourses(
  deps: Deps,
  principal: Principal,
  filters?: { subjectId?: string; status?: string },
): Promise<CourseRow[]> {
  const all = await deps.repo.listCourses(principal.organizationId, filters);
  const visible: CourseRow[] = [];
  for (const course of all) {
    try {
      await check(deps, principal, {
        scopeType: "COURSE",
        scopeId: course.id,
        objectId: course.id,
      });
      visible.push(course);
    } catch (err) {
      // silently omitted — only for the expected authorization denial;
      // unexpected errors surface.
      if (!(err instanceof AuthzDomainError)) throw err;
    }
  }
  return visible;
}

export async function getCourse(deps: Deps, principal: Principal, id: string): Promise<CourseRow> {
  await check(deps, principal, { scopeType: "COURSE", scopeId: id, objectId: id });
  const row = await deps.repo.findCourseById(principal.organizationId, id);
  if (!row) notFound();
  return row;
}

export async function createCourse(
  deps: Deps,
  principal: Principal,
  input: {
    subjectId: string;
    title: string;
    description: string | null;
    academicPeriodId: string;
    visibility?: string;
  },
  ctx: { loginSessionId: string | null },
): Promise<CourseRow> {
  const subject = await deps.repo.findSubjectById(principal.organizationId, input.subjectId);
  if (!subject) notFound();
  await check(
    deps,
    principal,
    { scopeType: "SUBJECT", scopeId: input.subjectId, objectId: input.subjectId },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (!input.title) invalid("title is required.");
  if (!input.academicPeriodId) invalid("academicPeriodId is required.");
  const period = await deps.repo.findAcademicPeriodById(
    principal.organizationId,
    input.academicPeriodId,
  );
  if (!period)
    invalid("academicPeriodId does not refer to an AcademicPeriod in this Organization.");

  const now = new Date();
  // CRS-003: the authoring Teacher is recorded permanently — always the
  // authenticated caller, NEVER a client-supplied field (forged-field
  // protection tested explicitly).
  const row = await deps.repo.createCourse({
    id: uuid7(),
    organizationId: principal.organizationId,
    subjectId: input.subjectId,
    title: input.title,
    description: input.description ?? null,
    ownerTeacherId: principal.userId,
    academicPeriodId: input.academicPeriodId,
    visibility: input.visibility ?? "organization",
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "COURSE_CREATED", "course", row.id, ctx.loginSessionId);
  return row;
}

export async function updateCourse(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: { title?: string; description?: string | null; visibility?: string },
  ctx: { loginSessionId: string | null },
): Promise<CourseRow> {
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: id, objectId: id },
    { permissionKey: "MANAGE_COURSE" },
  );
  const existing = await deps.repo.findCourseById(principal.organizationId, id);
  if (!existing) notFound();

  await deps.repo.updateCourse(principal.organizationId, id, patch, new Date());
  await audit(deps, principal, "COURSE_UPDATED", "course", id, ctx.loginSessionId);
  const updated = await deps.repo.findCourseById(principal.organizationId, id);
  return updated!;
}

async function transitionCourseStatus(
  deps: Deps,
  principal: Principal,
  id: string,
  opts: {
    permissionKey: "PUBLISH_CONTENT" | "MANAGE_COURSE";
    from: string[];
    to: string;
    action: string;
    /** The canonical audit action string — spelled out explicitly rather
     * than derived from `action` (a prior `${action.toUpperCase()}D`
     * template produced "COURSE_PUBLISHD"/"COURSE_UNPUBLISHD" for the
     * publish/unpublish actions — only "archive" happened to pluralize
     * correctly by coincidence). */
    auditAction: string;
  },
  ctx: { loginSessionId: string | null },
): Promise<CourseRow> {
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: id, objectId: id },
    { permissionKey: opts.permissionKey },
  );
  const existing = await deps.repo.findCourseById(principal.organizationId, id);
  if (!existing) notFound();
  if (!opts.from.includes(existing.status)) {
    conflict(`Cannot ${opts.action} a Course in status "${existing.status}".`);
  }

  await deps.repo.updateCourse(principal.organizationId, id, { status: opts.to }, new Date());
  await audit(deps, principal, opts.auditAction, "course", id, ctx.loginSessionId);
  const updated = await deps.repo.findCourseById(principal.organizationId, id);
  return updated!;
}

export async function publishCourse(
  deps: Deps,
  principal: Principal,
  id: string,
  ctx: { loginSessionId: string | null },
): Promise<CourseRow> {
  // CRS-008: publishing is an explicit action, separate from creating.
  return transitionCourseStatus(
    deps,
    principal,
    id,
    {
      permissionKey: "PUBLISH_CONTENT",
      from: ["draft"],
      to: "published",
      action: "publish",
      auditAction: "COURSE_PUBLISHED",
    },
    ctx,
  );
}

export async function unpublishCourse(
  deps: Deps,
  principal: Principal,
  id: string,
  ctx: { loginSessionId: string | null },
): Promise<CourseRow> {
  // CRS-007: "shall not be returned to draft once a Submission exists
  // against any of its Activities" — the Submission entity does not exist
  // yet (Phase 12). This is a documented, reported known limitation, not a
  // silently-omitted check: the state-machine transition itself is
  // implemented correctly; the Submission-existence gate must be added when
  // Submission exists.
  return transitionCourseStatus(
    deps,
    principal,
    id,
    {
      permissionKey: "PUBLISH_CONTENT",
      from: ["published"],
      to: "draft",
      action: "unpublish",
      auditAction: "COURSE_UNPUBLISHED",
    },
    ctx,
  );
}

export async function archiveCourse(
  deps: Deps,
  principal: Principal,
  id: string,
  ctx: { loginSessionId: string | null },
): Promise<CourseRow> {
  return transitionCourseStatus(
    deps,
    principal,
    id,
    {
      permissionKey: "MANAGE_COURSE",
      from: ["draft", "published"],
      to: "archived",
      action: "archive",
      auditAction: "COURSE_ARCHIVED",
    },
    ctx,
  );
}

// --- Course co-teachers (CRS-009/010) -----------------------------------

export async function listCoTeachers(
  deps: Deps,
  principal: Principal,
  courseId: string,
): Promise<CoTeacherRow[]> {
  await check(deps, principal, { scopeType: "COURSE", scopeId: courseId, objectId: courseId });
  return deps.repo.listCourseCoTeachers(principal.organizationId, courseId);
}

export async function addCoTeacher(
  deps: Deps,
  principal: Principal,
  courseId: string,
  coTeacherUserId: string,
  ctx: { loginSessionId: string | null },
): Promise<CoTeacherRow> {
  const course = await deps.repo.findCourseById(principal.organizationId, courseId);
  if (!course) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "MANAGE_COURSE" },
  );
  // CRS-009: co-teacher management remains owner-only — never delegable to
  // a co-teacher even though a co-teacher does hold MANAGE_COURSE itself.
  if (course.ownerTeacherId !== principal.userId) {
    forbidden("Only the owning Teacher may add or remove a co-teacher.");
  }
  if (!coTeacherUserId) invalid("coTeacherUserId is required.");
  if (coTeacherUserId === course.ownerTeacherId) {
    invalid("The owning Teacher is already the Course's owner, not a co-teacher.");
  }
  const existing = await deps.repo.findActiveCourseCoTeacher(
    principal.organizationId,
    courseId,
    coTeacherUserId,
  );
  if (existing) conflict("This user is already a co-teacher of this Course.");

  const now = new Date();
  const row = await deps.repo.addCourseCoTeacher({
    id: uuid7(),
    organizationId: principal.organizationId,
    userId: coTeacherUserId,
    courseId,
    roleId: TEACHER_ROLE_ID,
    grantedBy: principal.userId,
    validFrom: now,
    createdAt: now,
    updatedAt: now,
  });
  // CRS-010: every grant/modification/removal is audited and visible to all
  // current co-teachers — the audit event itself, plus listCoTeachers()
  // above being reachable by any co-teacher (their delegated MANAGE_COURSE
  // covers the relationship check), is what makes it visible.
  await audit(deps, principal, "COURSE_CO_TEACHER_ADDED", "course", courseId, ctx.loginSessionId);
  return row;
}

export async function removeCoTeacher(
  deps: Deps,
  principal: Principal,
  courseId: string,
  coTeacherUserId: string,
  ctx: { loginSessionId: string | null },
): Promise<void> {
  const course = await deps.repo.findCourseById(principal.organizationId, courseId);
  if (!course) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (course.ownerTeacherId !== principal.userId) {
    forbidden("Only the owning Teacher may add or remove a co-teacher.");
  }
  const existing = await deps.repo.findActiveCourseCoTeacher(
    principal.organizationId,
    courseId,
    coTeacherUserId,
  );
  if (!existing) notFound("This user is not a current co-teacher of this Course.");

  await deps.repo.revokeCourseCoTeacher(existing.id, new Date());
  await audit(deps, principal, "COURSE_CO_TEACHER_REMOVED", "course", courseId, ctx.loginSessionId);
}

// --- CourseAudience (CLS-008/GRP-003 targeting) --------------------------

export async function listCourseAudiences(
  deps: Deps,
  principal: Principal,
  courseId: string,
): Promise<CourseAudienceRow[]> {
  await check(deps, principal, { scopeType: "COURSE", scopeId: courseId, objectId: courseId });
  return deps.repo.listCourseAudiences(principal.organizationId, courseId);
}

export async function addCourseAudience(
  deps: Deps,
  principal: Principal,
  courseId: string,
  input: { targetType: "classroom" | "group"; targetId: string },
  ctx: { loginSessionId: string | null },
): Promise<CourseAudienceRow> {
  const course = await deps.repo.findCourseById(principal.organizationId, courseId);
  if (!course) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (input.targetType !== "classroom" && input.targetType !== "group") {
    invalid('targetType must be "classroom" or "group".');
  }
  // Tenancy-and-security.md §1's named gap, closed for course_audiences.target_id.
  await resolveContainerOrThrow(deps, principal.organizationId, input.targetType, input.targetId);

  const dup = await deps.repo.findCourseAudience(
    principal.organizationId,
    courseId,
    input.targetType,
    input.targetId,
  );
  if (dup) conflict("This Course is already targeted to this audience.");

  const row = await deps.repo.addCourseAudience({
    id: uuid7(),
    organizationId: principal.organizationId,
    courseId,
    targetType: input.targetType,
    targetId: input.targetId,
    createdBy: principal.userId,
    createdAt: new Date(),
  });
  await audit(deps, principal, "COURSE_AUDIENCE_ADDED", "course", courseId, ctx.loginSessionId);
  return row;
}

export async function removeCourseAudience(
  deps: Deps,
  principal: Principal,
  courseId: string,
  audienceId: string,
  ctx: { loginSessionId: string | null },
): Promise<void> {
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "MANAGE_COURSE" },
  );
  const audiences = await deps.repo.listCourseAudiences(principal.organizationId, courseId);
  const existing = audiences.find((a) => a.id === audienceId);
  if (!existing) notFound();

  await deps.repo.removeCourseAudience(principal.organizationId, audienceId);
  await audit(deps, principal, "COURSE_AUDIENCE_REMOVED", "course", courseId, ctx.loginSessionId);
}

// --- Cycle (CYC-*) ------------------------------------------------------

export async function listCycles(
  deps: Deps,
  principal: Principal,
  courseId: string,
): Promise<CycleRow[]> {
  await check(deps, principal, { scopeType: "COURSE", scopeId: courseId, objectId: courseId });
  return deps.repo.listCyclesByCourse(principal.organizationId, courseId);
}

export async function getCycle(deps: Deps, principal: Principal, id: string): Promise<CycleRow> {
  await check(deps, principal, { scopeType: "CYCLE", scopeId: id, objectId: id });
  const row = await deps.repo.findCycleById(principal.organizationId, id);
  if (!row) notFound();
  return row;
}

export async function createCycle(
  deps: Deps,
  principal: Principal,
  courseId: string,
  input: { title: string; sequenceNo: number; startsOn: string | null; endsOn: string | null },
  ctx: { loginSessionId: string | null },
): Promise<CycleRow> {
  const course = await deps.repo.findCourseById(principal.organizationId, courseId);
  if (!course) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (!input.title) invalid("title is required.");
  if (!Number.isInteger(input.sequenceNo)) invalid("sequenceNo must be an integer.");
  // CYC-002: sequence_no unique per Course — checked here for a clean
  // 409 rather than surfacing the DB's own unique-constraint error.
  const dup = await deps.repo.findCycleBySequence(
    principal.organizationId,
    courseId,
    input.sequenceNo,
  );
  if (dup) conflict(`Cycle sequenceNo ${input.sequenceNo} already exists in this Course.`);

  const now = new Date();
  const row = await deps.repo.createCycle({
    id: uuid7(),
    organizationId: principal.organizationId,
    courseId,
    title: input.title,
    sequenceNo: input.sequenceNo,
    startsOn: input.startsOn ?? null,
    endsOn: input.endsOn ?? null,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "CYCLE_CREATED", "cycle", row.id, ctx.loginSessionId);
  return row;
}

export async function updateCycle(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: {
    title?: string;
    sequenceNo?: number;
    startsOn?: string | null;
    endsOn?: string | null;
    status?: "active" | "archived";
  },
  ctx: { loginSessionId: string | null },
): Promise<CycleRow> {
  await check(
    deps,
    principal,
    { scopeType: "CYCLE", scopeId: id, objectId: id },
    { permissionKey: "MANAGE_COURSE" },
  );
  const existing = await deps.repo.findCycleById(principal.organizationId, id);
  if (!existing) notFound();
  if (patch.sequenceNo !== undefined && patch.sequenceNo !== existing.sequenceNo) {
    const dup = await deps.repo.findCycleBySequence(
      principal.organizationId,
      existing.courseId,
      patch.sequenceNo,
    );
    if (dup) conflict(`Cycle sequenceNo ${patch.sequenceNo} already exists in this Course.`);
  }

  await deps.repo.updateCycle(principal.organizationId, id, patch, new Date());
  await audit(deps, principal, "CYCLE_UPDATED", "cycle", id, ctx.loginSessionId);
  const updated = await deps.repo.findCycleById(principal.organizationId, id);
  return updated!;
}

// --- Topic (TOP-*) -------------------------------------------------------

export async function listTopics(
  deps: Deps,
  principal: Principal,
  cycleId: string,
): Promise<TopicRow[]> {
  await check(deps, principal, { scopeType: "CYCLE", scopeId: cycleId, objectId: cycleId });
  return deps.repo.listTopicsByCycle(principal.organizationId, cycleId);
}

export async function getTopic(deps: Deps, principal: Principal, id: string): Promise<TopicRow> {
  const existing = await deps.repo.findTopicById(principal.organizationId, id);
  if (!existing) notFound();
  await check(deps, principal, { scopeType: "CYCLE", scopeId: existing.cycleId, objectId: id });
  return existing;
}

export async function createTopic(
  deps: Deps,
  principal: Principal,
  cycleId: string,
  input: { title: string; sequenceNo: number; learningObjectives: string | null },
  ctx: { loginSessionId: string | null },
): Promise<TopicRow> {
  const cycle = await deps.repo.findCycleById(principal.organizationId, cycleId);
  if (!cycle) notFound();
  await check(
    deps,
    principal,
    { scopeType: "CYCLE", scopeId: cycleId, objectId: cycleId },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (!input.title) invalid("title is required.");
  if (!Number.isInteger(input.sequenceNo)) invalid("sequenceNo must be an integer.");
  const dup = await deps.repo.findTopicBySequence(
    principal.organizationId,
    cycleId,
    input.sequenceNo,
  );
  if (dup) conflict(`Topic sequenceNo ${input.sequenceNo} already exists in this Cycle.`);

  const now = new Date();
  const row = await deps.repo.createTopic({
    id: uuid7(),
    organizationId: principal.organizationId,
    cycleId,
    title: input.title,
    sequenceNo: input.sequenceNo,
    learningObjectives: input.learningObjectives ?? null,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "TOPIC_CREATED", "topic", row.id, ctx.loginSessionId);
  return row;
}

export async function updateTopic(
  deps: Deps,
  principal: Principal,
  id: string,
  patch: {
    title?: string;
    sequenceNo?: number;
    learningObjectives?: string | null;
    status?: "active" | "archived";
  },
  ctx: { loginSessionId: string | null },
): Promise<TopicRow> {
  const existing = await deps.repo.findTopicById(principal.organizationId, id);
  if (!existing) notFound();
  await check(
    deps,
    principal,
    { scopeType: "CYCLE", scopeId: existing.cycleId, objectId: id },
    { permissionKey: "MANAGE_COURSE" },
  );
  if (patch.sequenceNo !== undefined && patch.sequenceNo !== existing.sequenceNo) {
    const dup = await deps.repo.findTopicBySequence(
      principal.organizationId,
      existing.cycleId,
      patch.sequenceNo,
    );
    if (dup) conflict(`Topic sequenceNo ${patch.sequenceNo} already exists in this Cycle.`);
  }

  await deps.repo.updateTopic(principal.organizationId, id, patch, new Date());
  await audit(deps, principal, "TOPIC_UPDATED", "topic", id, ctx.loginSessionId);
  const updated = await deps.repo.findTopicById(principal.organizationId, id);
  return updated!;
}

// --- Enrollment (§37.3.2, PER-003) ---------------------------------------

export async function listEnrollmentsForCourse(
  deps: Deps,
  principal: Principal,
  courseId: string,
): Promise<EnrollmentRow[]> {
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "VIEW_STUDENTS" },
  );
  return deps.repo.listEnrollmentsByCourse(principal.organizationId, courseId);
}

/**
 * A Student's own enrollment list — self-access only. There is no single
 * scope object a cross-course "my enrollments" query can be checked against
 * in the §7.3 scope model, so this deliberately does not call authorize():
 * identity (principal.userId === studentUserId) is itself sufficient
 * authorization for a user's own data, the same principle the auth module
 * applies to "read my own session". Any other caller (Teacher, Parent,
 * Admin) must use listEnrollmentsForCourse, which IS authorized per-course
 * — a documented, deliberate scope cut, not a silent gap.
 */
export async function listEnrollmentsForStudent(
  deps: Deps,
  principal: Principal,
  studentUserId: string,
): Promise<EnrollmentRow[]> {
  if (principal.userId !== studentUserId) {
    forbidden("You may only list your own enrollments.");
  }
  return deps.repo.listEnrollmentsByStudent(principal.organizationId, studentUserId);
}

/**
 * Creates an Enrollment in REQUESTED status — SRS §45.3's state machine is
 * REQUESTED -> ACTIVE -> (WITHDRAWN | COMPLETED | TRANSFERRED), and this is
 * its start state, not an immediate ACTIVE (see activateEnrollment() for
 * the next step, and the module's known-limitations note for why the same
 * MANAGE_STUDENTS authority gates both this and the activation step: the
 * SRS names no distinct requester-vs-approver actor for Enrollment
 * anywhere, unlike ParentLink's explicit requestedBy/confirmedBy split or
 * AssistantAssignment's grantor/assistant distinction).
 */
export async function createEnrollment(
  deps: Deps,
  principal: Principal,
  courseId: string,
  input: { studentUserId: string; source: string | null },
  ctx: { loginSessionId: string | null },
): Promise<EnrollmentRow> {
  const course = await deps.repo.findCourseById(principal.organizationId, courseId);
  if (!course) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: courseId, objectId: courseId },
    { permissionKey: "MANAGE_STUDENTS" },
  );
  if (!input.studentUserId) invalid("studentUserId is required.");
  // SRS Table 40.2: an invalid client-supplied reference is a validation
  // error, never a raw DB FK violation surfacing as a 500.
  if (!(await deps.repo.userExists(principal.organizationId, input.studentUserId))) {
    invalid("studentUserId does not refer to a user in this Organization.");
  }
  if (course.status === "archived") invalid("Cannot enroll a student in an archived Course.");

  const existing = await deps.repo.findActiveEnrollment(
    principal.organizationId,
    input.studentUserId,
    courseId,
  );
  if (existing)
    conflict(
      "This student already has a requested, active or completed Enrollment in this Course.",
    );

  const now = new Date();
  // academic_period_id is always derived from the Course, never a
  // client-supplied field (PER-003: "a Course and Enrollment shall each
  // belong to exactly one AcademicPeriod" — an Enrollment's period is its
  // Course's period, by construction, never independently chosen).
  const row = await deps.repo.createEnrollment({
    id: uuid7(),
    organizationId: principal.organizationId,
    studentUserId: input.studentUserId,
    courseId,
    academicPeriodId: course.academicPeriodId,
    enrolledAt: now,
    source: input.source ?? null,
    createdBy: principal.userId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(deps, principal, "ENROLLMENT_REQUESTED", "enrollment", row.id, ctx.loginSessionId);
  return row;
}

/**
 * REQUESTED -> ACTIVE. See createEnrollment()'s doc comment for why this is
 * gated by the same MANAGE_STUDENTS authority as every other Enrollment
 * mutation in this module, rather than a distinct approver role — none is
 * named in the SRS for this entity.
 */
export async function activateEnrollment(
  deps: Deps,
  principal: Principal,
  id: string,
  ctx: { loginSessionId: string | null },
): Promise<EnrollmentRow> {
  const existing = await deps.repo.findEnrollmentById(principal.organizationId, id);
  if (!existing) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: existing.courseId, objectId: existing.courseId },
    { permissionKey: "MANAGE_STUDENTS" },
  );
  if (existing.status !== "requested") {
    conflict(`Cannot activate an Enrollment in status "${existing.status}".`);
  }

  const now = new Date();
  await deps.repo.updateEnrollmentStatus(id, "active", null, now);
  await audit(deps, principal, "ENROLLMENT_ACTIVATED", "enrollment", id, ctx.loginSessionId);
  const updated = await deps.repo.findEnrollmentById(principal.organizationId, id);
  return updated!;
}

export async function withdrawEnrollment(
  deps: Deps,
  principal: Principal,
  id: string,
  ctx: { loginSessionId: string | null },
): Promise<EnrollmentRow> {
  const existing = await deps.repo.findEnrollmentById(principal.organizationId, id);
  if (!existing) notFound();
  await check(
    deps,
    principal,
    { scopeType: "COURSE", scopeId: existing.courseId, objectId: existing.courseId },
    { permissionKey: "MANAGE_STUDENTS" },
  );
  if (existing.status !== "active")
    conflict(`Cannot withdraw an Enrollment in status "${existing.status}".`);

  const now = new Date();
  // BR-015/Table 37.3: withdrawal preserves the row and all grades earned —
  // status flips, the row is never deleted.
  await deps.repo.updateEnrollmentStatus(id, "withdrawn", now, now);
  await audit(deps, principal, "ENROLLMENT_WITHDRAWN", "enrollment", id, ctx.loginSessionId);
  const updated = await deps.repo.findEnrollmentById(principal.organizationId, id);
  return updated!;
}
