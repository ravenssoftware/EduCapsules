import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types.js";
import { requireSession } from "../modules/auth/middleware.js";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "../modules/authz/errors.js";
import {
  ACADEMIC_STRUCTURE_ERROR_STATUS,
  AcademicStructureDomainError,
} from "../modules/academic-structure/errors.js";
import * as service from "../modules/academic-structure/service.js";

/**
 * /api/v1/courses (SRS §10, CRS-*) and /api/v1/subjects/:id/courses
 * (creation, nested under Subject — CRS-001: "belonging to exactly one
 * Subject"). Publish/unpublish/archive are dedicated action endpoints
 * (CRS-008: publishing is an explicit action, separate from creation),
 * mirroring the Phase 5 ParentLink `/confirm` pattern. Co-teacher
 * (CRS-009/010) and CourseAudience management are nested under the Course.
 */

export const courses = new Hono<AppEnv>();
export const subjectCourses = new Hono<AppEnv>();

courses.use("*", requireSession());
subjectCourses.use("*", requireSession());

function toHttpException(err: unknown): HTTPException {
  if (err instanceof AuthzDomainError) {
    return new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
  }
  if (err instanceof AcademicStructureDomainError) {
    return new HTTPException(ACADEMIC_STRUCTURE_ERROR_STATUS[err.code] as 400, {
      message: err.message,
    });
  }
  throw err;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch {
    throw new HTTPException(422, { message: "Request body must be valid JSON." });
  }
}

function deps(c: Context<AppEnv>): service.Deps {
  return { repo: c.get("academicStructureRepository"), authzRepo: c.get("authzRepository") };
}

courses.get("/", async (c) => {
  const session = c.get("session")!;
  const subjectId = c.req.query("subjectId");
  const status = c.req.query("status");
  const filters: { subjectId?: string; status?: string } = {};
  if (subjectId) filters.subjectId = subjectId;
  if (status) filters.status = status;
  const list = await service.listCourses(
    deps(c),
    { organizationId: session.organizationId, userId: session.userId },
    filters,
  );
  return c.json({ courses: list });
});

courses.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const course = await service.getCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ course });
  } catch (err) {
    throw toHttpException(err);
  }
});

subjectCourses.post("/", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const title = typeof body["title"] === "string" ? body["title"] : "";
  const description = typeof body["description"] === "string" ? body["description"] : null;
  const academicPeriodId =
    typeof body["academicPeriodId"] === "string" ? body["academicPeriodId"] : "";
  const createInput: {
    subjectId: string;
    title: string;
    description: string | null;
    academicPeriodId: string;
    visibility?: string;
  } = { subjectId: c.req.param("id")!, title, description, academicPeriodId };
  if (typeof body["visibility"] === "string") createInput.visibility = body["visibility"];

  try {
    const course = await service.createCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      createInput,
      { loginSessionId: session.id },
    );
    return c.json({ course }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: { title?: string; description?: string | null; visibility?: string } = {};
  if (typeof body["title"] === "string") patch.title = body["title"];
  if (typeof body["description"] === "string" || body["description"] === null) {
    patch.description = body["description"] as string | null;
  }
  if (typeof body["visibility"] === "string") patch.visibility = body["visibility"];

  try {
    const course = await service.updateCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ course });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/publish", async (c) => {
  const session = c.get("session")!;
  try {
    const course = await service.publishCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { loginSessionId: session.id },
    );
    return c.json({ course });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/unpublish", async (c) => {
  const session = c.get("session")!;
  try {
    const course = await service.unpublishCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { loginSessionId: session.id },
    );
    return c.json({ course });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/archive", async (c) => {
  const session = c.get("session")!;
  try {
    const course = await service.archiveCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { loginSessionId: session.id },
    );
    return c.json({ course });
  } catch (err) {
    throw toHttpException(err);
  }
});

// --- Co-teachers (CRS-009/010) -------------------------------------------

courses.get("/:id/co-teachers", async (c) => {
  const session = c.get("session")!;
  try {
    const coTeachers = await service.listCoTeachers(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ coTeachers });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/co-teachers", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const coTeacherUserId = typeof body["userId"] === "string" ? body["userId"] : "";

  try {
    const coTeacher = await service.addCoTeacher(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      coTeacherUserId,
      { loginSessionId: session.id },
    );
    return c.json({ coTeacher }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.delete("/:id/co-teachers/:userId", async (c) => {
  const session = c.get("session")!;
  try {
    await service.removeCoTeacher(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      c.req.param("userId"),
      { loginSessionId: session.id },
    );
    return c.json({ status: "removed" });
  } catch (err) {
    throw toHttpException(err);
  }
});

// --- CourseAudience (targeting) -------------------------------------------

courses.get("/:id/audiences", async (c) => {
  const session = c.get("session")!;
  try {
    const audiences = await service.listCourseAudiences(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ audiences });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/audiences", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const targetType = body["targetType"];
  const targetId = typeof body["targetId"] === "string" ? body["targetId"] : "";
  if (targetType !== "classroom" && targetType !== "group") {
    throw new HTTPException(422, { message: '"targetType" must be "classroom" or "group".' });
  }

  try {
    const audience = await service.addCourseAudience(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { targetType, targetId },
      { loginSessionId: session.id },
    );
    return c.json({ audience }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.delete("/:id/audiences/:audienceId", async (c) => {
  const session = c.get("session")!;
  try {
    await service.removeCourseAudience(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      c.req.param("audienceId"),
      { loginSessionId: session.id },
    );
    return c.json({ status: "removed" });
  } catch (err) {
    throw toHttpException(err);
  }
});

// --- Cycles (nested creation — see ../routes/cycles.js for the standalone surface) ---

courses.get("/:id/cycles", async (c) => {
  const session = c.get("session")!;
  try {
    const cycles = await service.listCycles(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ cycles });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/cycles", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const title = typeof body["title"] === "string" ? body["title"] : "";
  const sequenceNo = typeof body["sequenceNo"] === "number" ? body["sequenceNo"] : NaN;
  const startsOn = typeof body["startsOn"] === "string" ? body["startsOn"] : null;
  const endsOn = typeof body["endsOn"] === "string" ? body["endsOn"] : null;

  try {
    const cycle = await service.createCycle(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { title, sequenceNo, startsOn, endsOn },
      { loginSessionId: session.id },
    );
    return c.json({ cycle }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

// --- Enrollments (nested creation — see ../routes/enrollments.js for withdraw) ---

courses.get("/:id/enrollments", async (c) => {
  const session = c.get("session")!;
  try {
    const list = await service.listEnrollmentsForCourse(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ enrollments: list });
  } catch (err) {
    throw toHttpException(err);
  }
});

courses.post("/:id/enrollments", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const studentUserId = typeof body["studentUserId"] === "string" ? body["studentUserId"] : "";
  const source = typeof body["source"] === "string" ? body["source"] : null;

  try {
    const enrollment = await service.createEnrollment(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { studentUserId, source },
      { loginSessionId: session.id },
    );
    return c.json({ enrollment }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});
