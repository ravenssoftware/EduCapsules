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
 * /api/v1/classrooms (SRS §9, CLS-*) — the real academic-structure module's
 * Classroom surface. Replaces the Phase 5 ../modules/classrooms/
 * demonstrator entirely; that module's own header comment named this one as
 * its intended successor from the start.
 */

export const classrooms = new Hono<AppEnv>();

classrooms.use("*", requireSession());

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

classrooms.get("/", async (c) => {
  const session = c.get("session")!;
  const academicPeriodId = c.req.query("academicPeriodId");
  const list = await service.listClassrooms(
    deps(c),
    { organizationId: session.organizationId, userId: session.userId },
    academicPeriodId ? { academicPeriodId } : undefined,
  );
  return c.json({ classrooms: list });
});

classrooms.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const classroom = await service.getClassroom(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ classroom });
  } catch (err) {
    throw toHttpException(err);
  }
});

classrooms.post("/", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const name = typeof body["name"] === "string" ? body["name"] : "";
  const gradeLevel = typeof body["gradeLevel"] === "string" ? body["gradeLevel"] : null;
  const academicPeriodId =
    typeof body["academicPeriodId"] === "string" ? body["academicPeriodId"] : "";
  const homeroomTeacherId =
    typeof body["homeroomTeacherId"] === "string" ? body["homeroomTeacherId"] : null;

  try {
    const classroom = await service.createClassroom(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      { name, gradeLevel, academicPeriodId, homeroomTeacherId },
      { loginSessionId: session.id },
    );
    return c.json({ classroom }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

classrooms.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: {
    name?: string;
    gradeLevel?: string | null;
    homeroomTeacherId?: string | null;
    status?: "active" | "archived";
  } = {};
  if (typeof body["name"] === "string") patch.name = body["name"];
  if (typeof body["gradeLevel"] === "string" || body["gradeLevel"] === null) {
    patch.gradeLevel = body["gradeLevel"] as string | null;
  }
  if (typeof body["homeroomTeacherId"] === "string" || body["homeroomTeacherId"] === null) {
    patch.homeroomTeacherId = body["homeroomTeacherId"] as string | null;
  }
  if (body["status"] === "active" || body["status"] === "archived") patch.status = body["status"];

  try {
    const classroom = await service.updateClassroom(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ classroom });
  } catch (err) {
    throw toHttpException(err);
  }
});

// --- Nested Group surface (GRP-001: a Group belongs to exactly one Classroom) ---

classrooms.get("/:id/groups", async (c) => {
  const session = c.get("session")!;
  try {
    const groups = await service.listGroups(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ groups });
  } catch (err) {
    throw toHttpException(err);
  }
});

classrooms.post("/:id/groups", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const name = typeof body["name"] === "string" ? body["name"] : "";
  const purpose = typeof body["purpose"] === "string" ? body["purpose"] : null;

  try {
    const group = await service.createGroup(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { name, purpose },
      { loginSessionId: session.id },
    );
    return c.json({ group }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});
