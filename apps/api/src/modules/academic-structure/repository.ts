import { and, eq, isNull, ne } from "drizzle-orm";

/**
 * Persistence layer for the academic-structure module (SRS §8.1, §9, §10,
 * §37.3.2) — same duck-typed pattern as ../auth/repository.ts and
 * ../authz/repository.ts: one implementation serves both the SQLite and
 * PostgreSQL schema modules (parity enforced by
 * packages/db/src/schema/parity.test.ts).
 *
 * This is the real academic-structure module named by the Phase 0 roadmap
 * (docs/decisions/03-implementation-roadmap.md's Phase 6 row) — it replaces
 * the Phase 5 ../classrooms/repository.ts demonstrator entirely (see
 * ../../routes/classrooms.ts's own header comment, which named this module
 * as its replacement from the start).
 *
 * No business rule lives here (PER-003/PER-004 cardinality/overlap, Course
 * lifecycle transitions, polymorphic container/target reference validation,
 * co-teacher ownership restrictions) — those are ../service.ts's job, which
 * calls the plain CRUD methods below and, for every mutation, the
 * centralized ../authz/service.ts `authorize()` pipeline first.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AcademicPeriodRow {
  id: string;
  organizationId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassroomRow {
  id: string;
  organizationId: string;
  name: string;
  gradeLevel: string | null;
  academicPeriodId: string;
  homeroomTeacherId: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GroupRow {
  id: string;
  organizationId: string;
  classroomId: string;
  name: string;
  purpose: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MembershipRow {
  id: string;
  organizationId: string;
  userId: string;
  containerType: "classroom" | "group";
  containerId: string;
  roleInContainer: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectRow {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CourseRow {
  id: string;
  organizationId: string;
  subjectId: string;
  title: string;
  description: string | null;
  ownerTeacherId: string;
  academicPeriodId: string;
  visibility: string;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CourseAudienceRow {
  id: string;
  organizationId: string;
  courseId: string;
  targetType: "classroom" | "group";
  targetId: string;
  createdBy: string | null;
  createdAt: Date;
}

export interface CycleRow {
  id: string;
  organizationId: string;
  courseId: string;
  title: string;
  sequenceNo: number;
  startsOn: string | null;
  endsOn: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicRow {
  id: string;
  organizationId: string;
  cycleId: string;
  title: string;
  sequenceNo: number;
  learningObjectives: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentRow {
  id: string;
  organizationId: string;
  studentUserId: string;
  courseId: string;
  academicPeriodId: string;
  enrolledAt: Date;
  withdrawnAt: Date | null;
  status: string;
  source: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoTeacherRow {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string;
  status: string;
  grantedBy: string | null;
  validFrom: Date;
  validUntil: Date | null;
}

function toAcademicPeriodRow(r: any): AcademicPeriodRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    startsOn: r.startsOn,
    endsOn: r.endsOn,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toClassroomRow(r: any): ClassroomRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    gradeLevel: r.gradeLevel ?? null,
    academicPeriodId: r.academicPeriodId,
    homeroomTeacherId: r.homeroomTeacherId ?? null,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
  };
}

function toGroupRow(r: any): GroupRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    classroomId: r.classroomId,
    name: r.name,
    purpose: r.purpose ?? null,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
  };
}

function toMembershipRow(r: any): MembershipRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    userId: r.userId,
    containerType: r.containerType,
    containerId: r.containerId,
    roleInContainer: r.roleInContainer ?? null,
    joinedAt: r.joinedAt,
    leftAt: r.leftAt ?? null,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toSubjectRow(r: any): SubjectRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    code: r.code ?? null,
    description: r.description ?? null,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
  };
}

function toCourseRow(r: any): CourseRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    subjectId: r.subjectId,
    title: r.title,
    description: r.description ?? null,
    ownerTeacherId: r.ownerTeacherId,
    academicPeriodId: r.academicPeriodId,
    visibility: r.visibility,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
  };
}

function toCourseAudienceRow(r: any): CourseAudienceRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    courseId: r.courseId,
    targetType: r.targetType,
    targetId: r.targetId,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
  };
}

function toCycleRow(r: any): CycleRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    courseId: r.courseId,
    title: r.title,
    sequenceNo: r.sequenceNo,
    startsOn: r.startsOn ?? null,
    endsOn: r.endsOn ?? null,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toTopicRow(r: any): TopicRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    cycleId: r.cycleId,
    title: r.title,
    sequenceNo: r.sequenceNo,
    learningObjectives: r.learningObjectives ?? null,
    status: r.status,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toEnrollmentRow(r: any): EnrollmentRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    studentUserId: r.studentUserId,
    courseId: r.courseId,
    academicPeriodId: r.academicPeriodId,
    enrolledAt: r.enrolledAt,
    withdrawnAt: r.withdrawnAt ?? null,
    status: r.status,
    source: r.source ?? null,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toCoTeacherRow(r: any): CoTeacherRow {
  return {
    id: r.id,
    organizationId: r.organizationId,
    userId: r.userId,
    courseId: r.scopeId,
    status: r.status,
    grantedBy: r.grantedBy ?? null,
    validFrom: r.validFrom,
    validUntil: r.validUntil ?? null,
  };
}

export interface AcademicStructureRepository {
  /** SRS Table 40.2: an invalid client-supplied reference must not surface
   * as a raw DB FK violation (a generic 500) — the service layer uses this
   * to produce a clean validation error instead, for the two places a bare
   * user id crosses from client input into a composite-FK-checked column
   * (memberships.user_id, enrollments.student_user_id). */
  userExists(organizationId: string, userId: string): Promise<boolean>;

  // --- AcademicPeriod ---------------------------------------------------
  createAcademicPeriod(row: {
    id: string;
    organizationId: string;
    name: string;
    startsOn: string;
    endsOn: string;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<AcademicPeriodRow>;
  findAcademicPeriodById(organizationId: string, id: string): Promise<AcademicPeriodRow | null>;
  listAcademicPeriods(organizationId: string): Promise<AcademicPeriodRow[]>;
  updateAcademicPeriod(
    organizationId: string,
    id: string,
    patch: Partial<{ name: string; startsOn: string; endsOn: string; status: string }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Classroom ----------------------------------------------------------
  createClassroom(row: {
    id: string;
    organizationId: string;
    name: string;
    gradeLevel: string | null;
    academicPeriodId: string;
    homeroomTeacherId: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<ClassroomRow>;
  findClassroomById(organizationId: string, id: string): Promise<ClassroomRow | null>;
  listClassrooms(
    organizationId: string,
    filters?: { academicPeriodId?: string },
  ): Promise<ClassroomRow[]>;
  updateClassroom(
    organizationId: string,
    id: string,
    patch: Partial<{
      name: string;
      gradeLevel: string | null;
      homeroomTeacherId: string | null;
      status: string;
    }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Group ----------------------------------------------------------------
  createGroup(row: {
    id: string;
    organizationId: string;
    classroomId: string;
    name: string;
    purpose: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<GroupRow>;
  findGroupById(organizationId: string, id: string): Promise<GroupRow | null>;
  listGroupsByClassroom(organizationId: string, classroomId: string): Promise<GroupRow[]>;
  updateGroup(
    organizationId: string,
    id: string,
    patch: Partial<{ name: string; purpose: string | null; status: string }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Membership -------------------------------------------------------
  createMembership(row: {
    id: string;
    organizationId: string;
    userId: string;
    containerType: "classroom" | "group";
    containerId: string;
    roleInContainer: string | null;
    joinedAt: Date;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<MembershipRow>;
  findMembershipById(organizationId: string, id: string): Promise<MembershipRow | null>;
  listMembershipsForContainer(
    organizationId: string,
    containerType: "classroom" | "group",
    containerId: string,
  ): Promise<MembershipRow[]>;
  /** Every ACTIVE classroom-type membership for this user, joined with each classroom's academic_period_id — PER-003's read side. */
  listActiveClassroomMembershipsForUser(
    organizationId: string,
    userId: string,
  ): Promise<Array<MembershipRow & { academicPeriodId: string }>>;
  endMembership(id: string, leftAt: Date, updatedAt: Date): Promise<void>;

  // --- Subject ------------------------------------------------------------
  createSubject(row: {
    id: string;
    organizationId: string;
    name: string;
    code: string | null;
    description: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<SubjectRow>;
  findSubjectById(organizationId: string, id: string): Promise<SubjectRow | null>;
  findSubjectByCode(organizationId: string, code: string): Promise<SubjectRow | null>;
  listSubjects(organizationId: string): Promise<SubjectRow[]>;
  updateSubject(
    organizationId: string,
    id: string,
    patch: Partial<{
      name: string;
      code: string | null;
      description: string | null;
      status: string;
    }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Course -------------------------------------------------------------
  createCourse(row: {
    id: string;
    organizationId: string;
    subjectId: string;
    title: string;
    description: string | null;
    ownerTeacherId: string;
    academicPeriodId: string;
    visibility: string;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<CourseRow>;
  findCourseById(organizationId: string, id: string): Promise<CourseRow | null>;
  listCourses(
    organizationId: string,
    filters?: { subjectId?: string; status?: string },
  ): Promise<CourseRow[]>;
  updateCourse(
    organizationId: string,
    id: string,
    patch: Partial<{
      title: string;
      description: string | null;
      visibility: string;
      status: string;
    }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Course co-teachers (UserRoleAssignment, scopeType=COURSE) --------
  addCourseCoTeacher(row: {
    id: string;
    organizationId: string;
    userId: string;
    courseId: string;
    roleId: string;
    grantedBy: string | null;
    validFrom: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<CoTeacherRow>;
  findActiveCourseCoTeacher(
    organizationId: string,
    courseId: string,
    userId: string,
  ): Promise<CoTeacherRow | null>;
  listCourseCoTeachers(organizationId: string, courseId: string): Promise<CoTeacherRow[]>;
  revokeCourseCoTeacher(id: string, revokedAt: Date): Promise<void>;

  // --- CourseAudience -------------------------------------------------------
  addCourseAudience(row: {
    id: string;
    organizationId: string;
    courseId: string;
    targetType: "classroom" | "group";
    targetId: string;
    createdBy: string | null;
    createdAt: Date;
  }): Promise<CourseAudienceRow>;
  findCourseAudience(
    organizationId: string,
    courseId: string,
    targetType: "classroom" | "group",
    targetId: string,
  ): Promise<CourseAudienceRow | null>;
  listCourseAudiences(organizationId: string, courseId: string): Promise<CourseAudienceRow[]>;
  removeCourseAudience(organizationId: string, id: string): Promise<void>;

  // --- Cycle ----------------------------------------------------------------
  createCycle(row: {
    id: string;
    organizationId: string;
    courseId: string;
    title: string;
    sequenceNo: number;
    startsOn: string | null;
    endsOn: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<CycleRow>;
  findCycleById(organizationId: string, id: string): Promise<CycleRow | null>;
  listCyclesByCourse(organizationId: string, courseId: string): Promise<CycleRow[]>;
  findCycleBySequence(
    organizationId: string,
    courseId: string,
    sequenceNo: number,
  ): Promise<CycleRow | null>;
  updateCycle(
    organizationId: string,
    id: string,
    patch: Partial<{
      title: string;
      sequenceNo: number;
      startsOn: string | null;
      endsOn: string | null;
      status: string;
    }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Topic ------------------------------------------------------------
  createTopic(row: {
    id: string;
    organizationId: string;
    cycleId: string;
    title: string;
    sequenceNo: number;
    learningObjectives: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<TopicRow>;
  findTopicById(organizationId: string, id: string): Promise<TopicRow | null>;
  listTopicsByCycle(organizationId: string, cycleId: string): Promise<TopicRow[]>;
  findTopicBySequence(
    organizationId: string,
    cycleId: string,
    sequenceNo: number,
  ): Promise<TopicRow | null>;
  updateTopic(
    organizationId: string,
    id: string,
    patch: Partial<{
      title: string;
      sequenceNo: number;
      learningObjectives: string | null;
      status: string;
    }>,
    updatedAt: Date,
  ): Promise<void>;

  // --- Enrollment -------------------------------------------------------
  createEnrollment(row: {
    id: string;
    organizationId: string;
    studentUserId: string;
    courseId: string;
    academicPeriodId: string;
    enrolledAt: Date;
    source: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<EnrollmentRow>;
  findEnrollmentById(organizationId: string, id: string): Promise<EnrollmentRow | null>;
  findActiveEnrollment(
    organizationId: string,
    studentUserId: string,
    courseId: string,
  ): Promise<EnrollmentRow | null>;
  listEnrollmentsByCourse(organizationId: string, courseId: string): Promise<EnrollmentRow[]>;
  listEnrollmentsByStudent(organizationId: string, studentUserId: string): Promise<EnrollmentRow[]>;
  updateEnrollmentStatus(
    id: string,
    status: string,
    withdrawnAt: Date | null,
    updatedAt: Date,
  ): Promise<void>;
}

export function createAcademicStructureRepository(
  db: any,
  schema: any,
): AcademicStructureRepository {
  return {
    async userExists(organizationId, userId) {
      const rows = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.organizationId, organizationId), eq(schema.users.id, userId)));
      return rows.length > 0;
    },

    // --- AcademicPeriod ---------------------------------------------------
    async createAcademicPeriod(row) {
      await db.insert(schema.academicPeriods).values({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        status: "planned",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        status: "planned",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    async findAcademicPeriodById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.academicPeriods)
        .where(
          and(
            eq(schema.academicPeriods.organizationId, organizationId),
            eq(schema.academicPeriods.id, id),
          ),
        );
      return rows[0] ? toAcademicPeriodRow(rows[0]) : null;
    },

    async listAcademicPeriods(organizationId) {
      const rows = await db
        .select()
        .from(schema.academicPeriods)
        .where(eq(schema.academicPeriods.organizationId, organizationId));
      return rows.map(toAcademicPeriodRow);
    },

    async updateAcademicPeriod(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.academicPeriods)
        .set({ ...patch, updatedAt })
        .where(
          and(
            eq(schema.academicPeriods.organizationId, organizationId),
            eq(schema.academicPeriods.id, id),
          ),
        );
    },

    // --- Classroom ----------------------------------------------------------
    async createClassroom(row) {
      await db.insert(schema.classrooms).values({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        gradeLevel: row.gradeLevel,
        academicPeriodId: row.academicPeriodId,
        homeroomTeacherId: row.homeroomTeacherId,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        gradeLevel: row.gradeLevel,
        academicPeriodId: row.academicPeriodId,
        homeroomTeacherId: row.homeroomTeacherId,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: null,
      };
    },

    async findClassroomById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.classrooms)
        .where(
          and(
            eq(schema.classrooms.organizationId, organizationId),
            eq(schema.classrooms.id, id),
            isNull(schema.classrooms.deletedAt),
          ),
        );
      return rows[0] ? toClassroomRow(rows[0]) : null;
    },

    async listClassrooms(organizationId, filters) {
      const conditions = [
        eq(schema.classrooms.organizationId, organizationId),
        isNull(schema.classrooms.deletedAt),
      ];
      if (filters?.academicPeriodId) {
        conditions.push(eq(schema.classrooms.academicPeriodId, filters.academicPeriodId));
      }
      const rows = await db
        .select()
        .from(schema.classrooms)
        .where(and(...conditions));
      return rows.map(toClassroomRow);
    },

    async updateClassroom(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.classrooms)
        .set({ ...patch, updatedAt })
        .where(
          and(eq(schema.classrooms.organizationId, organizationId), eq(schema.classrooms.id, id)),
        );
    },

    // --- Group ----------------------------------------------------------------
    async createGroup(row) {
      await db.insert(schema.groups).values({
        id: row.id,
        organizationId: row.organizationId,
        classroomId: row.classroomId,
        name: row.name,
        purpose: row.purpose,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        classroomId: row.classroomId,
        name: row.name,
        purpose: row.purpose,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: null,
      };
    },

    async findGroupById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.groups)
        .where(
          and(
            eq(schema.groups.organizationId, organizationId),
            eq(schema.groups.id, id),
            isNull(schema.groups.deletedAt),
          ),
        );
      return rows[0] ? toGroupRow(rows[0]) : null;
    },

    async listGroupsByClassroom(organizationId, classroomId) {
      const rows = await db
        .select()
        .from(schema.groups)
        .where(
          and(
            eq(schema.groups.organizationId, organizationId),
            eq(schema.groups.classroomId, classroomId),
            isNull(schema.groups.deletedAt),
          ),
        );
      return rows.map(toGroupRow);
    },

    async updateGroup(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.groups)
        .set({ ...patch, updatedAt })
        .where(and(eq(schema.groups.organizationId, organizationId), eq(schema.groups.id, id)));
    },

    // --- Membership -------------------------------------------------------
    async createMembership(row) {
      await db.insert(schema.memberships).values({
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        containerType: row.containerType,
        containerId: row.containerId,
        roleInContainer: row.roleInContainer,
        joinedAt: row.joinedAt,
        leftAt: null,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        containerType: row.containerType,
        containerId: row.containerId,
        roleInContainer: row.roleInContainer,
        joinedAt: row.joinedAt,
        leftAt: null,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    async findMembershipById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.memberships)
        .where(
          and(eq(schema.memberships.organizationId, organizationId), eq(schema.memberships.id, id)),
        );
      return rows[0] ? toMembershipRow(rows[0]) : null;
    },

    async listMembershipsForContainer(organizationId, containerType, containerId) {
      const rows = await db
        .select()
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.organizationId, organizationId),
            eq(schema.memberships.containerType, containerType),
            eq(schema.memberships.containerId, containerId),
          ),
        );
      return rows.map(toMembershipRow);
    },

    async listActiveClassroomMembershipsForUser(organizationId, userId) {
      const rows = await db
        .select({
          id: schema.memberships.id,
          organizationId: schema.memberships.organizationId,
          userId: schema.memberships.userId,
          containerType: schema.memberships.containerType,
          containerId: schema.memberships.containerId,
          roleInContainer: schema.memberships.roleInContainer,
          joinedAt: schema.memberships.joinedAt,
          leftAt: schema.memberships.leftAt,
          status: schema.memberships.status,
          createdBy: schema.memberships.createdBy,
          createdAt: schema.memberships.createdAt,
          updatedAt: schema.memberships.updatedAt,
          academicPeriodId: schema.classrooms.academicPeriodId,
        })
        .from(schema.memberships)
        .innerJoin(
          schema.classrooms,
          and(
            eq(schema.memberships.containerId, schema.classrooms.id),
            eq(schema.memberships.organizationId, schema.classrooms.organizationId),
          ),
        )
        .where(
          and(
            eq(schema.memberships.organizationId, organizationId),
            eq(schema.memberships.userId, userId),
            eq(schema.memberships.containerType, "classroom"),
            eq(schema.memberships.status, "active"),
            isNull(schema.memberships.leftAt),
          ),
        );
      return rows.map((r: any) => ({
        ...toMembershipRow(r),
        academicPeriodId: r.academicPeriodId,
      }));
    },

    async endMembership(id, leftAt, updatedAt) {
      await db
        .update(schema.memberships)
        .set({ leftAt, status: "ended", updatedAt })
        .where(eq(schema.memberships.id, id));
    },

    // --- Subject ------------------------------------------------------------
    async createSubject(row) {
      await db.insert(schema.subjects).values({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        code: row.code,
        description: row.description,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        code: row.code,
        description: row.description,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: null,
      };
    },

    async findSubjectById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.subjects)
        .where(
          and(
            eq(schema.subjects.organizationId, organizationId),
            eq(schema.subjects.id, id),
            isNull(schema.subjects.deletedAt),
          ),
        );
      return rows[0] ? toSubjectRow(rows[0]) : null;
    },

    async findSubjectByCode(organizationId, code) {
      const rows = await db
        .select()
        .from(schema.subjects)
        .where(
          and(
            eq(schema.subjects.organizationId, organizationId),
            eq(schema.subjects.code, code),
            isNull(schema.subjects.deletedAt),
          ),
        );
      return rows[0] ? toSubjectRow(rows[0]) : null;
    },

    async listSubjects(organizationId) {
      const rows = await db
        .select()
        .from(schema.subjects)
        .where(
          and(
            eq(schema.subjects.organizationId, organizationId),
            isNull(schema.subjects.deletedAt),
          ),
        );
      return rows.map(toSubjectRow);
    },

    async updateSubject(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.subjects)
        .set({ ...patch, updatedAt })
        .where(and(eq(schema.subjects.organizationId, organizationId), eq(schema.subjects.id, id)));
    },

    // --- Course -------------------------------------------------------------
    async createCourse(row) {
      await db.insert(schema.courses).values({
        id: row.id,
        organizationId: row.organizationId,
        subjectId: row.subjectId,
        title: row.title,
        description: row.description,
        ownerTeacherId: row.ownerTeacherId,
        academicPeriodId: row.academicPeriodId,
        visibility: row.visibility,
        status: "draft",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        subjectId: row.subjectId,
        title: row.title,
        description: row.description,
        ownerTeacherId: row.ownerTeacherId,
        academicPeriodId: row.academicPeriodId,
        visibility: row.visibility,
        status: "draft",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: null,
      };
    },

    async findCourseById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.courses)
        .where(
          and(
            eq(schema.courses.organizationId, organizationId),
            eq(schema.courses.id, id),
            isNull(schema.courses.deletedAt),
          ),
        );
      return rows[0] ? toCourseRow(rows[0]) : null;
    },

    async listCourses(organizationId, filters) {
      const conditions = [
        eq(schema.courses.organizationId, organizationId),
        isNull(schema.courses.deletedAt),
      ];
      if (filters?.subjectId) conditions.push(eq(schema.courses.subjectId, filters.subjectId));
      if (filters?.status) conditions.push(eq(schema.courses.status, filters.status));
      const rows = await db
        .select()
        .from(schema.courses)
        .where(and(...conditions));
      return rows.map(toCourseRow);
    },

    async updateCourse(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.courses)
        .set({ ...patch, updatedAt })
        .where(and(eq(schema.courses.organizationId, organizationId), eq(schema.courses.id, id)));
    },

    // --- Course co-teachers -------------------------------------------------
    async addCourseCoTeacher(row) {
      await db.insert(schema.userRoleAssignments).values({
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        roleId: row.roleId,
        scopeType: "COURSE",
        scopeId: row.courseId,
        grantedBy: row.grantedBy,
        validFrom: row.validFrom,
        validUntil: null,
        status: "active",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        courseId: row.courseId,
        status: "active",
        grantedBy: row.grantedBy,
        validFrom: row.validFrom,
        validUntil: null,
      };
    },

    async findActiveCourseCoTeacher(organizationId, courseId, userId) {
      const rows = await db
        .select()
        .from(schema.userRoleAssignments)
        .where(
          and(
            eq(schema.userRoleAssignments.organizationId, organizationId),
            eq(schema.userRoleAssignments.scopeType, "COURSE"),
            eq(schema.userRoleAssignments.scopeId, courseId),
            eq(schema.userRoleAssignments.userId, userId),
            eq(schema.userRoleAssignments.status, "active"),
          ),
        );
      return rows[0] ? toCoTeacherRow(rows[0]) : null;
    },

    async listCourseCoTeachers(organizationId, courseId) {
      const rows = await db
        .select()
        .from(schema.userRoleAssignments)
        .where(
          and(
            eq(schema.userRoleAssignments.organizationId, organizationId),
            eq(schema.userRoleAssignments.scopeType, "COURSE"),
            eq(schema.userRoleAssignments.scopeId, courseId),
            eq(schema.userRoleAssignments.status, "active"),
          ),
        );
      return rows.map(toCoTeacherRow);
    },

    async revokeCourseCoTeacher(id, revokedAt) {
      await db
        .update(schema.userRoleAssignments)
        .set({ status: "revoked", validUntil: revokedAt, updatedAt: revokedAt })
        .where(eq(schema.userRoleAssignments.id, id));
    },

    // --- CourseAudience -------------------------------------------------------
    async addCourseAudience(row) {
      await db.insert(schema.courseAudiences).values({
        id: row.id,
        organizationId: row.organizationId,
        courseId: row.courseId,
        targetType: row.targetType,
        targetId: row.targetId,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        courseId: row.courseId,
        targetType: row.targetType,
        targetId: row.targetId,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      };
    },

    async findCourseAudience(organizationId, courseId, targetType, targetId) {
      const rows = await db
        .select()
        .from(schema.courseAudiences)
        .where(
          and(
            eq(schema.courseAudiences.organizationId, organizationId),
            eq(schema.courseAudiences.courseId, courseId),
            eq(schema.courseAudiences.targetType, targetType),
            eq(schema.courseAudiences.targetId, targetId),
          ),
        );
      return rows[0] ? toCourseAudienceRow(rows[0]) : null;
    },

    async listCourseAudiences(organizationId, courseId) {
      const rows = await db
        .select()
        .from(schema.courseAudiences)
        .where(
          and(
            eq(schema.courseAudiences.organizationId, organizationId),
            eq(schema.courseAudiences.courseId, courseId),
          ),
        );
      return rows.map(toCourseAudienceRow);
    },

    async removeCourseAudience(organizationId, id) {
      await db
        .delete(schema.courseAudiences)
        .where(
          and(
            eq(schema.courseAudiences.organizationId, organizationId),
            eq(schema.courseAudiences.id, id),
          ),
        );
    },

    // --- Cycle ----------------------------------------------------------------
    async createCycle(row) {
      await db.insert(schema.cycles).values({
        id: row.id,
        organizationId: row.organizationId,
        courseId: row.courseId,
        title: row.title,
        sequenceNo: row.sequenceNo,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        courseId: row.courseId,
        title: row.title,
        sequenceNo: row.sequenceNo,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    async findCycleById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.cycles)
        .where(and(eq(schema.cycles.organizationId, organizationId), eq(schema.cycles.id, id)));
      return rows[0] ? toCycleRow(rows[0]) : null;
    },

    async listCyclesByCourse(organizationId, courseId) {
      const rows = await db
        .select()
        .from(schema.cycles)
        .where(
          and(
            eq(schema.cycles.organizationId, organizationId),
            eq(schema.cycles.courseId, courseId),
          ),
        );
      return rows.map(toCycleRow);
    },

    async findCycleBySequence(organizationId, courseId, sequenceNo) {
      const rows = await db
        .select()
        .from(schema.cycles)
        .where(
          and(
            eq(schema.cycles.organizationId, organizationId),
            eq(schema.cycles.courseId, courseId),
            eq(schema.cycles.sequenceNo, sequenceNo),
          ),
        );
      return rows[0] ? toCycleRow(rows[0]) : null;
    },

    async updateCycle(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.cycles)
        .set({ ...patch, updatedAt })
        .where(and(eq(schema.cycles.organizationId, organizationId), eq(schema.cycles.id, id)));
    },

    // --- Topic ------------------------------------------------------------
    async createTopic(row) {
      await db.insert(schema.topics).values({
        id: row.id,
        organizationId: row.organizationId,
        cycleId: row.cycleId,
        title: row.title,
        sequenceNo: row.sequenceNo,
        learningObjectives: row.learningObjectives,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        cycleId: row.cycleId,
        title: row.title,
        sequenceNo: row.sequenceNo,
        learningObjectives: row.learningObjectives,
        status: "active",
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    async findTopicById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.topics)
        .where(and(eq(schema.topics.organizationId, organizationId), eq(schema.topics.id, id)));
      return rows[0] ? toTopicRow(rows[0]) : null;
    },

    async listTopicsByCycle(organizationId, cycleId) {
      const rows = await db
        .select()
        .from(schema.topics)
        .where(
          and(eq(schema.topics.organizationId, organizationId), eq(schema.topics.cycleId, cycleId)),
        );
      return rows.map(toTopicRow);
    },

    async findTopicBySequence(organizationId, cycleId, sequenceNo) {
      const rows = await db
        .select()
        .from(schema.topics)
        .where(
          and(
            eq(schema.topics.organizationId, organizationId),
            eq(schema.topics.cycleId, cycleId),
            eq(schema.topics.sequenceNo, sequenceNo),
          ),
        );
      return rows[0] ? toTopicRow(rows[0]) : null;
    },

    async updateTopic(organizationId, id, patch, updatedAt) {
      await db
        .update(schema.topics)
        .set({ ...patch, updatedAt })
        .where(and(eq(schema.topics.organizationId, organizationId), eq(schema.topics.id, id)));
    },

    // --- Enrollment -------------------------------------------------------
    async createEnrollment(row) {
      await db.insert(schema.enrollments).values({
        id: row.id,
        organizationId: row.organizationId,
        studentUserId: row.studentUserId,
        courseId: row.courseId,
        academicPeriodId: row.academicPeriodId,
        enrolledAt: row.enrolledAt,
        withdrawnAt: null,
        // SRS §45.3: Enrollment starts REQUESTED, not ACTIVE — see
        // service.ts's createEnrollment/activateEnrollment.
        status: "requested",
        source: row.source,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      return {
        id: row.id,
        organizationId: row.organizationId,
        studentUserId: row.studentUserId,
        courseId: row.courseId,
        academicPeriodId: row.academicPeriodId,
        enrolledAt: row.enrolledAt,
        withdrawnAt: null,
        // SRS §45.3: Enrollment starts REQUESTED, not ACTIVE — see
        // service.ts's createEnrollment/activateEnrollment.
        status: "requested",
        source: row.source,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    async findEnrollmentById(organizationId, id) {
      const rows = await db
        .select()
        .from(schema.enrollments)
        .where(
          and(eq(schema.enrollments.organizationId, organizationId), eq(schema.enrollments.id, id)),
        );
      return rows[0] ? toEnrollmentRow(rows[0]) : null;
    },

    async findActiveEnrollment(organizationId, studentUserId, courseId) {
      const rows = await db
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.organizationId, organizationId),
            eq(schema.enrollments.studentUserId, studentUserId),
            eq(schema.enrollments.courseId, courseId),
            ne(schema.enrollments.status, "withdrawn"),
          ),
        );
      return rows[0] ? toEnrollmentRow(rows[0]) : null;
    },

    async listEnrollmentsByCourse(organizationId, courseId) {
      const rows = await db
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.organizationId, organizationId),
            eq(schema.enrollments.courseId, courseId),
          ),
        );
      return rows.map(toEnrollmentRow);
    },

    async listEnrollmentsByStudent(organizationId, studentUserId) {
      const rows = await db
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.organizationId, organizationId),
            eq(schema.enrollments.studentUserId, studentUserId),
          ),
        );
      return rows.map(toEnrollmentRow);
    },

    async updateEnrollmentStatus(id, status, withdrawnAt, updatedAt) {
      await db
        .update(schema.enrollments)
        .set({ status, withdrawnAt, updatedAt })
        .where(eq(schema.enrollments.id, id));
    },
  };
}
