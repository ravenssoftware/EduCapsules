import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { organizations, users } from "./identity.js";

/**
 * Academic structure entities — SRS §37.3.2 (Table 37.3), §8.1 (Academic
 * Periods, PER prefix), §9 (Classroom and Group, CLS/GRP prefixes), §10
 * (Subject, Course, Cycle, Topic; SUB/CRS/CYC/TOP prefixes). See
 * docs/database/schema-overview.md for the full entity-by-entity rationale.
 *
 * CLS-002/CLS-003/GRP-002 are PROVISIONAL (SRS Table 9.1a, D-16) — the
 * schema below is deliberately permissive where they are provisional (e.g.
 * memberships does not structurally forbid a student from belonging to
 * several classrooms) rather than encoding one specific unconfirmed
 * interpretation as a hard constraint. See docs/database/schema-overview.md
 * "Provisional requirements" for the full list of what is and isn't enforced
 * here pending Project Owner confirmation.
 */

export const academicPeriods = sqliteTable(
  "academic_periods",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    startsOn: text("starts_on").notNull(), // ISO date (YYYY-MM-DD), portable across engines
    endsOn: text("ends_on").notNull(),
    status: text("status").notNull().default("planned"), // planned | active | closed (PER-001)
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    unique("academic_periods_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "academic_periods_organization_fk",
    }),
    index("academic_periods_org_idx").on(t.organizationId),
  ],
);

export const classrooms = sqliteTable(
  "classrooms",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    gradeLevel: text("grade_level"),
    academicPeriodId: text("academic_period_id").notNull(),
    homeroomTeacherId: text("homeroom_teacher_id"),
    status: text("status").notNull().default("active"),
    // DB-017: no FK — see schema-overview.md's DB-017 note.
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    // DB-003: soft delete for user-visible academic records.
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    deletedBy: text("deleted_by"),
  },
  (t) => [
    unique("classrooms_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "classrooms_organization_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.academicPeriodId],
      foreignColumns: [academicPeriods.organizationId, academicPeriods.id],
      name: "classrooms_academic_period_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.homeroomTeacherId],
      foreignColumns: [users.organizationId, users.id],
      name: "classrooms_homeroom_teacher_fk",
    }),
    index("classrooms_org_period_idx").on(t.organizationId, t.academicPeriodId),
  ],
);

export const groups = sqliteTable(
  "groups",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    // GEN-008 / GRP-001: a Group belongs to exactly one Classroom — mandatory, never nullable.
    classroomId: text("classroom_id").notNull(),
    name: text("name").notNull(),
    purpose: text("purpose"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    deletedBy: text("deleted_by"),
  },
  (t) => [
    unique("groups_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "groups_organization_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.classroomId],
      foreignColumns: [classrooms.organizationId, classrooms.id],
      name: "groups_classroom_fk",
    }),
    index("groups_org_classroom_idx").on(t.organizationId, t.classroomId),
  ],
);

export const memberships = sqliteTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    /** classroom | group — polymorphic container; no FK possible generically (app-enforced). */
    containerType: text("container_type").notNull(),
    containerId: text("container_id").notNull(),
    roleInContainer: text("role_in_container"),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
    /**
     * CLS-009: never deleted. Moving a student ends this membership (sets
     * leftAt) and creates a new row — the domain layer's job (Phase 6+), not
     * something this schema can enforce by itself, so it is documented here
     * instead of silently assumed.
     */
    leftAt: integer("left_at", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [users.organizationId, users.id],
      name: "memberships_user_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "memberships_organization_fk",
    }),
    index("memberships_container_idx").on(t.organizationId, t.containerType, t.containerId),
    index("memberships_user_idx").on(t.organizationId, t.userId),
    check("memberships_container_type_check", sql`${t.containerType} IN ('classroom', 'group')`),
  ],
);

export const subjects = sqliteTable(
  "subjects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    deletedBy: text("deleted_by"),
  },
  (t) => [
    unique("subjects_org_id_unique").on(t.organizationId, t.id),
    // Not an explicit SRS requirement — a reasonable data-layer invariant for
    // a short subject code, documented in docs/database/schema-overview.md
    // rather than attributed to a requirement ID it doesn't come from.
    unique("subjects_org_code_unique").on(t.organizationId, t.code),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "subjects_organization_fk",
    }),
  ],
);

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    subjectId: text("subject_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    ownerTeacherId: text("owner_teacher_id").notNull(),
    academicPeriodId: text("academic_period_id").notNull(),
    visibility: text("visibility").notNull().default("organization"),
    // CRS-002: draft | published | archived.
    status: text("status").notNull().default("draft"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    deletedBy: text("deleted_by"),
  },
  (t) => [
    unique("courses_org_id_unique").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "courses_organization_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.subjectId],
      foreignColumns: [subjects.organizationId, subjects.id],
      name: "courses_subject_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.academicPeriodId],
      foreignColumns: [academicPeriods.organizationId, academicPeriods.id],
      name: "courses_academic_period_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.ownerTeacherId],
      foreignColumns: [users.organizationId, users.id],
      name: "courses_owner_teacher_fk",
    }),
    index("courses_org_subject_idx").on(t.organizationId, t.subjectId),
    index("courses_org_period_idx").on(t.organizationId, t.academicPeriodId),
    // CRS-002: draft, published and archived — no other states.
    check("courses_status_check", sql`${t.status} IN ('draft', 'published', 'archived')`),
  ],
);

export const courseAudiences = sqliteTable(
  "course_audiences",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    courseId: text("course_id").notNull(),
    /** classroom | group — polymorphic target; no FK possible generically (app-enforced). */
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.courseId],
      foreignColumns: [courses.organizationId, courses.id],
      name: "course_audiences_course_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "course_audiences_organization_fk",
    }),
    unique("course_audiences_unique").on(t.courseId, t.targetType, t.targetId),
    index("course_audiences_target_idx").on(t.organizationId, t.targetType, t.targetId),
    check("course_audiences_target_type_check", sql`${t.targetType} IN ('classroom', 'group')`),
  ],
);

export const cycles = sqliteTable(
  "cycles",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    sequenceNo: integer("sequence_no").notNull(),
    startsOn: text("starts_on"),
    endsOn: text("ends_on"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    unique("cycles_org_id_unique").on(t.organizationId, t.id),
    // CYC-002: sequence_no is unique per course (mirrors Table 37.3's own invariant text).
    unique("cycles_course_sequence_unique").on(t.courseId, t.sequenceNo),
    foreignKey({
      columns: [t.organizationId, t.courseId],
      foreignColumns: [courses.organizationId, courses.id],
      name: "cycles_course_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "cycles_organization_fk",
    }),
    index("cycles_org_course_idx").on(t.organizationId, t.courseId),
  ],
);

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    cycleId: text("cycle_id").notNull(),
    title: text("title").notNull(),
    sequenceNo: integer("sequence_no").notNull(),
    learningObjectives: text("learning_objectives"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    unique("topics_org_id_unique").on(t.organizationId, t.id),
    unique("topics_cycle_sequence_unique").on(t.cycleId, t.sequenceNo),
    foreignKey({
      columns: [t.organizationId, t.cycleId],
      foreignColumns: [cycles.organizationId, cycles.id],
      name: "topics_cycle_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "topics_organization_fk",
    }),
    index("topics_org_cycle_idx").on(t.organizationId, t.cycleId),
  ],
);

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    studentUserId: text("student_user_id").notNull(),
    courseId: text("course_id").notNull(),
    academicPeriodId: text("academic_period_id").notNull(),
    enrolledAt: integer("enrolled_at", { mode: "timestamp_ms" }).notNull(),
    // Distinct from Membership: withdrawal preserves the row and all grades earned (BR-015).
    withdrawnAt: integer("withdrawn_at", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("active"),
    source: text("source"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.studentUserId],
      foreignColumns: [users.organizationId, users.id],
      name: "enrollments_student_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.courseId],
      foreignColumns: [courses.organizationId, courses.id],
      name: "enrollments_course_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.academicPeriodId],
      foreignColumns: [academicPeriods.organizationId, academicPeriods.id],
      name: "enrollments_academic_period_fk",
    }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "enrollments_organization_fk",
    }),
    index("enrollments_org_course_idx").on(t.organizationId, t.courseId),
    index("enrollments_org_student_idx").on(t.organizationId, t.studentUserId),
  ],
);
