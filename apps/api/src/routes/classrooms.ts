import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types.js";
import { requireSession } from "../modules/auth/middleware.js";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "../modules/authz/errors.js";
import { authorize, resolveAuthoritySources } from "../modules/authz/service.js";
import { requirePermission } from "../modules/authz/middleware.js";

/**
 * A minimal, deliberately narrow Classroom read/manage surface — NOT the
 * real academic-structure module (Phase 6's, per the Phase 0 roadmap).
 * This exists to prove the Phase 5 authorization pipeline end-to-end
 * against a real protected resource: list/get exercise the relationship
 * stage, PATCH exercises the permission stage (MANAGE_CLASSROOM).
 */

export const classrooms = new Hono<AppEnv>();

classrooms.use("*", requireSession());

function toHttpException(err: unknown): HTTPException {
  if (err instanceof AuthzDomainError) {
    return new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
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

// GEN-025/SEC-009: listing never reveals a classroom the caller has no
// relationship to — each candidate row is independently authorized and
// silently omitted on denial, exactly like a single-object 404 would be,
// rather than the list endpoint itself ever failing closed-but-visibly.
classrooms.get("/", async (c) => {
  const session = c.get("session")!;
  const authzRepo = c.get("authzRepository");
  const classroomsRepo = c.get("classroomsRepository");
  const all = await classroomsRepo.listClassrooms(session.organizationId);

  const visible = [];
  for (const classroom of all) {
    const sources = await resolveAuthoritySources(
      authzRepo,
      { organizationId: session.organizationId, userId: session.userId },
      { scopeType: "CLASSROOM", scopeId: classroom.id, objectId: classroom.id },
      new Date(),
    );
    if (sources.length > 0) visible.push(classroom);
  }

  return c.json({ classrooms: visible });
});

classrooms.get("/:id", async (c) => {
  const session = c.get("session")!;
  const authzRepo = c.get("authzRepository");
  const classroomsRepo = c.get("classroomsRepository");
  const id = c.req.param("id");

  try {
    await authorize(
      authzRepo,
      { organizationId: session.organizationId, userId: session.userId },
      { scopeType: "CLASSROOM", scopeId: id, objectId: id },
      new Date(),
    );
  } catch (err) {
    throw toHttpException(err);
  }

  const classroom = await classroomsRepo.findClassroomById(session.organizationId, id);
  if (!classroom) throw new HTTPException(404, { message: "Not found." });
  return c.json({ classroom });
});

classrooms.patch(
  "/:id",
  requirePermission("MANAGE_CLASSROOM", (c) => {
    const id = c.req.param("id")!;
    return { scopeType: "CLASSROOM", scopeId: id, objectId: id };
  }),
  async (c) => {
    const session = c.get("session")!;
    const authzRepo = c.get("authzRepository");
    const classroomsRepo = c.get("classroomsRepository");
    const id = c.req.param("id");
    const body = await readJsonBody(c.req.raw);

    const existing = await classroomsRepo.findClassroomById(session.organizationId, id);
    if (!existing) throw new HTTPException(404, { message: "Not found." });

    const patch: Partial<{ name: string; gradeLevel: string | null; status: string }> = {};
    if (typeof body["name"] === "string") patch.name = body["name"];
    if (typeof body["gradeLevel"] === "string" || body["gradeLevel"] === null) {
      patch.gradeLevel = body["gradeLevel"] as string | null;
    }
    if (typeof body["status"] === "string") patch.status = body["status"];

    await classroomsRepo.patchClassroom(session.organizationId, id, patch);
    await authzRepo.writeAuditEvent({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      actorRole: null,
      action: "CLASSROOM_UPDATED",
      targetType: "classroom",
      targetId: id,
      ipHash: null,
      loginSessionId: session.id,
      occurredAt: new Date(),
      reason: null,
    });

    const updated = await classroomsRepo.findClassroomById(session.organizationId, id);
    return c.json({ classroom: updated });
  },
);
