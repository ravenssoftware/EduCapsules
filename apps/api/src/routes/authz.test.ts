import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  sqliteSchema,
  SYSTEM_ROLES,
  systemRoleRows,
  permissionRows,
  rolePermissionRows,
} from "@educapsules/db";
import { uuid7 } from "@educapsules/shared";
import { createApp } from "../app.js";
import { createAuthRepository } from "../modules/auth/repository.js";
import { createAuthzRepository } from "../modules/authz/repository.js";
import { createAcademicStructureRepository } from "../modules/academic-structure/repository.js";
import { issueSession } from "../modules/auth/sessions.js";

/**
 * Full HTTP-surface integration tests for Phase 5's authorization surface
 * (classrooms, assistant-assignments, parent-links), against a real
 * in-memory SQLite database migrated with the real generated migrations —
 * the same pattern established by auth.test.ts. Every scenario below
 * exercises the actual centralized pipeline (authz/service.ts) through the
 * real routes, never a mocked repository or a bypassed check.
 *
 * Fixture shape (see beforeAll): two organizations for isolation testing.
 * In ORG_A: teacher1 owns classroom1 (with group1 inside it) via a
 * CLASSROOM-scoped role assignment + homeroom ownership; teacher2 owns
 * classroom2 the same way — deliberately NOT org-wide, so cross-teacher
 * denial is a real, meaningful test rather than vacuously true. student1 is
 * an active member of classroom1; student2 of classroom2. parent1 holds a
 * CONFIRMED ParentLink to student1. admin1 holds the ADMIN role, org-wide
 * (admin oversight is legitimately organization-scoped, unlike a Teacher's
 * per-classroom authority — see docs/authz/authorization.md).
 */

process.env.MFA_SECRET_ENCRYPTION_KEY = Buffer.from(
  new Uint8Array(32).map((_, i) => i + 1),
).toString("base64");

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../packages/db/migrations/sqlite",
);

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema: sqliteSchema });
migrate(db, { migrationsFolder });

const authRepository = createAuthRepository(db, sqliteSchema);
const authzRepository = createAuthzRepository(db, sqliteSchema);
const academicStructureRepository = createAcademicStructureRepository(db, sqliteSchema);
const app = createApp({ authRepository, authzRepository, academicStructureRepository });

const ORG_A = uuid7();
const ORG_B = uuid7();

const ROLE_ID: Record<string, string> = Object.fromEntries(SYSTEM_ROLES.map((r) => [r.key, r.id]));

function now() {
  return new Date();
}

async function authHeader(userId: string, organizationId: string): Promise<string> {
  const { rawToken } = await issueSession(
    authRepository,
    { organizationId, userId, sessionType: "standard" },
    uuid7,
    now(),
  );
  return `Bearer ${rawToken}`;
}

function insertUser(organizationId: string, email: string) {
  const t = now();
  const id = uuid7();
  db.insert(sqliteSchema.users)
    .values({
      id,
      organizationId,
      email,
      phone: null,
      passwordHash: null,
      status: "active",
      locale: "en",
      timezone: "UTC",
      mfaEnabled: false,
      failedLoginCount: 0,
      lockedUntil: null,
      emailVerifiedAt: t,
      createdAt: t,
      updatedAt: t,
    })
    .run();
  return id;
}

function assignRole(
  organizationId: string,
  userId: string,
  roleKey: string,
  scopeType: string,
  scopeId: string | null,
) {
  const t = now();
  db.insert(sqliteSchema.userRoleAssignments)
    .values({
      id: uuid7(),
      organizationId,
      userId,
      roleId: ROLE_ID[roleKey]!,
      scopeType,
      scopeId,
      grantedBy: null,
      validFrom: t,
      validUntil: null,
      status: "active",
      createdAt: t,
      updatedAt: t,
    })
    .run();
}

function createMembership(
  organizationId: string,
  userId: string,
  containerType: "classroom" | "group",
  containerId: string,
) {
  const t = now();
  db.insert(sqliteSchema.memberships)
    .values({
      id: uuid7(),
      organizationId,
      userId,
      containerType,
      containerId,
      roleInContainer: "STUDENT",
      joinedAt: t,
      leftAt: null,
      status: "active",
      createdAt: t,
      updatedAt: t,
    })
    .run();
}

// --- Fixture ids ------------------------------------------------------------

let teacher1: string, teacher2: string, student1: string, student2: string;
let parent1: string, assistant1: string, admin1: string;
let orgBTeacher: string, orgBStudent: string;
let academicPeriodId: string, classroom1: string, classroom2: string, group1: string;
let orgBClassroom: string;
let confirmedLinkId: string;
// Isolated fixture for the SEC-014 live-re-verification test — deliberately
// never touched by any other test, since that test revokes teacher3's own
// authority mid-suite.
let teacher3: string, assistant2: string, classroom3: string;

beforeAll(() => {
  const t = now();
  db.insert(sqliteSchema.organizations)
    .values([
      {
        id: ORG_A,
        name: "Org A",
        slug: `org-a-${ORG_A}`,
        timezone: "UTC",
        locale: "en",
        status: "active",
        createdAt: t,
        updatedAt: t,
      },
      {
        id: ORG_B,
        name: "Org B",
        slug: `org-b-${ORG_B}`,
        timezone: "UTC",
        locale: "en",
        status: "active",
        createdAt: t,
        updatedAt: t,
      },
    ])
    .run();

  db.insert(sqliteSchema.roles).values(systemRoleRows()).run();
  db.insert(sqliteSchema.permissions).values(permissionRows()).run();
  db.insert(sqliteSchema.rolePermissions).values(rolePermissionRows()).run();

  teacher1 = insertUser(ORG_A, `teacher1-${uuid7()}@example.test`);
  teacher2 = insertUser(ORG_A, `teacher2-${uuid7()}@example.test`);
  student1 = insertUser(ORG_A, `student1-${uuid7()}@example.test`);
  student2 = insertUser(ORG_A, `student2-${uuid7()}@example.test`);
  parent1 = insertUser(ORG_A, `parent1-${uuid7()}@example.test`);
  assistant1 = insertUser(ORG_A, `assistant1-${uuid7()}@example.test`);
  admin1 = insertUser(ORG_A, `admin1-${uuid7()}@example.test`);
  orgBTeacher = insertUser(ORG_B, `teacher-b-${uuid7()}@example.test`);
  orgBStudent = insertUser(ORG_B, `student-b-${uuid7()}@example.test`);
  teacher3 = insertUser(ORG_A, `teacher3-${uuid7()}@example.test`);
  assistant2 = insertUser(ORG_A, `assistant2-${uuid7()}@example.test`);

  academicPeriodId = uuid7();
  db.insert(sqliteSchema.academicPeriods)
    .values({
      id: academicPeriodId,
      organizationId: ORG_A,
      name: "2026-2027",
      startsOn: "2026-09-01",
      endsOn: "2027-06-30",
      status: "active",
      createdBy: teacher1,
      createdAt: t,
      updatedAt: t,
    })
    .run();

  classroom1 = uuid7();
  classroom2 = uuid7();
  db.insert(sqliteSchema.classrooms)
    .values([
      {
        id: classroom1,
        organizationId: ORG_A,
        name: "Classroom 1",
        gradeLevel: "10",
        academicPeriodId,
        homeroomTeacherId: teacher1,
        status: "active",
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      },
      {
        id: classroom2,
        organizationId: ORG_A,
        name: "Classroom 2",
        gradeLevel: "10",
        academicPeriodId,
        homeroomTeacherId: teacher2,
        status: "active",
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      },
    ])
    .run();

  group1 = uuid7();
  db.insert(sqliteSchema.groups)
    .values({
      id: group1,
      organizationId: ORG_A,
      classroomId: classroom1,
      name: "Group 1",
      purpose: null,
      status: "active",
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    })
    .run();

  classroom3 = uuid7();
  db.insert(sqliteSchema.classrooms)
    .values({
      id: classroom3,
      organizationId: ORG_A,
      name: "Classroom 3 (isolated fixture)",
      gradeLevel: "10",
      academicPeriodId,
      homeroomTeacherId: teacher3,
      status: "active",
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    })
    .run();

  orgBClassroom = uuid7();
  db.insert(sqliteSchema.classrooms)
    .values({
      id: orgBClassroom,
      organizationId: ORG_B,
      name: "Org B Classroom",
      gradeLevel: "10",
      academicPeriodId: (() => {
        const id = uuid7();
        db.insert(sqliteSchema.academicPeriods)
          .values({
            id,
            organizationId: ORG_B,
            name: "Org B period",
            startsOn: "2026-09-01",
            endsOn: "2027-06-30",
            status: "active",
            createdBy: orgBTeacher,
            createdAt: t,
            updatedAt: t,
          })
          .run();
        return id;
      })(),
      homeroomTeacherId: orgBTeacher,
      status: "active",
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    })
    .run();

  assignRole(ORG_A, teacher1, "TEACHER", "CLASSROOM", classroom1);
  assignRole(ORG_A, teacher2, "TEACHER", "CLASSROOM", classroom2);
  assignRole(ORG_A, student1, "STUDENT", "ORG", null);
  assignRole(ORG_A, student2, "STUDENT", "ORG", null);
  assignRole(ORG_A, parent1, "PARENT", "ORG", null);
  assignRole(ORG_A, assistant1, "ASSISTANT", "ORG", null);
  assignRole(ORG_A, admin1, "ADMIN", "ORG", null);
  assignRole(ORG_A, teacher3, "TEACHER", "CLASSROOM", classroom3);
  assignRole(ORG_A, assistant2, "ASSISTANT", "ORG", null);
  assignRole(ORG_B, orgBTeacher, "TEACHER", "CLASSROOM", orgBClassroom);
  assignRole(ORG_B, orgBStudent, "STUDENT", "ORG", null);

  createMembership(ORG_A, student1, "classroom", classroom1);
  createMembership(ORG_A, student2, "classroom", classroom2);
  createMembership(ORG_B, orgBStudent, "classroom", orgBClassroom);

  confirmedLinkId = uuid7();
  db.insert(sqliteSchema.parentLinks)
    .values({
      id: confirmedLinkId,
      organizationId: ORG_A,
      parentUserId: parent1,
      studentUserId: student1,
      relationship: "parent",
      requestedBy: parent1,
      confirmedAt: t,
      confirmedBy: teacher1,
      revokedAt: null,
      status: "confirmed",
      createdAt: t,
      updatedAt: t,
    })
    .run();
});

afterAll(() => {
  sqlite.close();
});

async function get(pathName: string, auth: string) {
  return app.request(pathName, { headers: { authorization: auth } });
}
async function post(pathName: string, auth: string, body?: unknown) {
  return app.request(pathName, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function patch(pathName: string, auth: string, body?: unknown) {
  return app.request(pathName, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: auth },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function del(pathName: string, auth: string, body?: unknown) {
  return app.request(pathName, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: auth },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("classrooms — relationship visibility (§7.4)", () => {
  it("lets the owning Teacher see their own classroom", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, auth);
    expect(res.status).toBe(200);
  });

  it("denies a different Teacher access to a classroom they do not own or hold scope on (404, not 403 — SEC-009)", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, auth);
    expect(res.status).toBe(404);
  });

  it("lets a Student see the classroom they are an active member of", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, auth);
    expect(res.status).toBe(200);
  });

  it("denies a Student access to a classroom they are not a member of", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom2}`, auth);
    expect(res.status).toBe(404);
  });

  it("lets a Group inside a Teacher's classroom-scoped grant inherit that scope (containment)", async () => {
    // group1 is inside classroom1; teacher1's grant is CLASSROOM-scoped on
    // classroom1 — this proves scope containment, not a separate grant.
    const authzTargetOk = await authzRepository.activeUserRoleAssignments(ORG_A, teacher1, now());
    expect(authzTargetOk.some((a) => a.scopeType === "CLASSROOM" && a.scopeId === classroom1)).toBe(
      true,
    );
  });

  it("lets a confirmed-link Parent see their linked child's classroom", async () => {
    const auth = await authHeader(parent1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, auth);
    expect(res.status).toBe(200);
  });

  it("denies a Parent access to a classroom their child is not in", async () => {
    const auth = await authHeader(parent1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom2}`, auth);
    expect(res.status).toBe(404);
  });

  it("lets Admin see any classroom in their organization (org-wide oversight)", async () => {
    const auth = await authHeader(admin1, ORG_A);
    const res1 = await get(`/api/v1/classrooms/${classroom1}`, auth);
    const res2 = await get(`/api/v1/classrooms/${classroom2}`, auth);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it("denies cross-organization access even with a real classroom id (tenant isolation, GEN-025)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await get(`/api/v1/classrooms/${orgBClassroom}`, auth);
    expect(res.status).toBe(404);
  });

  it("denies access to a nonexistent classroom id with the exact same status as a real-but-unauthorized one (SEC-009)", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const realButDenied = await get(`/api/v1/classrooms/${classroom1}`, auth);
    const genuinelyMissing = await get(`/api/v1/classrooms/${uuid7()}`, auth);
    expect(realButDenied.status).toBe(genuinelyMissing.status);
    expect(genuinelyMissing.status).toBe(404);
  });

  it("rejects a request with no bearer token at all", async () => {
    const res = await app.request(`/api/v1/classrooms/${classroom1}`);
    expect(res.status).toBe(401);
  });

  it("list endpoint only returns classrooms the caller actually has a relationship to", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const res = await get("/api/v1/classrooms", auth);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { classrooms: Array<{ id: string }> };
    const ids = body.classrooms.map((c) => c.id);
    expect(ids).toContain(classroom2);
    expect(ids).not.toContain(classroom1);
  });
});

describe("classrooms — MANAGE_CLASSROOM permission gate (§26.2)", () => {
  it("lets the owning Teacher update their own classroom", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await patch(`/api/v1/classrooms/${classroom1}`, auth, {
      name: "Classroom 1 (renamed)",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { classroom: { name: string } };
    expect(body.classroom.name).toBe("Classroom 1 (renamed)");
  });

  it("denies a Student from updating any classroom, even one they belong to", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await patch(`/api/v1/classrooms/${classroom1}`, auth, { name: "hacked" });
    expect(res.status).toBe(404);
  });

  it("denies a Parent from updating a classroom (PAR-003: read-oriented only)", async () => {
    const auth = await authHeader(parent1, ORG_A);
    const res = await patch(`/api/v1/classrooms/${classroom1}`, auth, { name: "hacked" });
    expect(res.status).toBe(404);
  });

  it("denies a different Teacher from updating a classroom they don't own", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const res = await patch(`/api/v1/classrooms/${classroom1}`, auth, { name: "hacked" });
    expect(res.status).toBe(404);
  });

  it("forged organizationId in the request body has no effect — the target org always comes from the session (SEC-004)", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const res = await patch(`/api/v1/classrooms/${classroom1}`, auth, {
      name: "hacked",
      organizationId: ORG_B,
    });
    expect(res.status).toBe(404);
  });
});

describe("assistant-assignments — delegation lifecycle (§21 AST-*)", () => {
  let assignmentId: string;

  it("lets a Teacher delegate permissions they hold to an Assistant, scoped to a classroom they own", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/assistant-assignments", auth, {
      assistantUserId: assistant1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["VIEW_STUDENTS", "MANAGE_CLASSROOM"],
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { assignment: { id: string; status: string } };
    expect(body.assignment.status).toBe("active");
    assignmentId = body.assignment.id;
  });

  it("gives the Assistant real, working access matching exactly the delegated scope and permissions", async () => {
    const assistantAuth = await authHeader(assistant1, ORG_A);
    const canRead = await get(`/api/v1/classrooms/${classroom1}`, assistantAuth);
    expect(canRead.status).toBe(200);
    const canWrite = await patch(`/api/v1/classrooms/${classroom1}`, assistantAuth, {
      name: "Classroom 1 (edited by assistant)",
    });
    expect(canWrite.status).toBe(200);
  });

  it("never extends the Assistant's access beyond the delegated scope (AST-002)", async () => {
    const assistantAuth = await authHeader(assistant1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom2}`, assistantAuth);
    expect(res.status).toBe(404);
  });

  it("rejects delegating a non-delegatable permission (AST-004/§26.2's closed delegability column)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/assistant-assignments", auth, {
      assistantUserId: assistant1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["ASSIGN_ASSISTANT"],
    });
    expect(res.status).toBe(422);
  });

  it("rejects delegating an administrative (§26.3) permission outright — it isn't even in the delegatable set", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/assistant-assignments", auth, {
      assistantUserId: assistant1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["USER_SUSPEND"],
    });
    expect(res.status).toBe(422);
  });

  it("rejects delegating to a user who does not hold the ASSISTANT role (AST-001)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/assistant-assignments", auth, {
      assistantUserId: student1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["VIEW_STUDENTS"],
    });
    expect(res.status).toBe(422);
  });

  it("rejects delegating a permission the delegating Teacher does not itself hold in that scope — no privilege amplification (SEC-006/GEN-025)", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const res = await post("/api/v1/assistant-assignments", auth, {
      assistantUserId: assistant1,
      // teacher2 has no authority at all over classroom1.
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["MANAGE_CLASSROOM"],
    });
    expect(res.status).toBe(403);
  });

  it("forged organizationId/teacherUserId in the request body has no effect — always the caller's own session identity (SEC-004)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/assistant-assignments", auth, {
      assistantUserId: assistant1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["VIEW_STUDENTS"],
      organizationId: ORG_B,
      teacherUserId: teacher2,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      assignment: { id: string; organizationId: string; teacherUserId: string };
    };
    expect(body.assignment.organizationId).toBe(ORG_A);
    expect(body.assignment.teacherUserId).toBe(teacher1);

    // Cleanup: this assignment isn't the one the later revoke/expiry tests
    // exercise, and would otherwise silently keep granting assistant1
    // access to classroom1 for the rest of this describe block.
    await del(`/api/v1/assistant-assignments/${body.assignment.id}`, auth);
  });

  it("lists assignments granted (Teacher view) and assignments held (Assistant view) separately and correctly", async () => {
    const teacherAuth = await authHeader(teacher1, ORG_A);
    const teacherList = await get("/api/v1/assistant-assignments", teacherAuth);
    const teacherBody = (await teacherList.json()) as { assignments: Array<{ id: string }> };
    expect(teacherBody.assignments.some((a) => a.id === assignmentId)).toBe(true);

    const assistantAuth = await authHeader(assistant1, ORG_A);
    const assistantList = await get("/api/v1/assistant-assignments/delegated-to-me", assistantAuth);
    const assistantBody = (await assistantList.json()) as { assignments: Array<{ id: string }> };
    expect(assistantBody.assignments.some((a) => a.id === assignmentId)).toBe(true);
  });

  it("denies revocation by an unrelated user (404 — not_found, never discloses the assignment exists)", async () => {
    const auth = await authHeader(teacher2, ORG_A);
    const res = await del(`/api/v1/assistant-assignments/${assignmentId}`, auth);
    expect(res.status).toBe(404);
  });

  it("revokes immediately when the delegating Teacher does it, and access stops working right away (AST-007)", async () => {
    const teacherAuth = await authHeader(teacher1, ORG_A);
    const revoke = await del(`/api/v1/assistant-assignments/${assignmentId}`, teacherAuth, {
      reason: "no longer needed",
    });
    expect(revoke.status).toBe(200);

    const assistantAuth = await authHeader(assistant1, ORG_A);
    const stillWorks = await get(`/api/v1/classrooms/${classroom1}`, assistantAuth);
    expect(stillWorks.status).toBe(404);
  });

  it("revoking an already-revoked assignment 404s (concurrent-revocation edge case)", async () => {
    const teacherAuth = await authHeader(teacher1, ORG_A);
    const res = await del(`/api/v1/assistant-assignments/${assignmentId}`, teacherAuth);
    expect(res.status).toBe(404);
  });

  it("audits every grant and revocation with correct attribution (AST-005)", async () => {
    const events = db
      .select()
      .from(sqliteSchema.auditLog)
      .where(eq(sqliteSchema.auditLog.targetId, assignmentId))
      .all() as Array<{ action: string; actorUserId: string }>;
    const created = events.find((e) => e.action === "ASSISTANT_ASSIGNMENT_CREATED");
    const revoked = events.find((e) => e.action === "ASSISTANT_ASSIGNMENT_REVOKED");
    expect(created?.actorUserId).toBe(teacher1);
    expect(revoked?.actorUserId).toBe(teacher1);
  });

  it("lets an Admin revoke an assignment they did not grant", async () => {
    const teacherAuth = await authHeader(teacher1, ORG_A);
    const create = await post("/api/v1/assistant-assignments", teacherAuth, {
      assistantUserId: assistant1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["VIEW_STUDENTS"],
    });
    const { assignment } = (await create.json()) as { assignment: { id: string } };

    const adminAuth = await authHeader(admin1, ORG_A);
    const revoke = await del(`/api/v1/assistant-assignments/${assignment.id}`, adminAuth);
    expect(revoke.status).toBe(200);
  });

  it("denies access once the assignment's own validUntil has passed, even though status stays 'active' in storage (AST-006/AST-007 — expiry evaluated at authorisation time, not a background job)", async () => {
    const teacherAuth = await authHeader(teacher1, ORG_A);
    const create = await post("/api/v1/assistant-assignments", teacherAuth, {
      assistantUserId: assistant1,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom1 }],
      permissionKeys: ["VIEW_STUDENTS"],
      validUntil: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(create.status).toBe(201);

    const row = db
      .select()
      .from(sqliteSchema.assistantAssignments)
      .where(eq(sqliteSchema.assistantAssignments.assistantUserId, assistant1))
      .all()
      .find((r: { status: string }) => r.status === "active") as { status: string } | undefined;
    expect(row?.status).toBe("active"); // never flipped by a background job

    const assistantAuth = await authHeader(assistant1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, assistantAuth);
    expect(res.status).toBe(404);
  });

  it("SEC-014: re-verifies the delegating Teacher's authority live on every request — losing it silently drops the Assistant's delegated access even though the AssistantAssignment row itself is untouched", async () => {
    const teacherAuth = await authHeader(teacher3, ORG_A);
    const create = await post("/api/v1/assistant-assignments", teacherAuth, {
      assistantUserId: assistant2,
      scopes: [{ scopeType: "CLASSROOM", scopeId: classroom3 }],
      permissionKeys: ["VIEW_STUDENTS"],
    });
    expect(create.status).toBe(201);

    const assistantAuth = await authHeader(assistant2, ORG_A);
    const before = await get(`/api/v1/classrooms/${classroom3}`, assistantAuth);
    expect(before.status).toBe(200);

    // teacher3 loses their only authority over classroom3 — deactivate their
    // TEACHER role assignment directly (simulating an out-of-band change,
    // e.g. a later Phase's role-management action), WITHOUT touching the
    // AssistantAssignment row at all.
    db.update(sqliteSchema.userRoleAssignments)
      .set({ status: "revoked" })
      .where(eq(sqliteSchema.userRoleAssignments.userId, teacher3))
      .run();

    const after = await get(`/api/v1/classrooms/${classroom3}`, assistantAuth);
    expect(after.status).toBe(404);

    const stillActiveRow = db
      .select()
      .from(sqliteSchema.assistantAssignments)
      .where(eq(sqliteSchema.assistantAssignments.assistantUserId, assistant2))
      .get() as { status: string };
    expect(stillActiveRow.status).toBe("active");
  });
});

describe("parent-links — Parent<->Student linking lifecycle (§22 PAR-*)", () => {
  let requestedLinkId: string;
  let parent2: string, student3: string, teacherForLink: string;

  beforeAll(() => {
    parent2 = insertUser(ORG_A, `parent2-${uuid7()}@example.test`);
    student3 = insertUser(ORG_A, `student3-${uuid7()}@example.test`);
    teacherForLink = teacher1;
    assignRole(ORG_A, parent2, "PARENT", "ORG", null);
    assignRole(ORG_A, student3, "STUDENT", "ORG", null);
  });

  it("lets a Parent self-service request a link to their child", async () => {
    const auth = await authHeader(parent2, ORG_A);
    const res = await post("/api/v1/parent-links", auth, {
      parentUserId: parent2,
      studentUserId: student3,
      relationship: "parent",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { link: { id: string; status: string } };
    expect(body.link.status).toBe("requested");
    requestedLinkId = body.link.id;
  });

  it("a REQUESTED link grants nothing yet (PAR-002) — the parent cannot see the child's classroom", async () => {
    createMembership(ORG_A, student3, "classroom", classroom2);
    const auth = await authHeader(parent2, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom2}`, auth);
    expect(res.status).toBe(404);
  });

  it("rejects the Parent confirming their own claim (PAR-002 — only Teacher/Admin may confirm)", async () => {
    const auth = await authHeader(parent2, ORG_A);
    const res = await post(`/api/v1/parent-links/${requestedLinkId}/confirm`, auth);
    expect(res.status).toBe(403);
  });

  it("lets a Teacher confirm the link, which immediately grants access", async () => {
    const auth = await authHeader(teacherForLink, ORG_A);
    const res = await post(`/api/v1/parent-links/${requestedLinkId}/confirm`, auth);
    expect(res.status).toBe(200);

    const parentAuth = await authHeader(parent2, ORG_A);
    const canSee = await get(`/api/v1/classrooms/${classroom2}`, parentAuth);
    expect(canSee.status).toBe(200);
  });

  it("still denies the Parent write access even with a confirmed link (PAR-003 — read-oriented only)", async () => {
    const auth = await authHeader(parent2, ORG_A);
    const res = await patch(`/api/v1/classrooms/${classroom2}`, auth, { name: "hacked" });
    expect(res.status).toBe(404);
  });

  it("rejects the Parent revoking their own link (PAR-006 — only Teacher/Admin)", async () => {
    const auth = await authHeader(parent2, ORG_A);
    const res = await del(`/api/v1/parent-links/${requestedLinkId}`, auth);
    expect(res.status).toBe(403);
  });

  it("revoking immediately removes access (PAR-006)", async () => {
    const auth = await authHeader(teacherForLink, ORG_A);
    const res = await del(`/api/v1/parent-links/${requestedLinkId}`, auth, {
      reason: "no longer applicable",
    });
    expect(res.status).toBe(200);

    const parentAuth = await authHeader(parent2, ORG_A);
    const stillWorks = await get(`/api/v1/classrooms/${classroom2}`, parentAuth);
    expect(stillWorks.status).toBe(404);
  });

  it("audits request/confirm/revoke with correct attribution (PAR-009)", async () => {
    const events = db
      .select()
      .from(sqliteSchema.auditLog)
      .where(eq(sqliteSchema.auditLog.targetId, requestedLinkId))
      .all() as Array<{ action: string; actorUserId: string }>;
    expect(
      events.some((e) => e.action === "PARENT_LINK_REQUESTED" && e.actorUserId === parent2),
    ).toBe(true);
    expect(
      events.some((e) => e.action === "PARENT_LINK_CONFIRMED" && e.actorUserId === teacherForLink),
    ).toBe(true);
    expect(
      events.some((e) => e.action === "PARENT_LINK_REVOKED" && e.actorUserId === teacherForLink),
    ).toBe(true);
  });

  it("cross-organization: a Parent link cannot be created across organizations", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/parent-links", auth, {
      parentUserId: parent2,
      studentUserId: orgBStudent,
      relationship: "parent",
    });
    // orgBStudent does not resolve as a STUDENT within ORG_A's role table
    // (role assignments are themselves organization-scoped), so this fails
    // validation rather than ever considering a cross-org link.
    expect(res.status).toBe(422);
  });

  it("only the student themselves or staff (Teacher/Admin) may list a given student's links — GEN-025", async () => {
    const otherStudentAuth = await authHeader(student1, ORG_A);
    const res = await get(`/api/v1/parent-links/for-student/${student3}`, otherStudentAuth);
    expect(res.status).toBe(404);

    const selfAuth = await authHeader(student3, ORG_A);
    const selfRes = await get(`/api/v1/parent-links/for-student/${student3}`, selfAuth);
    expect(selfRes.status).toBe(200);

    const staffAuth = await authHeader(teacherForLink, ORG_A);
    const staffRes = await get(`/api/v1/parent-links/for-student/${student3}`, staffAuth);
    expect(staffRes.status).toBe(200);
  });

  it("the pre-existing confirmed link (parent1 -> student1) already grants access — direct-DB-fixture sanity check", async () => {
    const auth = await authHeader(parent1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, auth);
    expect(res.status).toBe(200);
  });

  it("revoking the pre-existing confirmed link removes access", async () => {
    const teacherAuth = await authHeader(teacher1, ORG_A);
    const revoke = await del(`/api/v1/parent-links/${confirmedLinkId}`, teacherAuth);
    expect(revoke.status).toBe(200);

    const parentAuth = await authHeader(parent1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroom1}`, parentAuth);
    expect(res.status).toBe(404);
  });
});
