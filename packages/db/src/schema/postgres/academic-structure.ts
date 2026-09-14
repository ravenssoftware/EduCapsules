import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./identity.js";

/**
 * Academic structure entities — Postgres mirror of
 * ../sqlite/academic-structure.ts. See that file's header comment for the
 * SRS references and the PROVISIONAL-requirements note (both apply
 * identically here); see docs/database/schema-overview.md for details.
 */

export const academicPeriods = pgTable(
  "academic_periods",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    status: text("status").notNull().default("planned"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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

export const classrooms = pgTable(
  "classrooms",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    gradeLevel: text("grade_level"),
    academicPeriodId: text("academic_period_id").notNull(),
    homeroomTeacherId: text("homeroom_teacher_id"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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

export const groups = pgTable(
  "groups",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    classroomId: text("classroom_id").notNull(),
    name: text("name").notNull(),
    purpose: text("purpose"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    containerType: text("container_type").notNull(),
    containerId: text("container_id").notNull(),
    roleInContainer: text("role_in_container"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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

export const subjects = pgTable(
  "subjects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by"),
  },
  (t) => [
    unique("subjects_org_id_unique").on(t.organizationId, t.id),
    unique("subjects_org_code_unique").on(t.organizationId, t.code),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
      name: "subjects_organization_fk",
    }),
  ],
);

export const courses = pgTable(
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
    status: text("status").notNull().default("draft"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    check("courses_status_check", sql`${t.status} IN ('draft', 'published', 'archived')`),
  ],
);

export const courseAudiences = pgTable(
  "course_audiences",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    courseId: text("course_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
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

export const cycles = pgTable(
  "cycles",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    sequenceNo: integer("sequence_no").notNull(),
    startsOn: date("starts_on"),
    endsOn: date("ends_on"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("cycles_org_id_unique").on(t.organizationId, t.id),
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

export const topics = pgTable(
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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

export const enrollments = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    studentUserId: text("student_user_id").notNull(),
    courseId: text("course_id").notNull(),
    academicPeriodId: text("academic_period_id").notNull(),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    source: text("source"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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
