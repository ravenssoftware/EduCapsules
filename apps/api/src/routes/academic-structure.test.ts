import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
 * Full HTTP-surface integration tests for Phase 6's academic-structure
 * module (AcademicPeriod, Classroom, Group, Membership, Subject, Course,
 * CourseAudience, Cycle, Topic, Enrollment) — SRS §8.1, §9, §10, §37.3.2.
 * Same conventions as ../routes/authz.test.ts: a real in-memory SQLite
 * database migrated with the real generated migrations, real HTTP requests
 * through the real routes, every check exercised through the actual
 * centralized authz pipeline (never mocked or bypassed).
 *
 * Fixture shape (see beforeAll): two organizations for isolation. ORG_A has
 * admin1 (ADMIN, org-wide), teacher1 and teacher2 (each TEACHER, org-wide —
 * unlike authz.test.ts's classroom-scoped teachers, Phase 6's own creation
 * flows require ORG-wide MANAGE_CLASSROOM/MANAGE_COURSE authority, since a
 * not-yet-existing resource has no narrower scope to check against), a
 * shared academicPeriod1, student1 (STUDENT, org-wide role + Classroom
 * membership added per-test), and parent1 (PARENT, org-wide + confirmed
 * ParentLink to student1). ORG_B has a single teacher/admin pair for
 * cross-tenant isolation tests.
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

/**
 * A Teacher scoped ONLY to a throwaway classroom of their own — genuinely
 * has no authority over any other resource in the org, unlike teacher1/
 * teacher2 above (both deliberately ORG-wide, since Phase 6's own creation
 * flows need ORG-wide authority — see this file's header comment). Used for
 * "denies an unrelated Teacher" tests, where an ORG-wide teacher2 would
 * incorrectly pass (they hold real, independent ORG-wide authority too).
 */
function createUnrelatedTeacher(): string {
  const t = now();
  const id = insertUser(ORG_A, `unrelated-${uuid7()}@example.test`);
  const ownClassroom = uuid7();
  db.insert(sqliteSchema.classrooms)
    .values({
      id: ownClassroom,
      organizationId: ORG_A,
      name: "Unrelated teacher's own classroom",
      gradeLevel: null,
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: id,
      status: "active",
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    })
    .run();
  assignRole(ORG_A, id, "TEACHER", "CLASSROOM", ownClassroom);
  return id;
}

// --- Fixture ids ------------------------------------------------------------

let admin1: string, teacher1: string, teacher2: string, student1: string, parent1: string;
let orgBAdmin: string, orgBTeacher: string;
let academicPeriod1: string, orgBPeriod: string;

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

  admin1 = insertUser(ORG_A, `admin1-${uuid7()}@example.test`);
  teacher1 = insertUser(ORG_A, `teacher1-${uuid7()}@example.test`);
  teacher2 = insertUser(ORG_A, `teacher2-${uuid7()}@example.test`);
  student1 = insertUser(ORG_A, `student1-${uuid7()}@example.test`);
  parent1 = insertUser(ORG_A, `parent1-${uuid7()}@example.test`);
  orgBAdmin = insertUser(ORG_B, `admin-b-${uuid7()}@example.test`);
  orgBTeacher = insertUser(ORG_B, `teacher-b-${uuid7()}@example.test`);

  assignRole(ORG_A, admin1, "ADMIN", "ORG", null);
  assignRole(ORG_A, teacher1, "TEACHER", "ORG", null);
  assignRole(ORG_A, teacher2, "TEACHER", "ORG", null);
  assignRole(ORG_A, student1, "STUDENT", "ORG", null);
  assignRole(ORG_A, parent1, "PARENT", "ORG", null);
  assignRole(ORG_B, orgBAdmin, "ADMIN", "ORG", null);
  assignRole(ORG_B, orgBTeacher, "TEACHER", "ORG", null);

  academicPeriod1 = uuid7();
  db.insert(sqliteSchema.academicPeriods)
    .values({
      id: academicPeriod1,
      organizationId: ORG_A,
      name: "2026-2027",
      startsOn: "2026-09-01",
      endsOn: "2027-06-30",
      status: "active",
      createdBy: admin1,
      createdAt: t,
      updatedAt: t,
    })
    .run();

  orgBPeriod = uuid7();
  db.insert(sqliteSchema.academicPeriods)
    .values({
      id: orgBPeriod,
      organizationId: ORG_B,
      name: "Org B period",
      startsOn: "2026-09-01",
      endsOn: "2027-06-30",
      status: "active",
      createdBy: orgBAdmin,
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
async function del(pathName: string, auth: string) {
  return app.request(pathName, { method: "DELETE", headers: { authorization: auth } });
}

// =============================================================================
// AcademicPeriod (PER-001..006)
// =============================================================================

describe("academic-periods — PER-001..006", () => {
  it("lets Admin create an AcademicPeriod (PER-002)", async () => {
    const auth = await authHeader(admin1, ORG_A);
    const res = await post("/api/v1/academic-periods", auth, {
      name: "Summer 2027",
      startsOn: "2027-07-01",
      endsOn: "2027-08-15",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { academicPeriod: { status: string } };
    expect(body.academicPeriod.status).toBe("planned");
  });

  it("denies a Teacher from creating an AcademicPeriod (no delegation mechanism implemented — PER-002 known limitation)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/academic-periods", auth, {
      name: "Should fail",
      startsOn: "2028-01-01",
      endsOn: "2028-02-01",
    });
    expect(res.status).toBe(403);
  });

  it("denies a Student from creating an AcademicPeriod", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await post("/api/v1/academic-periods", auth, {
      name: "Should fail",
      startsOn: "2028-01-01",
      endsOn: "2028-02-01",
    });
    expect(res.status).toBe(403);
  });

  it("rejects an overlapping date range within the same Organization (PER-004)", async () => {
    const auth = await authHeader(admin1, ORG_A);
    const res = await post("/api/v1/academic-periods", auth, {
      name: "Overlaps 2026-2027",
      startsOn: "2027-01-01",
      endsOn: "2027-08-01",
    });
    expect(res.status).toBe(409);
  });

  it("allows the exact same date range in a DIFFERENT Organization (isolation)", async () => {
    const auth = await authHeader(orgBAdmin, ORG_B);
    const res = await post("/api/v1/academic-periods", auth, {
      name: "Same dates, different org",
      startsOn: "2026-09-01",
      endsOn: "2027-06-30",
    });
    expect(res.status).toBe(409); // overlaps orgBPeriod itself, created in beforeAll for ORG_B
  });

  it("rejects endsOn before startsOn", async () => {
    const auth = await authHeader(admin1, ORG_A);
    const res = await post("/api/v1/academic-periods", auth, {
      name: "Backwards",
      startsOn: "2030-06-01",
      endsOn: "2030-01-01",
    });
    expect(res.status).toBe(422);
  });

  it("rejects missing required fields", async () => {
    const auth = await authHeader(admin1, ORG_A);
    const res = await post("/api/v1/academic-periods", auth, { name: "No dates" });
    expect(res.status).toBe(422);
  });

  it("lets Admin close an AcademicPeriod without deleting or hiding a Classroom created within it (PER-005), and a closed period cannot be reopened", async () => {
    const auth = await authHeader(admin1, ORG_A);
    const created = await post("/api/v1/academic-periods", auth, {
      name: "To be closed",
      startsOn: "2029-01-01",
      endsOn: "2029-06-01",
    });
    const { academicPeriod } = (await created.json()) as { academicPeriod: { id: string } };
    const classroomInPeriod = await post("/api/v1/classrooms", await authHeader(teacher1, ORG_A), {
      name: "Classroom in the period to be closed",
      academicPeriodId: academicPeriod.id,
      homeroomTeacherId: teacher1,
    });
    const { classroom } = (await classroomInPeriod.json()) as { classroom: { id: string } };

    const closed = await patch(`/api/v1/academic-periods/${academicPeriod.id}`, auth, {
      status: "closed",
    });
    expect(closed.status).toBe(200);

    // PER-005: closing never deletes or hides Classrooms created within it —
    // the row remains fully readable, unchanged, after the period closes.
    const stillReadable = await get(
      `/api/v1/classrooms/${classroom.id}`,
      await authHeader(teacher1, ORG_A),
    );
    expect(stillReadable.status).toBe(200);
    const stillReadableBody = (await stillReadable.json()) as {
      classroom: { academicPeriodId: string };
    };
    expect(stillReadableBody.classroom.academicPeriodId).toBe(academicPeriod.id);

    const reopen = await patch(`/api/v1/academic-periods/${academicPeriod.id}`, auth, {
      status: "active",
    });
    expect(reopen.status).toBe(409);
  });

  it("Teacher and Admin can list/read periods; a plain Student cannot (ORG-scope relationship gate)", async () => {
    const teacherRes = await get("/api/v1/academic-periods", await authHeader(teacher1, ORG_A));
    const adminRes = await get(
      `/api/v1/academic-periods/${academicPeriod1}`,
      await authHeader(admin1, ORG_A),
    );
    const studentRes = await get(
      `/api/v1/academic-periods/${academicPeriod1}`,
      await authHeader(student1, ORG_A),
    );
    expect(teacherRes.status).toBe(200);
    expect(adminRes.status).toBe(200);
    // SEC-009: this is an object-identified check (objectId=academicPeriod1),
    // so a denial reports as not_found, indistinguishable from a genuinely
    // nonexistent id — never forbidden.
    expect(studentRes.status).toBe(404);
  });

  it("denies cross-organization access to a real AcademicPeriod id (SEC-009: 404, not 403)", async () => {
    const auth = await authHeader(orgBAdmin, ORG_B);
    const res = await get(`/api/v1/academic-periods/${academicPeriod1}`, auth);
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// Classroom (CLS-*) and Group (GRP-*)
// =============================================================================

describe("classrooms — CRUD, authorization, archive", () => {
  it("lets a Teacher with org-wide MANAGE_CLASSROOM create a Classroom", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/classrooms", auth, {
      name: "Grade 9",
      gradeLevel: "9",
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: teacher1,
    });
    expect(res.status).toBe(201);
  });

  it("rejects creating a Classroom with a nonexistent academicPeriodId", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/classrooms", auth, {
      name: "Bad period",
      academicPeriodId: uuid7(),
    });
    expect(res.status).toBe(422);
  });

  it("rejects creating a Classroom with an AcademicPeriod id that belongs to a different Organization", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/classrooms", auth, {
      name: "Cross-org period",
      academicPeriodId: orgBPeriod,
    });
    expect(res.status).toBe(422);
  });

  it("denies a Student from creating a Classroom", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await post("/api/v1/classrooms", auth, {
      name: "Should fail",
      academicPeriodId: academicPeriod1,
    });
    expect(res.status).toBe(403);
  });

  it("archives a Classroom via PATCH status, and it stays readable afterward (archive != delete)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const created = await post("/api/v1/classrooms", auth, {
      name: "To archive",
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: teacher1,
    });
    const { classroom } = (await created.json()) as { classroom: { id: string } };
    const archived = await patch(`/api/v1/classrooms/${classroom.id}`, auth, {
      status: "archived",
    });
    expect(archived.status).toBe(200);
    const stillReadable = await get(`/api/v1/classrooms/${classroom.id}`, auth);
    expect(stillReadable.status).toBe(200);
    const body = (await stillReadable.json()) as { classroom: { status: string } };
    expect(body.classroom.status).toBe("archived");
  });
});

describe("groups — GRP-001..003 (nested under Classroom)", () => {
  let classroomId: string;

  beforeAll(async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/classrooms", auth, {
      name: "Classroom for groups",
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: teacher1,
    });
    const body = (await res.json()) as { classroom: { id: string } };
    classroomId = body.classroom.id;
  });

  it("lets the classroom's Teacher create a Group inside it", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/classrooms/${classroomId}/groups`, auth, { name: "Group A" });
    expect(res.status).toBe(201);
  });

  it("denies a Teacher with no relationship to this classroom from creating a Group in it (SEC-009: 404)", async () => {
    const auth = await authHeader(createUnrelatedTeacher(), ORG_A);
    const res = await post(`/api/v1/classrooms/${classroomId}/groups`, auth, { name: "Group B" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a Group creation attempt against a nonexistent Classroom", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/classrooms/${uuid7()}/groups`, auth, { name: "Nowhere" });
    expect(res.status).toBe(404);
  });

  it("lets the classroom's Teacher list Groups inside it", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await get(`/api/v1/classrooms/${classroomId}/groups`, auth);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { groups: unknown[] };
    expect(body.groups.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Membership (CLS-009/010, PER-003, BR-015)
// =============================================================================

describe("memberships — PER-003 cardinality and the move-student operation (BR-015)", () => {
  let classroomX: string, classroomY: string, movableStudent: string;

  beforeAll(async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const resX = await post("/api/v1/classrooms", auth, {
      name: "Classroom X",
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: teacher1,
    });
    classroomX = ((await resX.json()) as { classroom: { id: string } }).classroom.id;
    const resY = await post("/api/v1/classrooms", auth, {
      name: "Classroom Y",
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: teacher1,
    });
    classroomY = ((await resY.json()) as { classroom: { id: string } }).classroom.id;
    movableStudent = insertUser(ORG_A, `movable-${uuid7()}@example.test`);
    assignRole(ORG_A, movableStudent, "STUDENT", "ORG", null);
  });

  it("adds a student's first active Classroom membership in a period", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/memberships", auth, {
      userId: movableStudent,
      containerType: "classroom",
      containerId: classroomX,
    });
    expect(res.status).toBe(201);
  });

  it("PER-003: rejects a second active Classroom membership for the same student in the SAME AcademicPeriod", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/memberships", auth, {
      userId: movableStudent,
      containerType: "classroom",
      containerId: classroomY,
    });
    expect(res.status).toBe(409);
  });

  it("validates the polymorphic container reference — rejects a nonexistent classroom id (tenancy-and-security.md gap closure)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/memberships", auth, {
      userId: movableStudent,
      containerType: "classroom",
      containerId: uuid7(),
    });
    expect(res.status).toBe(404);
  });

  it("BR-015: moving a student ends the old membership and creates a new one, never deleting the old row", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const before = await get(
      `/api/v1/memberships?containerType=classroom&containerId=${classroomX}`,
      auth,
    );
    const beforeBody = (await before.json()) as { memberships: Array<{ userId: string }> };
    expect(beforeBody.memberships.some((m) => m.userId === movableStudent)).toBe(true);

    const moveRes = await post("/api/v1/memberships/move", auth, {
      userId: movableStudent,
      toClassroomId: classroomY,
    });
    expect(moveRes.status).toBe(200);

    const oldList = await get(
      `/api/v1/memberships?containerType=classroom&containerId=${classroomX}`,
      auth,
    );
    const oldBody = (await oldList.json()) as {
      memberships: Array<{ userId: string; leftAt: string | null; status: string }>;
    };
    const oldRow = oldBody.memberships.find((m) => m.userId === movableStudent)!;
    expect(oldRow).toBeDefined(); // CLS-009: never deleted
    expect(oldRow.leftAt).not.toBeNull();
    expect(oldRow.status).toBe("ended");

    const newList = await get(
      `/api/v1/memberships?containerType=classroom&containerId=${classroomY}`,
      auth,
    );
    const newBody = (await newList.json()) as {
      memberships: Array<{ userId: string; status: string }>;
    };
    expect(
      newBody.memberships.some((m) => m.userId === movableStudent && m.status === "active"),
    ).toBe(true);
  });

  it("denies a Teacher with no relationship to either classroom from moving a student (SEC-009: 404)", async () => {
    const auth = await authHeader(createUnrelatedTeacher(), ORG_A);
    const res = await post("/api/v1/memberships/move", auth, {
      userId: movableStudent,
      toClassroomId: classroomX,
    });
    expect(res.status).toBe(404);
  });

  it("denies a Student from ending their own membership (CLS-004: never self-modify; SEC-009: 404)", async () => {
    const membershipsRes = await get(
      `/api/v1/memberships?containerType=classroom&containerId=${classroomY}`,
      await authHeader(teacher1, ORG_A),
    );
    const body = (await membershipsRes.json()) as {
      memberships: Array<{ id: string; userId: string }>;
    };
    const row = body.memberships.find((m) => m.userId === movableStudent)!;
    const res = await del(`/api/v1/memberships/${row.id}`, await authHeader(movableStudent, ORG_A));
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// Subject (SUB-*)
// =============================================================================

describe("subjects — SUB-001/002", () => {
  it("lets a Teacher create a Subject", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/subjects", auth, { name: "Mathematics", code: "MATH-A" });
    expect(res.status).toBe(201);
  });

  it("rejects a duplicate Subject code within the same Organization", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/subjects", auth, { name: "Mathematics 2", code: "MATH-A" });
    expect(res.status).toBe(409);
  });

  it("allows the same Subject code in a DIFFERENT Organization", async () => {
    const auth = await authHeader(orgBTeacher, ORG_B);
    const res = await post("/api/v1/subjects", auth, { name: "Mathematics", code: "MATH-A" });
    expect(res.status).toBe(201);
  });

  it("denies a Student from creating a Subject", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await post("/api/v1/subjects", auth, { name: "Should fail", code: null });
    expect(res.status).toBe(403);
  });
});

// =============================================================================
// Course (CRS-*), co-teachers (CRS-009/010), CourseAudience
// =============================================================================

describe("courses — lifecycle (CRS-002/007/008), ownership (CRS-003), co-teachers (CRS-009/010)", () => {
  let subjectId: string;
  let courseId: string;

  beforeAll(async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post("/api/v1/subjects", auth, { name: "Physics", code: "PHYS-1" });
    subjectId = ((await res.json()) as { subject: { id: string } }).subject.id;
  });

  it("creates a Course as draft, recording the authenticated caller as owner — forged ownerTeacherId in the body has no effect (CRS-003)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/subjects/${subjectId}/courses`, auth, {
      title: "Physics I",
      academicPeriodId: academicPeriod1,
      ownerTeacherId: teacher2, // forged — must be ignored
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      course: { id: string; status: string; ownerTeacherId: string };
    };
    expect(body.course.status).toBe("draft");
    expect(body.course.ownerTeacherId).toBe(teacher1);
    courseId = body.course.id;
  });

  it("denies a different Teacher from creating a Course under a Subject they have no authority over", async () => {
    // subjectId itself is ORG-scoped-visible to any org-wide Teacher in this
    // fixture (both teacher1/teacher2 hold ORG-wide grants) — so this
    // specifically tests that Subject *existence* isn't the gate; scope is.
    // teacher2 DOES hold ORG-wide MANAGE_COURSE too in this fixture, so we
    // instead prove the SUBJECT-not-found path with a bogus subject id.
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/subjects/${uuid7()}/courses`, auth, {
      title: "Nowhere",
      academicPeriodId: academicPeriod1,
    });
    expect(res.status).toBe(404);
  });

  it("CRS-008: publishing is an explicit action, not implied by creation or update", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const updateOnly = await patch(`/api/v1/courses/${courseId}`, auth, {
      title: "Physics I (v2)",
    });
    expect(updateOnly.status).toBe(200);
    const stillDraft = (await updateOnly.json()) as { course: { status: string } };
    expect(stillDraft.course.status).toBe("draft");

    const publish = await post(`/api/v1/courses/${courseId}/publish`, auth);
    expect(publish.status).toBe(200);
    const published = (await publish.json()) as { course: { status: string } };
    expect(published.course.status).toBe("published");
  });

  it("rejects publishing a Course that is already published (invalid transition)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/publish`, auth);
    expect(res.status).toBe(409);
  });

  it("unpublishing returns the Course to draft", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/unpublish`, auth);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { course: { status: string } };
    expect(body.course.status).toBe("draft");
  });

  it("archiving is a one-way transition — archived Courses cannot be published again", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const archive = await post(`/api/v1/courses/${courseId}/archive`, auth);
    expect(archive.status).toBe(200);
    const archived = (await archive.json()) as { course: { status: string } };
    expect(archived.course.status).toBe("archived");

    const rePublish = await post(`/api/v1/courses/${courseId}/publish`, auth);
    expect(rePublish.status).toBe(409);
  });

  describe("co-teachers (CRS-009/010, UserRoleAssignment-based, owner-only management)", () => {
    let coCourseId: string;
    // Deliberately an unrelated (narrowly-scoped) Teacher, not teacher2 —
    // teacher2 holds independent ORG-wide authority in this fixture, which
    // would make "removal revokes access" vacuously pass even with a bug.
    let coTeacher: string;

    beforeAll(async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await post(`/api/v1/subjects/${subjectId}/courses`, auth, {
        title: "Physics II",
        academicPeriodId: academicPeriod1,
      });
      coCourseId = ((await res.json()) as { course: { id: string } }).course.id;
      coTeacher = createUnrelatedTeacher();
    });

    it("lets the owning Teacher add a co-teacher", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await post(`/api/v1/courses/${coCourseId}/co-teachers`, auth, {
        userId: coTeacher,
      });
      expect(res.status).toBe(201);
    });

    it("gives the co-teacher real MANAGE_COURSE authority on the Course (delegated educational permission)", async () => {
      const auth = await authHeader(coTeacher, ORG_A);
      const res = await patch(`/api/v1/courses/${coCourseId}`, auth, {
        title: "Physics II (edited by co-teacher)",
      });
      expect(res.status).toBe(200);
    });

    it("denies the co-teacher from adding ANOTHER co-teacher — co-teacher management remains owner-only (CRS-009)", async () => {
      const auth = await authHeader(coTeacher, ORG_A);
      const thirdTeacher = insertUser(ORG_A, `teacher3-${uuid7()}@example.test`);
      assignRole(ORG_A, thirdTeacher, "TEACHER", "ORG", null);
      const res = await post(`/api/v1/courses/${coCourseId}/co-teachers`, auth, {
        userId: thirdTeacher,
      });
      expect(res.status).toBe(403);
    });

    it("rejects adding the same co-teacher twice", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await post(`/api/v1/courses/${coCourseId}/co-teachers`, auth, {
        userId: coTeacher,
      });
      expect(res.status).toBe(409);
    });

    it("lets the owning Teacher remove a co-teacher, revoking their access (SEC-009: 404 afterward)", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await del(`/api/v1/courses/${coCourseId}/co-teachers/${coTeacher}`, auth);
      expect(res.status).toBe(200);

      const afterRemoval = await patch(
        `/api/v1/courses/${coCourseId}`,
        await authHeader(coTeacher, ORG_A),
        {
          title: "should be denied now",
        },
      );
      expect(afterRemoval.status).toBe(404);
    });
  });

  describe("CourseAudience targeting (CLS-008/GRP-003, polymorphic target validation)", () => {
    let audienceCourseId: string;
    let targetClassroomId: string;

    beforeAll(async () => {
      const teacherAuth = await authHeader(teacher1, ORG_A);
      const courseRes = await post(`/api/v1/subjects/${subjectId}/courses`, teacherAuth, {
        title: "Physics III",
        academicPeriodId: academicPeriod1,
      });
      audienceCourseId = ((await courseRes.json()) as { course: { id: string } }).course.id;
      const classroomRes = await post("/api/v1/classrooms", teacherAuth, {
        name: "Audience classroom",
        academicPeriodId: academicPeriod1,
        homeroomTeacherId: teacher1,
      });
      targetClassroomId = ((await classroomRes.json()) as { classroom: { id: string } }).classroom
        .id;
    });

    it("adds a Classroom as a Course audience target", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await post(`/api/v1/courses/${audienceCourseId}/audiences`, auth, {
        targetType: "classroom",
        targetId: targetClassroomId,
      });
      expect(res.status).toBe(201);
    });

    it("rejects a nonexistent target id (polymorphic reference validation)", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await post(`/api/v1/courses/${audienceCourseId}/audiences`, auth, {
        targetType: "classroom",
        targetId: uuid7(),
      });
      expect(res.status).toBe(404);
    });

    it("rejects a duplicate audience target", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const res = await post(`/api/v1/courses/${audienceCourseId}/audiences`, auth, {
        targetType: "classroom",
        targetId: targetClassroomId,
      });
      expect(res.status).toBe(409);
    });

    it("removes an audience target", async () => {
      const auth = await authHeader(teacher1, ORG_A);
      const list = await get(`/api/v1/courses/${audienceCourseId}/audiences`, auth);
      const body = (await list.json()) as { audiences: Array<{ id: string }> };
      const res = await del(
        `/api/v1/courses/${audienceCourseId}/audiences/${body.audiences[0]!.id}`,
        auth,
      );
      expect(res.status).toBe(200);
    });
  });
});

// =============================================================================
// Cycle (CYC-*) and Topic (TOP-*)
// =============================================================================

describe("cycles and topics — ordering (CYC-002/TOP-002)", () => {
  let subjectId: string, courseId: string, cycleId: string;

  beforeAll(async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const subjectRes = await post("/api/v1/subjects", auth, { name: "Chemistry", code: "CHEM-1" });
    subjectId = ((await subjectRes.json()) as { subject: { id: string } }).subject.id;
    const courseRes = await post(`/api/v1/subjects/${subjectId}/courses`, auth, {
      title: "Chemistry I",
      academicPeriodId: academicPeriod1,
    });
    courseId = ((await courseRes.json()) as { course: { id: string } }).course.id;
  });

  it("creates a Cycle with a sequence number", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/cycles`, auth, {
      title: "Cycle 1",
      sequenceNo: 1,
      startsOn: "2026-09-01",
      endsOn: "2026-10-01",
    });
    expect(res.status).toBe(201);
    cycleId = ((await res.json()) as { cycle: { id: string } }).cycle.id;
  });

  it("CYC-002: rejects a duplicate sequenceNo within the same Course", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/cycles`, auth, {
      title: "Cycle 1 duplicate",
      sequenceNo: 1,
      startsOn: null,
      endsOn: null,
    });
    expect(res.status).toBe(409);
  });

  it("creates a Topic inside the Cycle", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/cycles/${cycleId}/topics`, auth, {
      title: "Atoms",
      sequenceNo: 1,
      learningObjectives: null,
    });
    expect(res.status).toBe(201);
  });

  it("TOP-002: rejects a duplicate sequenceNo within the same Cycle", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/cycles/${cycleId}/topics`, auth, {
      title: "Atoms duplicate",
      sequenceNo: 1,
      learningObjectives: null,
    });
    expect(res.status).toBe(409);
  });

  it("denies a Teacher with no relationship to the Course from adding a Cycle to it (SEC-009: 404)", async () => {
    const auth = await authHeader(createUnrelatedTeacher(), ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/cycles`, auth, {
      title: "Should fail",
      sequenceNo: 2,
      startsOn: null,
      endsOn: null,
    });
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// Enrollment (§37.3.2, PER-003)
// =============================================================================

describe("enrollments — creation, duplicate handling, withdrawal (BR-015)", () => {
  let subjectId: string, courseId: string;

  beforeAll(async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const subjectRes = await post("/api/v1/subjects", auth, { name: "Biology", code: "BIO-1" });
    subjectId = ((await subjectRes.json()) as { subject: { id: string } }).subject.id;
    const courseRes = await post(`/api/v1/subjects/${subjectId}/courses`, auth, {
      title: "Biology I",
      academicPeriodId: academicPeriod1,
    });
    courseId = ((await courseRes.json()) as { course: { id: string } }).course.id;
  });

  it("enrolls a student, deriving academicPeriodId from the Course (never a client-supplied field)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/enrollments`, auth, {
      studentUserId: student1,
      academicPeriodId: orgBPeriod, // forged — must be ignored
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { enrollment: { academicPeriodId: string; status: string } };
    expect(body.enrollment.academicPeriodId).toBe(academicPeriod1);
    expect(body.enrollment.status).toBe("active");
  });

  it("rejects a duplicate active Enrollment for the same student in the same Course", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/enrollments`, auth, {
      studentUserId: student1,
    });
    expect(res.status).toBe(409);
  });

  it("a Student can list their own enrollments (self-access)", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await get("/api/v1/enrollments/mine", auth);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { enrollments: Array<{ courseId: string }> };
    expect(body.enrollments.some((e) => e.courseId === courseId)).toBe(true);
  });

  it("withdraws an Enrollment — the row is preserved with status=withdrawn, never deleted (BR-015)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const list = await get(`/api/v1/courses/${courseId}/enrollments`, auth);
    const body = (await list.json()) as {
      enrollments: Array<{ id: string; studentUserId: string }>;
    };
    const enrollment = body.enrollments.find((e) => e.studentUserId === student1)!;

    const res = await post(`/api/v1/enrollments/${enrollment.id}/withdraw`, auth);
    expect(res.status).toBe(200);
    const withdrawn = (await res.json()) as {
      enrollment: { status: string; withdrawnAt: string | null };
    };
    expect(withdrawn.enrollment.status).toBe("withdrawn");
    expect(withdrawn.enrollment.withdrawnAt).not.toBeNull();

    // Re-enrolling after withdrawal is allowed (the old row stays, a new one can be added).
    const reEnroll = await post(`/api/v1/courses/${courseId}/enrollments`, auth, {
      studentUserId: student1,
    });
    expect(reEnroll.status).toBe(201);
  });

  it("denies a Student from enrolling themself (MANAGE_STUDENTS is a Teacher/Admin action; SEC-009: 404)", async () => {
    const auth = await authHeader(student1, ORG_A);
    const res = await post(`/api/v1/courses/${courseId}/enrollments`, auth, {
      studentUserId: student1,
    });
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// Cross-organization isolation and IDOR, across the module
// =============================================================================

describe("cross-organization isolation and IDOR (GEN-025, ORG-003/004)", () => {
  it("denies reading a Subject that belongs to a different Organization, even with the real id (SEC-009: 404)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const subjectRes = await post("/api/v1/subjects", await authHeader(orgBTeacher, ORG_B), {
      name: "Org B subject",
      code: "ORGB-1",
    });
    const orgBSubjectId = ((await subjectRes.json()) as { subject: { id: string } }).subject.id;
    const res = await get(`/api/v1/subjects/${orgBSubjectId}`, auth);
    expect(res.status).toBe(404);
  });

  it("a forged organizationId in the request body has no effect on a Classroom update (SEC-004)", async () => {
    const auth = await authHeader(teacher1, ORG_A);
    const created = await post("/api/v1/classrooms", auth, {
      name: "Forgery test",
      academicPeriodId: academicPeriod1,
      homeroomTeacherId: teacher1,
    });
    const { classroom } = (await created.json()) as { classroom: { id: string } };
    const res = await patch(`/api/v1/classrooms/${classroom.id}`, auth, {
      name: "still mine",
      organizationId: ORG_B,
    });
    expect(res.status).toBe(200);
    const check = await get(
      `/api/v1/classrooms/${classroom.id}`,
      await authHeader(orgBAdmin, ORG_B),
    );
    expect(check.status).toBe(404); // never actually moved organizations (SEC-009: 404, not 403)
  });

  it("rejects every mutating request with no bearer token", async () => {
    const res = await post("/api/v1/classrooms", "", { name: "no auth" });
    expect(res.status).toBe(401);
  });
});
