/**
 * Seed data — dialect-agnostic. Plain data, no Drizzle imports, so the
 * same values are inserted identically by both the SQLite and Postgres
 * seed scripts (src/scripts/seed-sqlite.ts, seed-postgres.ts).
 *
 * IDs below are fixed, pre-generated UUIDv7 values (not random per run) so
 * seeding is deterministic and idempotent — re-running it against an
 * already-seeded database is a no-op (upsert on primary key), never a
 * duplicate-row error.
 */

const now = () => new Date();

/**
 * The five system roles (GEN-006, SRS §6.1) — immutable, organization_id
 * null, created by migration/seed, never by end users (Table 37.2). This
 * is not business data or a product decision; it is a fixed fact the SRS
 * itself states, safe to seed in every environment including production.
 */
export const SYSTEM_ROLES = [
  { id: "01a09d31-93d3-7c4d-8781-35e9b041f21b", key: "STUDENT", name: "Student" },
  { id: "01a09d31-93d6-7ca7-87c3-4ad893e28a76", key: "TEACHER", name: "Teacher" },
  { id: "01a09d31-93d6-735d-bd7b-87264f3348ff", key: "ASSISTANT", name: "Assistant" },
  { id: "01a09d31-93d6-7a23-b4f9-8581dba0eec7", key: "PARENT", name: "Parent" },
  { id: "01a09d31-93d6-79b3-80d8-16e7ce7e344c", key: "ADMIN", name: "Admin" },
] as const;

export function systemRoleRows() {
  const createdAt = now();
  return SYSTEM_ROLES.map((role) => ({
    id: role.id,
    organizationId: null,
    key: role.key,
    name: role.name,
    isSystem: true,
    createdAt,
    updatedAt: createdAt,
  }));
}

/**
 * Synthetic development/test sample data — DEV AND TEST ONLY. Every name,
 * email and identifier here is fictional (no real person, no real
 * institution); emails use the reserved `example.test` domain (RFC 2606)
 * specifically so nothing here can ever resolve to a real inbox. This is
 * illustrative fixture data for exercising the schema, not a template for
 * production content and not a source of implied product requirements.
 */
export function devSampleData() {
  const createdAt = now();

  const organization = {
    id: "01a09d31-93d6-748b-b8ab-1b3377ed34ae",
    name: "Example Academy (dev sample)",
    slug: "example-academy-dev",
    timezone: "Africa/Cairo",
    locale: "en",
    status: "active",
    planId: null,
    closedAt: null,
    closureReason: null,
    createdAt,
    updatedAt: createdAt,
  };

  const teacher = {
    id: "01a09d31-93d6-7b22-a458-ac820330637a",
    organizationId: organization.id,
    email: "teacher@example.test",
    phone: null,
    passwordHash: null,
    status: "active",
    locale: "en",
    timezone: organization.timezone,
    mfaEnabled: false,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };

  const student = {
    id: "01a09d31-93d7-71a4-a415-0a9a663f044a",
    organizationId: organization.id,
    email: "student@example.test",
    phone: null,
    passwordHash: null,
    status: "active",
    locale: "en",
    timezone: organization.timezone,
    mfaEnabled: false,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };

  const academicPeriod = {
    id: "01a09d31-93d7-74ea-8d13-db6cf3486869",
    organizationId: organization.id,
    name: "2026-2027 (dev sample)",
    startsOn: "2026-09-01",
    endsOn: "2027-06-30",
    status: "active",
    createdBy: teacher.id,
    createdAt,
    updatedAt: createdAt,
  };

  const classroom = {
    id: "01a09d31-93d7-7070-9693-84a17fcb4841",
    organizationId: organization.id,
    name: "Grade 10 (dev sample)",
    gradeLevel: "10",
    academicPeriodId: academicPeriod.id,
    homeroomTeacherId: teacher.id,
    status: "active",
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };

  const group = {
    id: "01a09d31-93d7-72d4-81e6-074e58bec708",
    organizationId: organization.id,
    classroomId: classroom.id,
    name: "Group A (dev sample)",
    purpose: null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };

  const membership = {
    id: "01a09d31-93d7-7d10-8da6-a3706a683430",
    organizationId: organization.id,
    userId: student.id,
    containerType: "classroom",
    containerId: classroom.id,
    roleInContainer: "STUDENT",
    joinedAt: createdAt,
    leftAt: null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  const subject = {
    id: "01a09d31-93d7-7301-89fc-8f243e1b47cd",
    organizationId: organization.id,
    name: "Mathematics (dev sample)",
    code: "MATH",
    description: null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };

  const course = {
    id: "01a09d31-93d7-7e86-9d30-7f1ce276212f",
    organizationId: organization.id,
    subjectId: subject.id,
    title: "Algebra I (dev sample)",
    description: null,
    ownerTeacherId: teacher.id,
    academicPeriodId: academicPeriod.id,
    visibility: "organization",
    status: "draft",
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };

  return {
    organization,
    users: [teacher, student],
    academicPeriod,
    classroom,
    group,
    membership,
    subject,
    course,
  };
}
