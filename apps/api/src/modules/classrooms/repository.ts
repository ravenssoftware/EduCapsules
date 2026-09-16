import { and, eq, isNull } from "drizzle-orm";

/**
 * Minimal read/patch access for Classroom — NOT the real academic-structure
 * module (that is Phase 6's, per the Phase 0 roadmap's own phase map). This
 * exists solely so Phase 5 has at least one real, protected resource to
 * prove the authz pipeline against end-to-end (list/get = relationship
 * check, patch = MANAGE_CLASSROOM permission check) — see
 * ../../routes/classrooms.ts. No other classroom feature (create, delete,
 * Group/Course wiring, etc.) is built here.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ClassroomRow {
  id: string;
  organizationId: string;
  name: string;
  gradeLevel: string | null;
  academicPeriodId: string;
  homeroomTeacherId: string | null;
  status: string;
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
  };
}

export interface ClassroomsRepository {
  listClassrooms(organizationId: string): Promise<ClassroomRow[]>;
  findClassroomById(organizationId: string, id: string): Promise<ClassroomRow | null>;
  patchClassroom(
    organizationId: string,
    id: string,
    patch: Partial<{ name: string; gradeLevel: string | null; status: string }>,
  ): Promise<void>;
}

export function createClassroomsRepository(db: any, schema: any): ClassroomsRepository {
  return {
    async listClassrooms(organizationId) {
      const rows = await db
        .select()
        .from(schema.classrooms)
        .where(
          and(
            eq(schema.classrooms.organizationId, organizationId),
            isNull(schema.classrooms.deletedAt),
          ),
        );
      return rows.map(toClassroomRow);
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

    async patchClassroom(organizationId, id, patch) {
      await db
        .update(schema.classrooms)
        .set({ ...patch, updatedAt: new Date() })
        .where(
          and(eq(schema.classrooms.organizationId, organizationId), eq(schema.classrooms.id, id)),
        );
    },
  };
}
