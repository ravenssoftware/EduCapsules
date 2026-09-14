import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { uuid7 } from "@educapsules/shared";

/**
 * Dialect-agnostic database behavior scenarios, run once per real engine
 * (see ./sqlite/db-behavior.test.ts and ./postgres/db-behavior.test.ts).
 * These verify actual schema behavior against a migrated database — not
 * merely that the migration command exits successfully.
 *
 * Loosely typed (`any`) throughout: the SQLite and Postgres Drizzle table
 * objects are structurally compatible (enforced by ./parity.test.ts) but
 * have genuinely different TS types, and this file's job is to exercise
 * both with one set of assertions rather than duplicate them per dialect.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DbBehaviorContext {
  dialectName: "sqlite" | "postgres";
  db: any;
  schema: any;
  /** Executes raw SQL text against the real driver, bypassing Drizzle's typed insert builder. */
  execRaw: (sqlText: string) => Promise<void>;
}

function nowLiteral(dialectName: DbBehaviorContext["dialectName"]): string {
  return dialectName === "sqlite" ? String(Date.now()) : "now()";
}

async function insertOrg(db: any, schema: any, overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const org = {
    id: uuid7(),
    name: "Test Org",
    slug: `test-org-${uuid7()}`,
    timezone: "UTC",
    locale: "en",
    status: "active",
    planId: null,
    closedAt: null,
    closureReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  await db.insert(schema.organizations).values(org);
  return org;
}

async function insertUser(
  db: any,
  schema: any,
  organizationId: string,
  overrides: Record<string, unknown> = {},
) {
  const now = new Date();
  const user = {
    id: uuid7(),
    organizationId,
    email: `user-${uuid7()}@example.test`,
    phone: null,
    passwordHash: null,
    status: "active",
    locale: "en",
    timezone: "UTC",
    mfaEnabled: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
  await db.insert(schema.users).values(user);
  return user;
}

async function insertPeriod(db: any, schema: any, organizationId: string) {
  const now = new Date();
  const period = {
    id: uuid7(),
    organizationId,
    name: `Period ${uuid7()}`,
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
    status: "active",
    createdBy: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(schema.academicPeriods).values(period);
  return period;
}

async function insertSubject(db: any, schema: any, organizationId: string) {
  const now = new Date();
  const subject = {
    id: uuid7(),
    organizationId,
    name: `Subject ${uuid7()}`,
    code: null,
    description: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.insert(schema.subjects).values(subject);
  return subject;
}

async function insertCourse(
  db: any,
  schema: any,
  organizationId: string,
  subjectId: string,
  ownerTeacherId: string,
  academicPeriodId: string,
) {
  const now = new Date();
  const course = {
    id: uuid7(),
    organizationId,
    subjectId,
    title: `Course ${uuid7()}`,
    description: null,
    ownerTeacherId,
    academicPeriodId,
    visibility: "organization",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.insert(schema.courses).values(course);
  return course;
}

export function runDbBehaviorScenarios(ctx: DbBehaviorContext) {
  const { dialectName, db, schema, execRaw } = ctx;

  describe(`database behavior — ${dialectName}`, () => {
    it("applies a CHECK constraint on organizations.status (ORG-009)", async () => {
      await expect(insertOrg(db, schema, { status: "not_a_real_status" })).rejects.toThrow();
    });

    it("enforces organizations.slug uniqueness", async () => {
      const org = await insertOrg(db, schema);
      await expect(insertOrg(db, schema, { slug: org.slug })).rejects.toThrow();
    });

    it("scopes users.email uniqueness to the organization, not globally (DB-012)", async () => {
      const orgA = await insertOrg(db, schema);
      const orgB = await insertOrg(db, schema);
      const email = `shared-${uuid7()}@example.test`;
      await insertUser(db, schema, orgA.id, { email });
      await expect(insertUser(db, schema, orgB.id, { email })).resolves.not.toThrow();
      await expect(insertUser(db, schema, orgA.id, { email })).rejects.toThrow();
    });

    it("rejects a user referencing a non-existent organization (FK integrity)", async () => {
      await expect(insertUser(db, schema, uuid7())).rejects.toThrow();
    });

    it("blocks a cross-tenant composite foreign key (DB-011 tenant isolation)", async () => {
      const orgA = await insertOrg(db, schema);
      const orgB = await insertOrg(db, schema);
      const period = await insertPeriod(db, schema, orgA.id);
      const now = new Date();

      await expect(
        db.insert(schema.classrooms).values({
          id: uuid7(),
          organizationId: orgB.id,
          name: "Cross-tenant classroom",
          gradeLevel: null,
          academicPeriodId: period.id,
          homeroomTeacherId: null,
          status: "active",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }),
      ).rejects.toThrow();

      await expect(
        db.insert(schema.classrooms).values({
          id: uuid7(),
          organizationId: orgA.id,
          name: "Same-tenant classroom",
          gradeLevel: null,
          academicPeriodId: period.id,
          homeroomTeacherId: null,
          status: "active",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }),
      ).resolves.not.toThrow();
    });

    it("requires groups.classroom_id at the database layer (GRP-001)", async () => {
      const org = await insertOrg(db, schema);
      await expect(
        execRaw(
          `INSERT INTO groups (id, organization_id, classroom_id, name, purpose, status, created_at, updated_at, deleted_at)
           VALUES ('${uuid7()}', '${org.id}', NULL, 'No classroom', NULL, 'active', ${nowLiteral(dialectName)}, ${nowLiteral(dialectName)}, NULL)`,
        ),
      ).rejects.toThrow();
    });

    it("applies a CHECK constraint on memberships.container_type", async () => {
      const org = await insertOrg(db, schema);
      const user = await insertUser(db, schema, org.id);
      const now = new Date();
      await expect(
        db.insert(schema.memberships).values({
          id: uuid7(),
          organizationId: org.id,
          userId: user.id,
          containerType: "not_a_real_container",
          containerId: uuid7(),
          roleInContainer: null,
          joinedAt: now,
          leftAt: null,
          status: "active",
          createdAt: now,
          updatedAt: now,
        }),
      ).rejects.toThrow();
    });

    it("applies a CHECK constraint on courses.status (CRS-002)", async () => {
      const org = await insertOrg(db, schema);
      const teacher = await insertUser(db, schema, org.id);
      const subject = await insertSubject(db, schema, org.id);
      const period = await insertPeriod(db, schema, org.id);
      const course = await insertCourse(db, schema, org.id, subject.id, teacher.id, period.id);
      expect(course.status).toBe("draft"); // control: a valid status inserts cleanly
      const now = new Date();
      await expect(
        db.insert(schema.courses).values({
          id: uuid7(),
          organizationId: org.id,
          subjectId: subject.id,
          title: "Bad status course",
          description: null,
          ownerTeacherId: teacher.id,
          academicPeriodId: period.id,
          visibility: "organization",
          status: "not_a_real_status",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }),
      ).rejects.toThrow();
    });

    it("enforces cycle sequence-number uniqueness within a course (CYC-002)", async () => {
      const org = await insertOrg(db, schema);
      const teacher = await insertUser(db, schema, org.id);
      const subject = await insertSubject(db, schema, org.id);
      const period = await insertPeriod(db, schema, org.id);
      const course = await insertCourse(db, schema, org.id, subject.id, teacher.id, period.id);
      const now = new Date();
      await db.insert(schema.cycles).values({
        id: uuid7(),
        organizationId: org.id,
        courseId: course.id,
        title: "Cycle 1",
        sequenceNo: 1,
        startsOn: null,
        endsOn: null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      await expect(
        db.insert(schema.cycles).values({
          id: uuid7(),
          organizationId: org.id,
          courseId: course.id,
          title: "Duplicate sequence",
          sequenceNo: 1,
          startsOn: null,
          endsOn: null,
          status: "active",
          createdAt: now,
          updatedAt: now,
        }),
      ).rejects.toThrow();
    });

    it("marks a record soft-deleted without removing it, and blocks hard-deleting a referenced parent", async () => {
      const org = await insertOrg(db, schema);
      const period = await insertPeriod(db, schema, org.id);
      const now = new Date();
      const classroom = {
        id: uuid7(),
        organizationId: org.id,
        name: "Soft-delete classroom",
        gradeLevel: null,
        academicPeriodId: period.id,
        homeroomTeacherId: null,
        status: "active",
        createdAt: now,
        updatedAt: now,
        deletedAt: null as Date | null,
      };
      await db.insert(schema.classrooms).values(classroom);

      await db
        .update(schema.classrooms)
        .set({ deletedAt: new Date() })
        .where(eq(schema.classrooms.id, classroom.id));

      const rows = await db
        .select()
        .from(schema.classrooms)
        .where(eq(schema.classrooms.id, classroom.id));
      expect(rows).toHaveLength(1);
      expect(rows[0].deletedAt).not.toBeNull();

      await db.insert(schema.groups).values({
        id: uuid7(),
        organizationId: org.id,
        classroomId: classroom.id,
        name: "Group under soft-deleted classroom",
        purpose: null,
        status: "active",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      await expect(
        db.delete(schema.classrooms).where(eq(schema.classrooms.id, classroom.id)),
      ).rejects.toThrow();
    });

    it("is idempotent when the same role seed row is inserted twice (deterministic seeding)", async () => {
      const now = new Date();
      const role = {
        id: uuid7(),
        organizationId: null,
        key: `TEST_ROLE_${uuid7()}`,
        name: "Test role",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(schema.roles).values(role).onConflictDoNothing();
      await db.insert(schema.roles).values(role).onConflictDoNothing();
      const rows = await db.select().from(schema.roles).where(eq(schema.roles.id, role.id));
      expect(rows).toHaveLength(1);
    });

    it("requires audit_log.organization_id at the database layer (DB-004 scoping)", async () => {
      await expect(
        execRaw(
          `INSERT INTO audit_log (id, organization_id, actor_user_id, actor_role, action, target_type, target_id, before_ref, after_ref, ip_hash, login_session_id, occurred_at, reason)
           VALUES ('${uuid7()}', NULL, NULL, NULL, 'test.action', 'organization', '${uuid7()}', NULL, NULL, NULL, NULL, ${nowLiteral(dialectName)}, NULL)`,
        ),
      ).rejects.toThrow();
    });

    it("rejects an audit_log row referencing a non-existent organization (FK integrity)", async () => {
      const now = new Date();
      await expect(
        db.insert(schema.auditLog).values({
          id: uuid7(),
          organizationId: uuid7(),
          actorUserId: null,
          actorRole: null,
          action: "test.action",
          targetType: "organization",
          targetId: uuid7(),
          beforeRef: null,
          afterRef: null,
          ipHash: null,
          loginSessionId: null,
          occurredAt: now,
          reason: null,
        }),
      ).rejects.toThrow();
    });
  });
}

/**
 * insertOrg/insertUser are also used directly by each dialect's own
 * transaction-rollback test, since better-sqlite3's synchronous driver and
 * node-postgres's async driver need genuinely different transaction call
 * shapes (see db-behavior.test.ts in each dialect folder) and can't share
 * one callback style.
 */
export { insertOrg, insertUser, insertPeriod, insertSubject, insertCourse };
